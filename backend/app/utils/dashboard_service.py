"""
Admin dashboard service
"""
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, cast, Date
from decimal import Decimal

from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.models.cart import Cart
from app.models.analytics import AbandonedCart
from app.models.return_model import OrderReturn, ReturnStatus
from app.models.category import Category


class DashboardService:
    """Service for admin dashboard data aggregation"""
    
    @staticmethod
    async def get_realtime_metrics(
        db: AsyncSession,
        store_id: int
    ) -> Dict[str, Any]:
        """Get real-time metrics"""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        
        # Today's metrics
        today_result = await db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0).label('revenue'),
                func.count(Order.id).label('orders'),
                func.count(func.distinct(Order.user_id)).label('customers'),
                func.avg(Order.total_amount).label('aov')
            )
            .where(
                Order.store_id == store_id,
                Order.created_at >= today_start,
                Order.payment_status == PaymentStatus.COMPLETED
            )
        )
        today_stats = today_result.first()
        
        # Yesterday's metrics for comparison
        yesterday_result = await db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0).label('revenue'),
                func.count(Order.id).label('orders'),
                func.count(func.distinct(Order.user_id)).label('customers')
            )
            .where(
                Order.store_id == store_id,
                Order.created_at >= yesterday_start,
                Order.created_at < today_start,
                Order.payment_status == PaymentStatus.COMPLETED
            )
        )
        yesterday_stats = yesterday_result.first()
        
        # Calculate changes
        revenue_change = DashboardService._calculate_change(
            float(today_stats.revenue),
            float(yesterday_stats.revenue)
        )
        orders_change = DashboardService._calculate_change(
            today_stats.orders,
            yesterday_stats.orders
        )
        customers_change = DashboardService._calculate_change(
            today_stats.customers,
            yesterday_stats.customers
        )
        
        # Pending orders
        pending_result = await db.execute(
            select(func.count(Order.id))
            .where(
                Order.store_id == store_id,
                Order.status.in_([OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING])
            )
        )
        pending_orders = pending_result.scalar() or 0
        
        # Low stock products
        low_stock_result = await db.execute(
            select(func.count(Product.id))
            .where(
                Product.store_id == store_id,
                Product.track_inventory == True,
                Product.stock_quantity <= Product.low_stock_threshold
            )
        )
        low_stock = low_stock_result.scalar() or 0
        
        # Conversion rate (orders / visitors)
        # TODO: Implement visitor tracking
        conversion_rate = 0.0
        
        return {
            'today_revenue': Decimal(str(today_stats.revenue)),
            'today_orders': today_stats.orders,
            'today_customers': today_stats.customers,
            'revenue_change': revenue_change,
            'orders_change': orders_change,
            'customers_change': customers_change,
            'pending_orders': pending_orders,
            'low_stock_products': low_stock,
            'active_customers_now': 0,  # TODO: Implement active sessions tracking
            'average_order_value': Decimal(str(today_stats.aov or 0)),
            'conversion_rate': conversion_rate
        }
    
    @staticmethod
    async def get_sales_chart(
        db: AsyncSession,
        store_id: int,
        period: str = 'today'  # today, week, month
    ) -> Dict[str, Any]:
        """Get sales chart data"""
        now = datetime.now()
        
        if period == 'today':
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            # Hourly data
            result = await db.execute(
                select(
                    func.date_trunc('hour', Order.created_at).label('timestamp'),
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                )
                .where(
                    Order.store_id == store_id,
                    Order.created_at >= start_time,
                    Order.payment_status == PaymentStatus.COMPLETED
                )
                .group_by('timestamp')
                .order_by('timestamp')
            )
        elif period == 'week':
            start_time = now - timedelta(days=7)
            # Daily data
            result = await db.execute(
                select(
                    func.date_trunc('day', Order.created_at).label('timestamp'),
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                )
                .where(
                    Order.store_id == store_id,
                    Order.created_at >= start_time,
                    Order.payment_status == PaymentStatus.COMPLETED
                )
                .group_by('timestamp')
                .order_by('timestamp')
            )
        else:  # month
            start_time = now - timedelta(days=30)
            # Daily data
            result = await db.execute(
                select(
                    func.date_trunc('day', Order.created_at).label('timestamp'),
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                )
                .where(
                    Order.store_id == store_id,
                    Order.created_at >= start_time,
                    Order.payment_status == PaymentStatus.COMPLETED
                )
                .group_by('timestamp')
                .order_by('timestamp')
            )
        
        data = []
        total_revenue = Decimal('0')
        total_orders = 0
        
        for row in result.fetchall():
            revenue = Decimal(str(row.revenue))
            total_revenue += revenue
            total_orders += row.orders
            
            data.append({
                'timestamp': row.timestamp.isoformat(),
                'revenue': revenue,
                'orders': row.orders
            })
        
        return {
            'period': period,
            'data': data,
            'total_revenue': total_revenue,
            'total_orders': total_orders
        }
    
    @staticmethod
    async def get_recent_orders(
        db: AsyncSession,
        store_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent orders"""
        result = await db.execute(
            select(Order, User.email, func.count(OrderItem.id).label('items_count'))
            .outerjoin(User, User.id == Order.user_id)
            .outerjoin(OrderItem, OrderItem.order_id == Order.id)
            .where(Order.store_id == store_id)
            .group_by(Order.id, User.email)
            .order_by(desc(Order.created_at))
            .limit(limit)
        )
        
        orders = []
        for order, email, items_count in result.fetchall():
            orders.append({
                'id': order.id,
                'order_number': order.order_number,
                'customer_email': email or 'Guest',
                'customer_name': order.customer_name,
                'total_amount': Decimal(str(order.total_amount)),
                'status': order.status.value,
                'payment_status': order.payment_status.value,
                'items_count': items_count,
                'created_at': order.created_at
            })
        
        return orders
    
    @staticmethod
    async def get_top_products(
        db: AsyncSession,
        store_id: int,
        limit: int = 5,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get top selling products"""
        start_date = datetime.now() - timedelta(days=days)
        
        result = await db.execute(
            select(
                Product.id,
                Product.name,
                func.sum(OrderItem.quantity).label('units_sold'),
                func.sum(OrderItem.total_price).label('revenue')
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.store_id == store_id,
                Order.created_at >= start_date,
                Order.payment_status == PaymentStatus.COMPLETED
            )
            .group_by(Product.id)
            .order_by(desc('revenue'))
            .limit(limit)
        )
        
        products = []
        for row in result.fetchall():
            # Get first image
            image_result = await db.execute(
                select(Product.images)
                .where(Product.id == row.id)
            )
            images = image_result.scalar()
            thumbnail = images[0].get('url') if images and len(images) > 0 else None
            
            products.append({
                'product_id': row.id,
                'product_name': row.name,
                'units_sold': row.units_sold,
                'revenue': Decimal(str(row.revenue)),
                'thumbnail': thumbnail
            })
        
        return products
    
    @staticmethod
    async def get_top_categories(
        db: AsyncSession,
        store_id: int,
        limit: int = 5,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get top categories by sales"""
        start_date = datetime.now() - timedelta(days=days)
        
        result = await db.execute(
            select(
                Category.id,
                Category.name,
                func.sum(OrderItem.quantity).label('products_sold'),
                func.sum(OrderItem.total_price).label('revenue')
            )
            .join(Product, Product.category_id == Category.id)
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.store_id == store_id,
                Order.created_at >= start_date,
                Order.payment_status == PaymentStatus.COMPLETED
            )
            .group_by(Category.id)
            .order_by(desc('revenue'))
            .limit(limit)
        )
        
        categories = []
        for row in result.fetchall():
            categories.append({
                'category_id': row.id,
                'category_name': row.name,
                'products_sold': row.products_sold,
                'revenue': Decimal(str(row.revenue))
            })
        
        return categories
    
    @staticmethod
    async def get_customer_activity(
        db: AsyncSession,
        store_id: int
    ) -> Dict[str, Any]:
        """Get customer activity summary"""
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # New customers today
        new_customers_result = await db.execute(
            select(func.count(func.distinct(Order.user_id)))
            .where(
                Order.store_id == store_id,
                Order.created_at >= today_start,
                Order.user_id.isnot(None),
                Order.user_id.in_(
                    select(Order.user_id)
                    .where(Order.store_id == store_id)
                    .group_by(Order.user_id)
                    .having(func.min(Order.created_at) >= today_start)
                )
            )
        )
        new_customers = new_customers_result.scalar() or 0
        
        # Total customers today
        total_customers_result = await db.execute(
            select(func.count(func.distinct(Order.user_id)))
            .where(
                Order.store_id == store_id,
                Order.created_at >= today_start,
                Order.user_id.isnot(None)
            )
        )
        total_customers = total_customers_result.scalar() or 0
        returning_customers = total_customers - new_customers
        
        # Active carts
        active_carts_result = await db.execute(
            select(func.count(Cart.id))
            .where(
                Cart.store_id == store_id,
                Cart.updated_at >= datetime.now() - timedelta(hours=24)
            )
        )
        active_carts = active_carts_result.scalar() or 0
        
        # Abandoned carts today
        abandoned_result = await db.execute(
            select(func.count(AbandonedCart.id))
            .where(
                AbandonedCart.store_id == store_id,
                AbandonedCart.abandoned_at >= today_start,
                AbandonedCart.converted == False
            )
        )
        abandoned_carts = abandoned_result.scalar() or 0
        
        return {
            'new_customers_today': new_customers,
            'returning_customers_today': returning_customers,
            'active_carts': active_carts,
            'abandoned_carts_today': abandoned_carts
        }
    
    @staticmethod
    async def get_inventory_alerts(
        db: AsyncSession,
        store_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get low stock inventory alerts"""
        result = await db.execute(
            select(Product)
            .where(
                Product.store_id == store_id,
                Product.track_inventory == True,
                Product.stock_quantity <= Product.low_stock_threshold,
                Product.is_active == True
            )
            .order_by(Product.stock_quantity)
            .limit(limit)
        )
        
        alerts = []
        for product in result.scalars().all():
            alerts.append({
                'product_id': product.id,
                'product_name': product.name,
                'current_stock': product.stock_quantity,
                'min_stock_level': product.low_stock_threshold,
                'variant_name': None
            })
        
        return alerts
    
    @staticmethod
    async def get_revenue_by_category(
        db: AsyncSession,
        store_id: int,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get revenue breakdown by category"""
        start_date = datetime.now() - timedelta(days=days)
        
        result = await db.execute(
            select(
                Category.name,
                func.sum(OrderItem.total_price).label('revenue')
            )
            .join(Product, Product.category_id == Category.id)
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.store_id == store_id,
                Order.created_at >= start_date,
                Order.payment_status == PaymentStatus.COMPLETED
            )
            .group_by(Category.name)
            .order_by(desc('revenue'))
        )
        
        data = []
        total_revenue = Decimal('0')
        
        for row in result.fetchall():
            revenue = Decimal(str(row.revenue))
            total_revenue += revenue
            data.append({
                'category_name': row.name,
                'revenue': revenue
            })
        
        # Calculate percentages
        for item in data:
            if total_revenue > 0:
                item['percentage'] = float(item['revenue'] / total_revenue * 100)
            else:
                item['percentage'] = 0.0
        
        return data
    
    @staticmethod
    def _calculate_change(current: float, previous: float) -> float:
        """Calculate percentage change"""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 2)
