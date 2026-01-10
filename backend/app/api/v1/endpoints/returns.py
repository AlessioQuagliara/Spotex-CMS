"""
Return and refund endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import joinedload
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.order import Order, OrderItem, Payment, PaymentStatus
from app.models.return_model import OrderReturn, ReturnStatus, ReturnStatusHistory
from app.schemas.return_schema import *
from app.utils.payment import StripePaymentService, generate_order_number
from app.utils.order_notifications import OrderNotificationService

router = APIRouter()


@router.post("/", response_model=ReturnResponse, status_code=status.HTTP_201_CREATED)
async def create_return_request(
    order_id: int,
    return_data: CreateReturnRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create return/refund request"""
    # Get order with items
    result = await db.execute(
        select(Order)
        .options(joinedload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify ownership
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if order is eligible for return
    if order.status not in ['delivered', 'shipped']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not eligible for return"
        )
    
    # Calculate refund amount
    refund_amount = Decimal('0')
    return_items = []
    
    for item_request in return_data.items:
        # Find order item
        order_item = next((item for item in order.items if item.id == item_request.order_item_id), None)
        
        if not order_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order item {item_request.order_item_id} not found"
            )
        
        if item_request.quantity > order_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Return quantity exceeds order quantity for item {order_item.product_name}"
            )
        
        # Calculate refund for this item
        item_refund = Decimal(str(order_item.unit_price)) * item_request.quantity
        refund_amount += item_refund
        
        return_items.append({
            'order_item_id': item_request.order_item_id,
            'product_name': order_item.product_name,
            'quantity': item_request.quantity,
            'refund_amount': float(item_refund),
            'reason': item_request.reason
        })
    
    # Generate return number
    return_number = f"RET-{generate_order_number()[4:]}"
    
    # Create return request
    order_return = OrderReturn(
        return_number=return_number,
        order_id=order_id,
        status=ReturnStatus.REQUESTED,
        reason=return_data.reason,
        reason_detail=return_data.reason_detail,
        items=return_items,
        refund_amount=float(refund_amount),
        images=return_data.images
    )
    
    db.add(order_return)
    await db.flush()
    
    # Create status history
    status_history = ReturnStatusHistory(
        return_id=order_return.id,
        new_status=ReturnStatus.REQUESTED,
        note="Return request created",
        changed_by=current_user.id
    )
    db.add(status_history)
    
    await db.commit()
    await db.refresh(order_return)
    
    # Load order details
    order_result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = order_result.scalar_one()
    
    response = ReturnResponse(
        id=order_return.id,
        return_number=order_return.return_number,
        order_id=order_return.order_id,
        order_number=order.order_number,
        status=order_return.status,
        reason=order_return.reason,
        reason_detail=order_return.reason_detail,
        items=order_return.items,
        refund_amount=Decimal(str(order_return.refund_amount)),
        return_shipping_carrier=order_return.return_shipping_carrier,
        return_tracking_number=order_return.return_tracking_number,
        images=order_return.images,
        admin_notes=order_return.admin_notes,
        rejection_reason=order_return.rejection_reason,
        created_at=order_return.created_at,
        updated_at=order_return.updated_at,
        approved_at=order_return.approved_at,
        received_at=order_return.received_at,
        refunded_at=order_return.refunded_at,
        completed_at=order_return.completed_at
    )
    
    return response


