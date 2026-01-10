"""
Analytics service for data aggregation
"""
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, cast, Date
from decimal import Decimal

from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductReview
from app.models.analytics import AbandonedCart, CustomerActivity, SalesMetric, ProductPerformance, CustomerSegment
from app.models.user import User
from app.models.category import Category
from app.models.return_model import OrderReturn, ReturnStatus


class AnalyticsService:
    """Service for analytics calculations"""
    
    @staticmethod
    async def get_sales_dashboard(
        db: AsyncSession,
        store_id: int,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get sales dashboard overview"""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_start = now - timedelta(days=period_days)
        
        # Today's sales
        today_sales_result = await db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0).label('sales'),
                func.count(Order.id).label('orders')
            )
            .where(
                Order.store_id == store_id,
                Order.created_at >= today_start,
                Order.payment_status == PaymentStatus.COMPLETED
            )
        )
        today_stats = today_sales_result.first()
        
        # Period sales
        period_sales_result = await db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0).label('sales'),
                func.count(Order.id).label('orders'),
                func.avg(Order.total_amount).label('aov')
            )
            .where(
                Order.store_id == store_id,
                Order.created_at >= period_start,
                Order.payment_status == PaymentStatus.COMPLETED
            )
        )
        period_stats = period_sales_result.first()
        
        # Previous period for comparison
        prev_period_start = period_start - timedelta(days=period_days)
        prev_sales_result = await db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0))
            .where(
                Order.store_id == store_id,
                Order.created_at >= prev_period_start,
                Order.created_at < period_start,
                Order.payment_status == PaymentStatus.COMPLETED
            )
        )
        prev_sales = prev_sales_result.scalar() or 0
        
        # Growth calculation
        growth = 0.0
        if prev_sales > 0:
            growth = ((float(period_stats.sales) - float(prev_sales)) / float(prev_sales)) * 100
        
        # Top products
        top_products_result = await db.execute(
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
                Order.created_at >= period_start,
                Order.payment_status == PaymentStatus.COMPLETED
            )
            .group_by(Product.id)
            .order_by(desc('revenue'))
            .limit(5)
        )
        top_products = [
            {
                'product_id': row.id,
                'name': row.name,
                'units_sold': row.units_sold,
                'revenue': float(row.revenue)
            }
            for row in top_products_result.fetchall()
        ]
        
        # Abandoned carts
        abandoned_result = await db.execute(
            select(
                func.count(AbandonedCart.id).label('count'),
                func.coalesce(func.sum(AbandonedCart.cart_value), 0).label('value')
            )
            .where(
                AbandonedCart.store_id == store_id,
                AbandonedCart.abandoned_at >= period_start,
                AbandonedCart.converted == False
            )
        )
        abandoned_stats = abandoned_result.first()
        
        # Recovery rate
        recovered_result = await db.execute(
            select(func.count(AbandonedCart.id))
            .where(
                AbandonedCart.store_id == store_id,
                AbandonedCart.abandoned_at >= period_start,
                AbandonedCart.converted == True
            )
        )
        recovered_count = recovered_result.scalar() or 0
        
        total_abandoned = abandoned_stats.count + recovered_count
        recovery_rate = (recovered_count / total_abandoned * 100) if total_abandoned > 0 else 0
        
        # Pending orders
        pending_result = await db.execute(
            select(func.count(Order.id))
            .where(
                Order.store_id == store_id,
                Order.status.in_([OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING])
            )
        )
        pending_count = pending_result.scalar() or 0
        
        return {
            'today_sales': Decimal(str(today_stats.sales)),
            'today_orders': today_stats.orders,
            'today_visitors': 0,  # TODO: Implement visitor tracking
            'today_conversion_rate': 0.0,
            'period_sales': Decimal(str(period_stats.sales)),
            'period_orders': period_stats.orders,
            'period_growth': round(growth, 2),
            'average_order_value': Decimal(str(period_stats.aov or 0)),
            'top_products': top_products,
            'top_categories': [],
            'recent_orders': period_stats.orders,
            'pending_orders': pending_count,
            'abandoned_carts': abandoned_stats.count,
            'abandoned_cart_value': Decimal(str(abandoned_stats.value)),
            'recovery_rate': round(recovery_rate, 2)
        }
    
    @staticmethod
    async def get_revenue_by_period(
        db: AsyncSession,
        store_id: int,
        start_date: date,
        end_date: date,
        group_by: str = 'day'
    ) -> List[Dict[str, Any]]:
        """Get revenue grouped by period"""
        # Determine grouping
        if group_by == 'day':
            date_trunc = func.date_trunc('day', Order.created_at)
        elif group_by == 'week':
            date_trunc = func.date_trunc('week', Order.created_at)
        elif group_by == 'month':
            date_trunc = func.date_trunc('month', Order.created_at)
        else:
            date_trunc = func.date_trunc('day', Order.created_at)
        
        result = await db.execute(
            select(
                cast(date_trunc, Date).label('period'),
                func.sum(Order.total_amount).label('revenue'),
                func.count(Order.id).label('orders'),
                func.count(func.distinct(Order.user_id)).label('customers'),
                func.avg(Order.total_amount).label('aov')
            )
            .where(
                Order.store_id == store_id,
                cast(Order.created_at, Date) >= start_date,
                cast(Order.created_at, Date) <= end_date,
                Order.payment_status == PaymentStatus.COMPLETED
            )
            .group_by('period')
            .order_by('period')
        )
        
        data = []
        for row in result.fetchall():
            data.append({
                'period': row.period.isoformat(),
                'revenue': Decimal(str(row.revenue)),
                'orders': row.orders,
                'customers': row.customers,
                'average_order_value': Decimal(str(row.aov))
            })
        
        return data
    
    @staticmethod
    async def get_customer_insights(
        db: AsyncSession,
        store_id: int,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get customer insights"""
        period_start = datetime.now() - timedelta(days=period_days)
        
        # Total customers with orders
        total_customers_result = await db.execute(
            select(func.count(func.distinct(Order.user_id)))
            .where(
                Order.store_id == store_id,
                Order.user_id.isnot(None),
                Order.payment_status == PaymentStatus.COMPLETED
            )
        )
        total_customers = total_customers_result.scalar() or 0
        
        # New customers in period
        new_customers_result = await db.execute(
            select(func.count(func.distinct(Order.user_id)))
            .where(
                Order.store_id == store_id,
                Order.user_id.isnot(None),
                Order.created_at >= period_start,
                Order.payment_status == PaymentStatus.COMPLETED,
                Order.user_id.in_(
                    select(Order.user_id)
                    .where(Order.store_id == store_id)
                    .group_by(Order.user_id)
                    .having(func.min(Order.created_at) >= period_start)
                )
            )
        )
        new_customers = new_customers_result.scalar() or 0
        
        # Customer segments
        segments_result = await db.execute(
            select(
                CustomerSegment.rfm_segment,
                func.count(CustomerSegment.id)
            )
            .where(CustomerSegment.store_id == store_id)
            .group_by(CustomerSegment.rfm_segment)
        )
        segments = {row[0]: row[1] for row in segments_result.fetchall()}
        
        # Average lifetime value
        ltv_result = await db.execute(
            select(func.avg(CustomerSegment.total_revenue))
            .where(CustomerSegment.store_id == store_id)
        )
        avg_ltv = ltv_result.scalar() or 0
        
        # Repeat purchase rate
        repeat_result = await db.execute(
            select(
                func.count(func.distinct(Order.user_id))
            )
            .where(
                Order.store_id == store_id,
                Order.user_id.in_(
                    select(Order.user_id)
                    .where(Order.store_id == store_id)
                    .group_by(Order.user_id)
                    .having(func.count(Order.id) > 1)
                )
            )
        )
        repeat_customers = repeat_result.scalar() or 0
        repeat_rate = (repeat_customers / total_customers * 100) if total_customers > 0 else 0
        
        # At risk customers
        at_risk_result = await db.execute(
            select(func.count(CustomerSegment.id))
            .where(
                CustomerSegment.store_id == store_id,
                CustomerSegment.churn_risk >= 0.7
            )
        )
        at_risk = at_risk_result.scalar() or 0
        
        # Top customers
        top_customers_result = await db.execute(
            select(
                User.id,
                User.email,
                CustomerSegment.total_revenue,
                CustomerSegment.total_orders
            )
            .join(CustomerSegment, CustomerSegment.user_id == User.id)
            .where(CustomerSegment.store_id == store_id)
            .order_by(desc(CustomerSegment.total_revenue))
            .limit(10)
        )
        top_customers = [
            {
                'user_id': row.id,
                'email': row.email,
                'total_revenue': float(row.total_revenue),
                'total_orders': row.total_orders
            }
            for row in top_customers_result.fetchall()
        ]
        
        return {
            'total_customers': total_customers,
            'new_customers': new_customers,
            'returning_customers': total_customers - new_customers,
            'segments': segments,
            'average_lifetime_value': Decimal(str(avg_ltv)),
            'average_order_count': 0.0,
            'repeat_purchase_rate': round(repeat_rate, 2),
            'at_risk_customers': at_risk,
            'churned_customers': 0,
            'top_customers': top_customers
        }
    
    @staticmethod
    async def get_product_analytics(
        db: AsyncSession,
        product_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get product analytics"""
        # Sales data
        sales_result = await db.execute(
            select(
                func.sum(OrderItem.quantity).label('units_sold'),
                func.sum(OrderItem.total_price).label('revenue'),
                func.count(OrderItem.id).label('purchase_count')
            )
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                OrderItem.product_id == product_id,
                Order.created_at >= start_date,
                Order.created_at <= end_date,
                Order.payment_status == PaymentStatus.COMPLETED
            )
        )
        sales_stats = sales_result.first()
        
        # Activity data
        views_result = await db.execute(
            select(func.count(CustomerActivity.id))
            .where(
                CustomerActivity.product_id == product_id,
                CustomerActivity.activity_type == 'view',
                CustomerActivity.created_at >= start_date,
                CustomerActivity.created_at <= end_date
            )
        )
        view_count = views_result.scalar() or 0
        
        cart_result = await db.execute(
            select(func.count(CustomerActivity.id))
            .where(
                CustomerActivity.product_id == product_id,
                CustomerActivity.activity_type == 'add_to_cart',
                CustomerActivity.created_at >= start_date,
                CustomerActivity.created_at <= end_date
            )
        )
        cart_count = cart_result.scalar() or 0
        
        # Returns
        returns_result = await db.execute(
            select(func.count(OrderReturn.id))
            .join(Order, Order.id == OrderReturn.order_id)
            .where(
                OrderReturn.items.contains([{'product_id': product_id}]),
                OrderReturn.created_at >= start_date,
                OrderReturn.created_at <= end_date
            )
        )
        return_count = returns_result.scalar() or 0
        
        # Get product name
        product_result = await db.execute(
            select(Product.name).where(Product.id == product_id)
        )
        product_name = product_result.scalar() or 'Unknown'
        
        # Calculate rates
        units_sold = sales_stats.units_sold or 0
        purchase_count = sales_stats.purchase_count or 0
        
        view_to_cart = (cart_count / view_count * 100) if view_count > 0 else 0
        cart_to_purchase = (purchase_count / cart_count * 100) if cart_count > 0 else 0
        conversion_rate = (purchase_count / view_count * 100) if view_count > 0 else 0
        return_rate = (return_count / purchase_count * 100) if purchase_count > 0 else 0
        
        return {
            'product_id': product_id,
            'product_name': product_name,
            'view_count': view_count,
            'add_to_cart_count': cart_count,
            'purchase_count': purchase_count,
            'units_sold': units_sold,
            'revenue': Decimal(str(sales_stats.revenue or 0)),
            'view_to_cart_rate': round(view_to_cart, 2),
            'cart_to_purchase_rate': round(cart_to_purchase, 2),
            'conversion_rate': round(conversion_rate, 2),
            'return_count': return_count,
            'return_rate': round(return_rate, 2),
            'period_start': start_date,
            'period_end': end_date
        }
    
    @staticmethod
    async def track_abandoned_carts(
        db: AsyncSession,
        store_id: int
    ):
        """Track and mark abandoned carts"""
        # Find carts not updated in last 24 hours
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        result = await db.execute(
            select(Cart)
            .where(
                Cart.store_id == store_id,
                Cart.updated_at < cutoff_time,
                Cart.id.notin_(
                    select(AbandonedCart.cart_id)
                )
            )
        )
        carts = result.scalars().all()
        
        for cart in carts:
            if not cart.items:
                continue
            
            # Calculate cart value
            cart_value = sum(item.total_price for item in cart.items)
            
            # Get email
            email = None
            if cart.user_id:
                user_result = await db.execute(
                    select(User.email).where(User.id == cart.user_id)
                )
                email = user_result.scalar()
            
            # Create abandoned cart record
            abandoned = AbandonedCart(
                cart_id=cart.id,
                store_id=store_id,
                user_id=cart.user_id,
                email=email,
                items_count=len(cart.items),
                cart_value=float(cart_value),
                abandoned_at=cart.updated_at
            )
            db.add(abandoned)
        
        await db.commit()
