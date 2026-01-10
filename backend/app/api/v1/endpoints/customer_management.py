"""
Customer management endpoints for admin
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import io

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User, UserStatus
from app.schemas.customer_admin import *
from app.utils.customer_admin_service import CustomerAdminService

router = APIRouter()


@router.get("/", response_model=dict)
async def get_customers_list(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    has_orders: Optional[bool] = Query(None),
    min_orders: Optional[int] = Query(None),
    max_orders: Optional[int] = Query(None),
    min_spent: Optional[float] = Query(None),
    max_spent: Optional[float] = Query(None),
    registered_from: Optional[str] = Query(None),
    registered_to: Optional[str] = Query(None),
    last_order_from: Optional[str] = Query(None),
    last_order_to: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    sort_by: str = Query('created_at'),
    sort_order: str = Query('desc'),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get customers list with filters"""
    filters = {
        'search': search,
        'status': status,
        'has_orders': has_orders,
        'min_orders': min_orders,
        'max_orders': max_orders,
        'min_spent': min_spent,
        'max_spent': max_spent,
        'registered_from': datetime.fromisoformat(registered_from).date() if registered_from else None,
        'registered_to': datetime.fromisoformat(registered_to).date() if registered_to else None,
        'last_order_from': datetime.fromisoformat(last_order_from).date() if last_order_from else None,
        'last_order_to': datetime.fromisoformat(last_order_to).date() if last_order_to else None,
        'segment': segment,
        'tags': tags.split(',') if tags else None,
        'sort_by': sort_by,
        'sort_order': sort_order
    }
    
    result = await CustomerAdminService.get_customers_list(
        db=db,
        filters=filters,
        page=page,
        per_page=per_page
    )
    
    return result


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer_detail(
    customer_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get complete customer details"""
    customer = await CustomerAdminService.get_customer_detail(
        db=db,
        customer_id=customer_id
    )
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return CustomerDetailResponse(**customer)


@router.put("/{customer_id}", response_model=dict)
async def update_customer(
    customer_id: int,
    request: CustomerUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update customer details"""
    result = await db.execute(
        select(User).where(User.id == customer_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'status':
            setattr(user, field, UserStatus(value))
        else:
            setattr(user, field, value)
    
    await db.commit()
    
    return {'success': True, 'customer_id': customer_id}


@router.get("/{customer_id}/orders", response_model=dict)
async def get_customer_orders(
    customer_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get customer order history"""
    from app.models.order import Order, OrderItem
    
    # Count total
    count_result = await db.execute(
        select(func.count(Order.id))
        .where(Order.user_id == customer_id)
    )
    total = count_result.scalar()
    
    # Get orders
    result = await db.execute(
        select(Order, func.count(OrderItem.id).label('items_count'))
        .outerjoin(OrderItem, OrderItem.order_id == Order.id)
        .where(Order.user_id == customer_id)
        .group_by(Order.id)
        .order_by(desc(Order.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    
    orders = []
    for order, items_count in result.fetchall():
        orders.append({
            'id': order.id,
            'order_number': order.order_number,
            'status': order.status.value,
            'payment_status': order.payment_status.value,
            'total_amount': Decimal(str(order.total_amount)),
            'items_count': items_count,
            'created_at': order.created_at
        })
    
    return {
        'items': orders,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page if total > 0 else 0
    }


@router.post("/bulk-action", response_model=dict)
async def customer_bulk_action(
    request: CustomerBulkAction,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Perform bulk action on customers"""
    success = 0
    failed = 0
    errors = []
    
    for customer_id in request.customer_ids:
        try:
            result = await db.execute(
                select(User).where(User.id == customer_id)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                failed += 1
                errors.append({'customer_id': customer_id, 'error': 'Customer not found'})
                continue
            
            # Perform action
            if request.action == 'add_tag':
                if not user.tags:
                    user.tags = []
                if request.value not in user.tags:
                    user.tags.append(request.value)
            
            elif request.action == 'remove_tag':
                if user.tags and request.value in user.tags:
                    user.tags.remove(request.value)
            
            elif request.action == 'set_segment':
                user.segment = request.value
            
            elif request.action == 'set_status':
                user.status = UserStatus(request.value)
            
            elif request.action == 'delete':
                await db.delete(user)
            
            success += 1
        
        except Exception as e:
            failed += 1
            errors.append({'customer_id': customer_id, 'error': str(e)})
    
    await db.commit()
    
    return {
        'success': success,
        'failed': failed,
        'total': len(request.customer_ids),
        'errors': errors
    }


@router.get("/statistics/summary", response_model=CustomerStatistics)
async def get_customer_statistics(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get customer statistics"""
    stats = await CustomerAdminService.get_customer_statistics(db=db)
    return CustomerStatistics(**stats)


@router.get("/export/csv")
async def export_customers_csv(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    has_orders: Optional[bool] = Query(None),
    segment: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Export customers to CSV"""
    filters = {
        'search': search,
        'status': status,
        'has_orders': has_orders,
        'segment': segment
    }
    
    csv_content = await CustomerAdminService.export_customers_to_csv(
        db=db,
        filters=filters
    )
    
    filename = f"customers_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/{customer_id}/notes", response_model=dict)
async def add_customer_note(
    customer_id: int,
    request: CustomerNoteCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Add note to customer"""
    result = await db.execute(
        select(User).where(User.id == customer_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Add note with timestamp
    current_notes = user.notes if hasattr(user, 'notes') and user.notes else ""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    new_note = f"[{timestamp}] {request.note}"
    user.notes = f"{current_notes}\n{new_note}" if current_notes else new_note
    
    await db.commit()
    
    return {'success': True, 'customer_id': customer_id}


@router.get("/segments/analysis", response_model=List[CustomerSegmentAnalysis])
async def get_segment_analysis(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get customer segment analysis"""
    segments = await CustomerAdminService.get_segment_analysis(db=db)
    return [CustomerSegmentAnalysis(**segment) for segment in segments]


@router.post("/{customer_id}/merge", response_model=dict)
async def merge_customers(
    customer_id: int,
    request: CustomerMergeRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Merge duplicate customers"""
    from app.models.order import Order
    from app.models.customer_address import CustomerAddress
    
    # Get both customers
    source_result = await db.execute(
        select(User).where(User.id == request.source_customer_id)
    )
    source = source_result.scalar_one_or_none()
    
    target_result = await db.execute(
        select(User).where(User.id == request.target_customer_id)
    )
    target = target_result.scalar_one_or_none()
    
    if not source or not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Merge orders
    if request.merge_orders:
        await db.execute(
            Order.__table__.update()
            .where(Order.user_id == request.source_customer_id)
            .values(user_id=request.target_customer_id)
        )
    
    # Merge addresses
    if request.merge_addresses:
        await db.execute(
            CustomerAddress.__table__.update()
            .where(CustomerAddress.user_id == request.source_customer_id)
            .values(user_id=request.target_customer_id)
        )
    
    # Merge notes
    if request.merge_notes and hasattr(source, 'notes') and source.notes:
        if hasattr(target, 'notes'):
            target.notes = f"{target.notes}\n\n--- Merged from customer {source.id} ---\n{source.notes}"
        else:
            target.notes = source.notes
    
    # Delete source customer
    await db.delete(source)
    await db.commit()
    
    return {
        'success': True,
        'target_customer_id': request.target_customer_id,
        'merged_customer_id': request.source_customer_id
    }


@router.get("/{customer_id}/lifetime-value", response_model=CustomerLifetimeValue)
async def get_customer_lifetime_value(
    customer_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculate customer lifetime value"""
    from app.models.order import Order, PaymentStatus
    
    result = await db.execute(
        select(
            func.coalesce(func.sum(
                func.case(
                    (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                    else_=0
                )
            ), 0).label('total_spent'),
            func.count(Order.id).label('orders_count'),
            func.min(Order.created_at).label('first_order'),
            func.max(Order.created_at).label('last_order')
        )
        .where(Order.user_id == customer_id)
    )
    
    stats = result.first()
    
    if stats.orders_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer has no orders"
        )
    
    total_spent = Decimal(str(stats.total_spent))
    orders_count = stats.orders_count
    avg_order_value = total_spent / orders_count
    
    # Calculate days as customer
    if stats.first_order and stats.last_order:
        days_as_customer = (stats.last_order - stats.first_order).days + 1
    else:
        days_as_customer = 0
    
    # Simple predictive LTV (can be enhanced with ML models)
    predicted_ltv = None
    if orders_count > 1 and days_as_customer > 0:
        order_frequency = orders_count / (days_as_customer / 30)  # Orders per month
        predicted_ltv = avg_order_value * order_frequency * 12  # Projected annual value
    
    return CustomerLifetimeValue(
        customer_id=customer_id,
        total_spent=total_spent,
        orders_count=orders_count,
        average_order_value=avg_order_value,
        first_order_date=stats.first_order,
        last_order_date=stats.last_order,
        days_as_customer=days_as_customer,
        predicted_ltv=predicted_ltv
    )