@router.get("/", response_model=PaginatedReturnResponse)
async def list_returns(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[ReturnStatus] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user returns"""
    # Get user's orders
    orders_result = await db.execute(
        select(Order.id).where(Order.user_id == current_user.id)
    )
    order_ids = [row[0] for row in orders_result.fetchall()]
    
    if not order_ids:
        return PaginatedReturnResponse(items=[], total=0, page=page, per_page=per_page, pages=0)
    
    filters = [OrderReturn.order_id.in_(order_ids)]
    
    if status_filter:
        filters.append(OrderReturn.status == status_filter)
    
    # Count total
    count_result = await db.execute(
        select(func.count(OrderReturn.id)).where(and_(*filters))
    )
    total = count_result.scalar()
    
    # Get returns
    query = (
        select(OrderReturn)
        .options(joinedload(OrderReturn.order))
        .where(and_(*filters))
        .order_by(desc(OrderReturn.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    
    result = await db.execute(query)
    returns = result.scalars().all()
    
    # Build response
    items = []
    for ret in returns:
        items.append(ReturnListResponse(
            id=ret.id,
            return_number=ret.return_number,
            order_id=ret.order_id,
            order_number=ret.order.order_number,
            status=ret.status,
            reason=ret.reason,
            refund_amount=Decimal(str(ret.refund_amount)),
            created_at=ret.created_at
        ))
    
    return PaginatedReturnResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )


@router.get("/{return_id}", response_model=ReturnResponse)
async def get_return(
    return_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get return details"""
    result = await db.execute(
        select(OrderReturn)
        .options(joinedload(OrderReturn.order))
        .where(OrderReturn.id == return_id)
    )
    order_return = result.scalar_one_or_none()
    
    if not order_return:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return not found"
        )
    
    # Verify ownership
    if order_return.order.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return ReturnResponse(
        id=order_return.id,
        return_number=order_return.return_number,
        order_id=order_return.order_id,
        order_number=order_return.order.order_number,
        status=order_return.status,
        reason=order_return.reason,
        reason_detail=order_return.reason_detail,
        items=order_return.items,
        refund_amount=Decimal(str(order_return.refund_amount)),
        return_shipping_carrier=order_return.return_shipping_carrier,
        return_tracking_number=order_return.return_tracking_number,
        images=order_return.images,
        admin_notes=order_return.admin_notes,
        rejection_reason=order_return.rejection_reason,
        created_at=order_return.created_at,
        updated_at=order_return.updated_at,
        approved_at=order_return.approved_at,
        received_at=order_return.received_at,
        refunded_at=order_return.refunded_at,
        completed_at=order_return.completed_at
    )


