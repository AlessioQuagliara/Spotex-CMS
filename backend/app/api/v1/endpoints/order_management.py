"""
Order management endpoints for admin
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import io

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.schemas.order_admin import *
from app.utils.order_admin_service import OrderAdminService

router = APIRouter()


@router.get("/", response_model=dict)
async def get_orders_list(
    store_id: int,
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    customer_email: Optional[str] = Query(None),
    order_number: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    has_tracking: Optional[bool] = Query(None),
    sort_by: str = Query('created_at'),
    sort_order: str = Query('desc'),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get orders list with filters"""
    filters = {
        'status': status.split(',') if status else None,
        'payment_status': payment_status.split(',') if payment_status else None,
        'date_from': datetime.fromisoformat(date_from).date() if date_from else None,
        'date_to': datetime.fromisoformat(date_to).date() if date_to else None,
        'customer_email': customer_email,
        'order_number': order_number,
        'min_amount': min_amount,
        'max_amount': max_amount,
        'has_tracking': has_tracking,
        'sort_by': sort_by,
        'sort_order': sort_order
    }
    
    result = await OrderAdminService.get_orders_list(
        db=db,
        store_id=store_id,
        filters=filters,
        page=page,
        per_page=per_page
    )
    
    return result


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get complete order details"""
    order = await OrderAdminService.get_order_detail(db=db, order_id=order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return OrderDetailResponse(**order)


@router.put("/{order_id}/status", response_model=dict)
async def update_order_status(
    order_id: int,
    request: OrderStatusUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update order status"""
    result = await OrderAdminService.update_order_status(
        db=db,
        order_id=order_id,
        new_status=request.new_status,
        note=request.note,
        admin_id=current_user.id,
        send_notification=request.send_notification
    )
    
    if 'error' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result['error']
        )
    
    return result


@router.post("/bulk/status-update", response_model=dict)
async def bulk_update_status(
    request: OrderBulkStatusUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk update order status"""
    success = 0
    failed = 0
    errors = []
    
    for order_id in request.order_ids:
        try:
            result = await OrderAdminService.update_order_status(
                db=db,
                order_id=order_id,
                new_status=request.new_status,
                note=request.note,
                admin_id=current_user.id,
                send_notification=request.send_notifications
            )
            
            if 'error' in result:
                failed += 1
                errors.append({'order_id': order_id, 'error': result['error']})
            else:
                success += 1
        except Exception as e:
            failed += 1
            errors.append({'order_id': order_id, 'error': str(e)})
    
    return {
        'success': success,
        'failed': failed,
        'total': len(request.order_ids),
        'errors': errors
    }


@router.post("/manual", response_model=dict)
async def create_manual_order(
    store_id: int,
    request: ManualOrderCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create order manually"""
    result = await OrderAdminService.create_manual_order(
        db=db,
        store_id=store_id,
        order_data=request.model_dump()
    )
    
    if 'error' in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['error']
        )
    
    return result


@router.put("/{order_id}", response_model=dict)
async def update_order(
    order_id: int,
    request: OrderUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update order details"""
    from app.models.order import Order
    
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    await db.commit()
    
    return {'success': True, 'order_id': order_id}


@router.put("/{order_id}/tracking", response_model=dict)
async def update_tracking(
    order_id: int,
    request: OrderTrackingUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update order tracking information"""
    from app.models.order import Order, OrderStatus
    
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.tracking_number = request.tracking_number
    order.tracking_carrier = request.tracking_carrier
    
    # Auto-update status to shipped if not already
    if order.status in [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING]:
        order.status = OrderStatus.SHIPPED
        order.shipped_at = datetime.now()
    
    await db.commit()
    
    # Send notification
    if request.send_notification:
        try:
            from app.utils.order_notifications import OrderNotificationService
            notification_service = OrderNotificationService()
            await notification_service.send_shipping_notification(order)
        except Exception as e:
            print(f"Failed to send notification: {e}")
    
    return {'success': True, 'order_id': order_id}


@router.post("/{order_id}/refund", response_model=dict)
async def process_refund(
    order_id: int,
    request: OrderRefundRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Process order refund"""
    from app.models.order import Order, OrderStatus, PaymentStatus
    from app.utils.payment import StripePaymentService
    
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Process Stripe refund if payment intent exists
    if order.payment_intent_id:
        try:
            stripe_service = StripePaymentService()
            await stripe_service.create_refund(
                payment_intent_id=order.payment_intent_id,
                amount=float(request.amount),
                reason=request.reason
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stripe refund failed: {str(e)}"
            )
    
    # Update order
    order.status = OrderStatus.REFUNDED
    order.payment_status = PaymentStatus.REFUNDED
    
    await db.commit()
    
    # Send notification
    if request.send_notification:
        try:
            from app.utils.order_notifications import OrderNotificationService
            notification_service = OrderNotificationService()
            await notification_service.send_refund_notification(
                order=order,
                refund_amount=float(request.amount),
                refund_reason=request.reason
            )
        except Exception as e:
            print(f"Failed to send notification: {e}")
    
    return {
        'success': True,
        'order_id': order_id,
        'refund_amount': float(request.amount)
    }


@router.get("/statistics/summary", response_model=OrderStatistics)
async def get_order_statistics(
    store_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order statistics"""
    stats = await OrderAdminService.get_order_statistics(db=db, store_id=store_id)
    return OrderStatistics(**stats)


@router.get("/export/csv")
async def export_orders_csv(
    store_id: int,
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Export orders to CSV"""
    filters = {}
    
    if status:
        filters['status'] = status.split(',')
    if date_from:
        filters['date_from'] = datetime.fromisoformat(date_from).date()
    if date_to:
        filters['date_to'] = datetime.fromisoformat(date_to).date()
    
    csv_content = await OrderAdminService.export_orders_to_csv(
        db=db,
        store_id=store_id,
        filters=filters if filters else None
    )
    
    filename = f"orders_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/{order_id}/notes", response_model=dict)
async def add_order_note(
    order_id: int,
    request: OrderNoteCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Add note to order"""
    from app.models.order import Order
    
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Add note
    if request.is_admin_note:
        current_notes = order.admin_notes or ""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        new_note = f"[{timestamp}] {request.note}"
        order.admin_notes = f"{current_notes}\n{new_note}" if current_notes else new_note
    else:
        current_notes = order.notes or ""
        order.notes = f"{current_notes}\n{request.note}" if current_notes else request.note
    
    await db.commit()
    
    # Send notification to customer if requested
    if request.notify_customer and order.customer_email:
        # TODO: Send email notification
        pass
    
    return {'success': True, 'order_id': order_id}


@router.post("/{order_id}/resend-email", response_model=dict)
async def resend_order_email(
    order_id: int,
    request: OrderEmailResend,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Resend order email"""
    from app.models.order import Order
    from app.utils.order_notifications import OrderNotificationService
    
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    try:
        notification_service = OrderNotificationService()
        
        if request.email_type == 'confirmation':
            await notification_service.send_order_confirmation(order)
        elif request.email_type == 'payment':
            await notification_service.send_payment_confirmation(order)
        elif request.email_type == 'shipping':
            await notification_service.send_shipping_notification(order)
        elif request.email_type == 'delivery':
            await notification_service.send_delivery_confirmation(order)
        
        return {'success': True, 'message': f'{request.email_type} email sent'}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
