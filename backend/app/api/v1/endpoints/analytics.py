"""
Analytics endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, cast, Date
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.analytics import AbandonedCart, CustomerActivity, CustomerSegment
from app.schemas.analytics import *
from app.utils.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/dashboard", response_model=SalesDashboardResponse)
async def get_sales_dashboard(
    store_id: int,
    period_days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get sales dashboard overview"""
    dashboard_data = await AnalyticsService.get_sales_dashboard(
        db=db,
        store_id=store_id,
        period_days=period_days
    )
    
    return SalesDashboardResponse(**dashboard_data)


@router.post("/reports/sales", response_model=SalesReportResponse)
async def generate_sales_report(
    store_id: int,
    report_request: SalesReportRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate custom sales report"""
    revenue_data = await AnalyticsService.get_revenue_by_period(
        db=db,
        store_id=store_id,
        start_date=report_request.start_date,
        end_date=report_request.end_date,
        group_by=report_request.group_by
    )
    
    # Calculate summary
    total_revenue = sum(item['revenue'] for item in revenue_data)
    total_orders = sum(item['orders'] for item in revenue_data)
    total_customers = len(set(item['customers'] for item in revenue_data))
    
    summary = {
        'total_revenue': total_revenue,
        'total_orders': total_orders,
        'total_customers': total_customers,
        'average_order_value': total_revenue / total_orders if total_orders > 0 else Decimal('0')
    }
    
    return SalesReportResponse(
        period=f"{report_request.start_date} to {report_request.end_date}",
        data=revenue_data,
        summary=summary
    )


@router.get("/customers/insights", response_model=CustomerInsightResponse)
async def get_customer_insights(
    store_id: int,
    period_days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get customer insights and segmentation"""
    insights = await AnalyticsService.get_customer_insights(
        db=db,
        store_id=store_id,
        period_days=period_days
    )
    
    return CustomerInsightResponse(**insights)


@router.get("/products/{product_id}/analytics", response_model=ProductAnalyticsResponse)
async def get_product_analytics(
    product_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get product performance analytics"""
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    analytics = await AnalyticsService.get_product_analytics(
        db=db,
        product_id=product_id,
        start_date=start_datetime,
        end_date=end_datetime
    )
    
    return ProductAnalyticsResponse(**analytics)


@router.get("/abandoned-carts", response_model=AbandonedCartListResponse)
async def list_abandoned_carts(
    store_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    converted: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List abandoned carts"""
    filters = [AbandonedCart.store_id == store_id]
    
    if converted is not None:
        filters.append(AbandonedCart.converted == converted)
    
    # Count total
    count_result = await db.execute(
        select(
            func.count(AbandonedCart.id).label('count'),
            func.sum(AbandonedCart.cart_value).label('value')
        )
        .where(and_(*filters))
    )
    stats = count_result.first()
    total = stats.count
    total_value = Decimal(str(stats.value or 0))
    
    # Get abandoned carts
    query = (
        select(AbandonedCart)
        .where(and_(*filters))
        .order_by(desc(AbandonedCart.abandoned_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    
    result = await db.execute(query)
    abandoned_carts = result.scalars().all()
    
    items = [
        AbandonedCartResponse(
            id=cart.id,
            cart_id=cart.cart_id,
            email=cart.email,
            items_count=cart.items_count,
            cart_value=Decimal(str(cart.cart_value)),
            abandoned_at=cart.abandoned_at,
            recovery_email_sent=cart.recovery_email_sent,
            recovery_email_sent_at=cart.recovery_email_sent_at,
            converted=cart.converted,
            converted_at=cart.converted_at,
            order_id=cart.order_id
        )
        for cart in abandoned_carts
    ]
    
    # Calculate recovery rate
    recovered_result = await db.execute(
        select(func.count(AbandonedCart.id))
        .where(AbandonedCart.store_id == store_id, AbandonedCart.converted == True)
    )
    recovered = recovered_result.scalar() or 0
    recovery_rate = (recovered / total * 100) if total > 0 else 0.0
    
    return AbandonedCartListResponse(
        items=items,
        total=total,
        total_value=total_value,
        recovery_rate=round(recovery_rate, 2),
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )


@router.post("/abandoned-carts/track")
async def track_abandoned_carts(
    store_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger abandoned cart tracking"""
    await AnalyticsService.track_abandoned_carts(db=db, store_id=store_id)
    
    return {"message": "Abandoned cart tracking completed"}


@router.post("/abandoned-carts/{cart_id}/send-recovery")
async def send_recovery_email(
    cart_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Send cart recovery email"""
    result = await db.execute(
        select(AbandonedCart).where(AbandonedCart.id == cart_id)
    )
    abandoned_cart = result.scalar_one_or_none()
    
    if not abandoned_cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Abandoned cart not found"
        )
    
    if not abandoned_cart.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No email address available"
        )
    
    # TODO: Send recovery email via email service
    # await EmailService.send_cart_recovery_email(abandoned_cart)
    
    abandoned_cart.recovery_email_sent = True
    abandoned_cart.recovery_email_sent_at = datetime.now()
    await db.commit()
    
    return {"message": "Recovery email sent successfully"}


@router.post("/activity/track")
async def track_activity(
    store_id: int,
    activity: ActivityLogRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Track customer activity"""
    # Generate session ID if not logged in
    import uuid
    session_id = str(uuid.uuid4())
    
    activity_log = CustomerActivity(
        user_id=current_user.id if current_user else None,
        store_id=store_id,
        session_id=session_id,
        activity_type=activity.activity_type,
        product_id=activity.product_id,
        category_id=activity.category_id,
        page_url=activity.page_url,
        referrer=activity.referrer,
        metadata=activity.meta_data
    )
    
    db.add(activity_log)
    await db.commit()
    
    return {"message": "Activity tracked"}


@router.get("/segments", response_model=List[CustomerSegmentResponse])
async def get_customer_segments(
    store_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get customer segments overview"""
    result = await db.execute(
        select(
            CustomerSegment.rfm_segment,
            func.count(CustomerSegment.id).label('count'),
            func.sum(CustomerSegment.total_revenue).label('revenue'),
            func.avg(CustomerSegment.average_order_value).label('aov'),
            func.avg(CustomerSegment.total_orders).label('avg_orders')
        )
        .where(CustomerSegment.store_id == store_id)
        .group_by(CustomerSegment.rfm_segment)
    )
    
    segments = []
    for row in result.fetchall():
        segments.append(CustomerSegmentResponse(
            segment_name=row.rfm_segment,
            customer_count=row.count,
            total_revenue=Decimal(str(row.revenue or 0)),
            average_order_value=Decimal(str(row.aov or 0)),
            average_orders=float(row.avg_orders or 0)
        ))
    
    return segments


@router.get("/conversion-funnel", response_model=ConversionFunnelResponse)
async def get_conversion_funnel(
    store_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get conversion funnel analysis"""
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    # Visitors (unique sessions)
    visitors_result = await db.execute(
        select(func.count(func.distinct(CustomerActivity.session_id)))
        .where(
            CustomerActivity.store_id == store_id,
            CustomerActivity.created_at >= start_datetime,
            CustomerActivity.created_at <= end_datetime
        )
    )
    visitors = visitors_result.scalar() or 0
    
    # Product views
    views_result = await db.execute(
        select(func.count(CustomerActivity.id))
        .where(
            CustomerActivity.store_id == store_id,
            CustomerActivity.activity_type == 'view',
            CustomerActivity.created_at >= start_datetime,
            CustomerActivity.created_at <= end_datetime
        )
    )
    views = views_result.scalar() or 0
    
    # Add to cart
    cart_result = await db.execute(
        select(func.count(CustomerActivity.id))
        .where(
            CustomerActivity.store_id == store_id,
            CustomerActivity.activity_type == 'add_to_cart',
            CustomerActivity.created_at >= start_datetime,
            CustomerActivity.created_at <= end_datetime
        )
    )
    cart = cart_result.scalar() or 0
    
    # Checkout started
    checkout_result = await db.execute(
        select(func.count(CustomerActivity.id))
        .where(
            CustomerActivity.store_id == store_id,
            CustomerActivity.activity_type == 'checkout_started',
            CustomerActivity.created_at >= start_datetime,
            CustomerActivity.created_at <= end_datetime
        )
    )
    checkout = checkout_result.scalar() or 0
    
    # Orders completed
    from app.models.order import Order, PaymentStatus
    orders_result = await db.execute(
        select(func.count(Order.id))
        .where(
            Order.store_id == store_id,
            Order.created_at >= start_datetime,
            Order.created_at <= end_datetime,
            Order.payment_status == PaymentStatus.COMPLETED
        )
    )
    orders = orders_result.scalar() or 0
    
    # Calculate rates
    view_rate = (views / visitors * 100) if visitors > 0 else 0
    cart_rate = (cart / views * 100) if views > 0 else 0
    checkout_rate = (checkout / cart * 100) if cart > 0 else 0
    conversion_rate = (orders / visitors * 100) if visitors > 0 else 0
    
    return ConversionFunnelResponse(
        visitors=visitors,
        product_views=views,
        add_to_cart=cart,
        checkout_started=checkout,
        orders_completed=orders,
        view_rate=round(view_rate, 2),
        cart_rate=round(cart_rate, 2),
        checkout_rate=round(checkout_rate, 2),
        conversion_rate=round(conversion_rate, 2)
    )
