"""
Admin dashboard endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.return_model import OrderReturn, ReturnStatus
from app.schemas.dashboard import *
from app.utils.dashboard_service import DashboardService

router = APIRouter()


@router.get("/", response_model=AdminDashboardResponse)
async def get_admin_dashboard(
    store_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get complete admin dashboard data"""
    
    # Get all dashboard components in parallel
    metrics = await DashboardService.get_realtime_metrics(db, store_id)
    
    sales_chart_today = await DashboardService.get_sales_chart(db, store_id, 'today')
    sales_chart_week = await DashboardService.get_sales_chart(db, store_id, 'week')
    
    recent_orders = await DashboardService.get_recent_orders(db, store_id, limit=10)
    
    top_products = await DashboardService.get_top_products(db, store_id, limit=5)
    top_categories = await DashboardService.get_top_categories(db, store_id, limit=5)
    
    customer_activity = await DashboardService.get_customer_activity(db, store_id)
    
    inventory_alerts = await DashboardService.get_inventory_alerts(db, store_id, limit=10)
    
    revenue_by_category = await DashboardService.get_revenue_by_category(db, store_id)
    
    # Pending returns count
    pending_returns_result = await db.execute(
        select(func.count(OrderReturn.id))
        .where(
            OrderReturn.status.in_([ReturnStatus.REQUESTED, ReturnStatus.APPROVED])
        )
    )
    pending_returns = pending_returns_result.scalar() or 0
    
    # Recent activities (placeholder - would need activity log table)
    recent_activities = []
    
    return AdminDashboardResponse(
        metrics=RealtimeMetrics(**metrics),
        sales_chart_today=SalesChart(**sales_chart_today),
        sales_chart_week=SalesChart(**sales_chart_week),
        recent_orders=[RecentOrderSummary(**order) for order in recent_orders],
        recent_activities=recent_activities,
        top_products=[TopProduct(**prod) for prod in top_products],
        top_categories=[TopCategory(**cat) for cat in top_categories],
        customer_activity=CustomerActivity(**customer_activity),
        inventory_alerts=[InventoryAlert(**alert) for alert in inventory_alerts],
        pending_returns=pending_returns,
        revenue_by_category=[RevenueByCategory(**item) for item in revenue_by_category]
    )


@router.get("/metrics/realtime", response_model=RealtimeMetrics)
async def get_realtime_metrics(
    store_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get real-time metrics only (for polling)"""
    metrics = await DashboardService.get_realtime_metrics(db, store_id)
    return RealtimeMetrics(**metrics)


@router.get("/sales/chart", response_model=SalesChart)
async def get_sales_chart(
    store_id: int,
    period: str = Query('today', regex='^(today|week|month)$'),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get sales chart data"""
    chart_data = await DashboardService.get_sales_chart(db, store_id, period)
    return SalesChart(**chart_data)


@router.get("/orders/recent", response_model=List[RecentOrderSummary])
async def get_recent_orders(
    store_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recent orders"""
    orders = await DashboardService.get_recent_orders(db, store_id, limit)
    return [RecentOrderSummary(**order) for order in orders]


@router.get("/products/top", response_model=List[TopProduct])
async def get_top_products(
    store_id: int,
    limit: int = Query(5, ge=1, le=20),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get top selling products"""
    products = await DashboardService.get_top_products(db, store_id, limit, days)
    return [TopProduct(**prod) for prod in products]


@router.get("/categories/top", response_model=List[TopCategory])
async def get_top_categories(
    store_id: int,
    limit: int = Query(5, ge=1, le=20),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get top categories by sales"""
    categories = await DashboardService.get_top_categories(db, store_id, limit, days)
    return [TopCategory(**cat) for cat in categories]


@router.get("/customers/activity", response_model=CustomerActivity)
async def get_customer_activity(
    store_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get customer activity summary"""
    activity = await DashboardService.get_customer_activity(db, store_id)
    return CustomerActivity(**activity)


@router.get("/inventory/alerts", response_model=List[InventoryAlert])
async def get_inventory_alerts(
    store_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get low stock inventory alerts"""
    alerts = await DashboardService.get_inventory_alerts(db, store_id, limit)
    return [InventoryAlert(**alert) for alert in alerts]


@router.get("/revenue/by-category", response_model=List[RevenueByCategory])
async def get_revenue_by_category(
    store_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue breakdown by category"""
    data = await DashboardService.get_revenue_by_category(db, store_id, days)
    return [RevenueByCategory(**item) for item in data]


@router.get("/quick-stats", response_model=QuickStats)
async def get_quick_stats(
    store_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get quick statistics for summary cards"""
    from app.models.product import Product
    from app.models.order import Order, PaymentStatus
    from datetime import datetime, timedelta
    
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    last_month_start = today_start - timedelta(days=30)
    prev_month_start = today_start - timedelta(days=60)
    
    # Total products
    products_result = await db.execute(
        select(func.count(Product.id)).where(Product.store_id == store_id)
    )
    total_products = products_result.scalar() or 0
    
    # Total customers
    customers_result = await db.execute(
        select(func.count(func.distinct(Order.user_id)))
        .where(Order.store_id == store_id, Order.user_id.isnot(None))
    )
    total_customers = customers_result.scalar() or 0
    
    # Total orders
    orders_result = await db.execute(
        select(func.count(Order.id))
        .where(Order.store_id == store_id)
    )
    total_orders = orders_result.scalar() or 0
    
    # Total revenue
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(
            Order.store_id == store_id,
            Order.payment_status == PaymentStatus.COMPLETED
        )
    )
    total_revenue = Decimal(str(revenue_result.scalar()))
    
    # Last month stats
    last_month_orders_result = await db.execute(
        select(
            func.count(Order.id).label('orders'),
            func.coalesce(func.sum(Order.total_amount), 0).label('revenue')
        )
        .where(
            Order.store_id == store_id,
            Order.created_at >= last_month_start,
            Order.payment_status == PaymentStatus.COMPLETED
        )
    )
    last_month_stats = last_month_orders_result.first()
    
    # Previous month stats for comparison
    prev_month_orders_result = await db.execute(
        select(
            func.count(Order.id).label('orders'),
            func.coalesce(func.sum(Order.total_amount), 0).label('revenue')
        )
        .where(
            Order.store_id == store_id,
            Order.created_at >= prev_month_start,
            Order.created_at < last_month_start,
            Order.payment_status == PaymentStatus.COMPLETED
        )
    )
    prev_month_stats = prev_month_orders_result.first()
    
    # Calculate changes
    def calc_change(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 2)
    
    return QuickStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=total_revenue,
        products_change=0.0,  # Would need products created tracking
        customers_change=0.0,  # Would need customer registration tracking
        orders_change=calc_change(last_month_stats.orders, prev_month_stats.orders),
        revenue_change=calc_change(float(last_month_stats.revenue), float(prev_month_stats.revenue))
    )