@router.put("/{return_id}/status", response_model=ReturnResponse)
async def update_return_status(
    return_id: int,
    status_data: UpdateReturnStatusRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update return status (admin only)"""
    result = await db.execute(
        select(OrderReturn)
        .options(joinedload(OrderReturn.order))
        .where(OrderReturn.id == return_id)
    )
    order_return = result.scalar_one_or_none()
    
    if not order_return:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return not found"
        )
    
    old_status = order_return.status
    order_return.status = status_data.status
    
    # Update timestamps
    if status_data.status == ReturnStatus.APPROVED:
        order_return.approved_at = datetime.now()
    elif status_data.status == ReturnStatus.RECEIVED:
        order_return.received_at = datetime.now()
    elif status_data.status == ReturnStatus.REFUNDED:
        order_return.refunded_at = datetime.now()
    elif status_data.status == ReturnStatus.COMPLETED:
        order_return.completed_at = datetime.now()
    
    # Update fields
    if status_data.admin_notes:
        order_return.admin_notes = status_data.admin_notes
    
    if status_data.rejection_reason:
        order_return.rejection_reason = status_data.rejection_reason
    
    if status_data.return_tracking_number:
        order_return.return_tracking_number = status_data.return_tracking_number
    
    if status_data.return_shipping_carrier:
        order_return.return_shipping_carrier = status_data.return_shipping_carrier
    
    # Add status history
    status_history = ReturnStatusHistory(
        return_id=order_return.id,
        old_status=old_status,
        new_status=status_data.status,
        note=status_data.admin_notes,
        changed_by=current_user.id
    )
    db.add(status_history)
    
    await db.commit()
    await db.refresh(order_return)
    
    return ReturnResponse(
        id=order_return.id,
        return_number=order_return.return_number,
        order_id=order_return.order_id,
        order_number=order_return.order.order_number,
        status=order_return.status,
        reason=order_return.reason,
        reason_detail=order_return.reason_detail,
        items=order_return.items,
        refund_amount=Decimal(str(order_return.refund_amount)),
        return_shipping_carrier=order_return.return_shipping_carrier,
        return_tracking_number=order_return.return_tracking_number,
        images=order_return.images,
        admin_notes=order_return.admin_notes,
        rejection_reason=order_return.rejection_reason,
        created_at=order_return.created_at,
        updated_at=order_return.updated_at,
        approved_at=order_return.approved_at,
        received_at=order_return.received_at,
        refunded_at=order_return.refunded_at,
        completed_at=order_return.completed_at
    )


@router.post("/{return_id}/refund")
async def process_refund(
    return_id: int,
    refund_data: ProcessRefundRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Process refund for return (admin only)"""
    result = await db.execute(
        select(OrderReturn)
        .options(joinedload(OrderReturn.order).joinedload(Order.payments))
        .where(OrderReturn.id == return_id)
    )
    order_return = result.scalar_one_or_none()
    
    if not order_return:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return not found"
        )
    
    if order_return.status != ReturnStatus.APPROVED and order_return.status != ReturnStatus.RECEIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Return must be approved or received before refunding"
        )
    
    # Determine refund amount
    refund_amount = refund_data.amount or Decimal(str(order_return.refund_amount))
    
    if refund_amount > Decimal(str(order_return.refund_amount)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refund amount exceeds return amount"
        )
    
    # Find original payment
    order = order_return.order
    payment = next((p for p in order.payments if p.payment_status == PaymentStatus.COMPLETED), None)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No completed payment found for this order"
        )
    
    # Process refund via payment gateway
    try:
        if payment.stripe_charge_id:
            refund_result = await StripePaymentService.create_refund(
                charge_id=payment.stripe_charge_id,
                amount=refund_amount,
                reason=refund_data.reason
            )
            
            # Update payment record
            payment.refund_amount = float(refund_amount)
            payment.refund_reason = refund_data.reason
            payment.refunded_at = datetime.now()
            
            if refund_amount >= Decimal(str(payment.amount)):
                payment.payment_status = PaymentStatus.REFUNDED
        
        # Update return status
        order_return.status = ReturnStatus.REFUNDED
        order_return.refunded_at = datetime.now()
        
        # Update order status
        order.status = 'refunded'
        
        # Add status history
        status_history = ReturnStatusHistory(
            return_id=order_return.id,
            old_status=order_return.status,
            new_status=ReturnStatus.REFUNDED,
            note=f"Refund processed: €{refund_amount}",
            changed_by=current_user.id
        )
        db.add(status_history)
        
        await db.commit()
        
        # Send refund notification
        await OrderNotificationService.send_refund_notification(
            order=order,
            refund_amount=refund_amount,
            reason=refund_data.reason
        )
        
        return {
            "message": "Refund processed successfully",
            "refund_amount": refund_amount,
            "refund_id": refund_result.get('refund_id')
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Refund error: {str(e)}"
        )


@router.get("/admin/all", response_model=PaginatedReturnResponse)
async def list_all_returns_admin(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[ReturnStatus] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all returns (admin only)"""
    filters = []
    
    if status_filter:
        filters.append(OrderReturn.status == status_filter)
    
    # Count total
    count_query = select(func.count(OrderReturn.id))
    if filters:
        count_query = count_query.where(and_(*filters))
    
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get returns
    query = select(OrderReturn).options(joinedload(OrderReturn.order))
    
    if filters:
        query = query.where(and_(*filters))
    
    query = query.order_by(desc(OrderReturn.created_at)).offset((page - 1) * per_page).limit(per_page)
    
    result = await db.execute(query)
    returns = result.scalars().all()
    
    # Build response
    items = []
    for ret in returns:
        items.append(ReturnListResponse(
            id=ret.id,
            return_number=ret.return_number,
            order_id=ret.order_id,
            order_number=ret.order.order_number,
            status=ret.status,
            reason=ret.reason,
            refund_amount=Decimal(str(ret.refund_amount)),
            created_at=ret.created_at
        ))
    
    return PaginatedReturnResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )
