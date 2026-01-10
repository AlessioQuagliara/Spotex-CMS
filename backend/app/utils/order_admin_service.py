"""
Order management service for admin operations
"""
import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc, cast, Date
from decimal import Decimal

from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.utils.order_notifications import OrderNotificationService
from app.utils.payment import generate_order_number


class OrderAdminService:
    """Service for admin order operations"""
    
    @staticmethod
    async def get_orders_list(
        db: AsyncSession,
        store_id: int,
        filters: Dict[str, Any],
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get filtered orders list"""
        query_filters = [Order.store_id == store_id]
        
        # Status filter
        if filters.get('status'):
            status_list = [OrderStatus(s) for s in filters['status']]
            query_filters.append(Order.status.in_(status_list))
        
        # Payment status filter
        if filters.get('payment_status'):
            payment_list = [PaymentStatus(s) for s in filters['payment_status']]
            query_filters.append(Order.payment_status.in_(payment_list))
        
        # Date range
        if filters.get('date_from'):
            query_filters.append(cast(Order.created_at, Date) >= filters['date_from'])
        if filters.get('date_to'):
            query_filters.append(cast(Order.created_at, Date) <= filters['date_to'])
        
        # Customer search
        if filters.get('customer_email'):
            query_filters.append(Order.customer_email.ilike(f"%{filters['customer_email']}%"))
        
        # Order number search
        if filters.get('order_number'):
            query_filters.append(Order.order_number.ilike(f"%{filters['order_number']}%"))
        
        # Amount range
        if filters.get('min_amount'):
            query_filters.append(Order.total_amount >= float(filters['min_amount']))
        if filters.get('max_amount'):
            query_filters.append(Order.total_amount <= float(filters['max_amount']))
        
        # Has tracking
        if filters.get('has_tracking') is not None:
            if filters['has_tracking']:
                query_filters.append(Order.tracking_number.isnot(None))
            else:
                query_filters.append(Order.tracking_number.is_(None))
        
        # Count total
        count_result = await db.execute(
            select(func.count(Order.id)).where(and_(*query_filters))
        )
        total = count_result.scalar()
        
        # Sort
        sort_by = filters.get('sort_by', 'created_at')
        sort_order = filters.get('sort_order', 'desc')
        sort_column = getattr(Order, sort_by, Order.created_at)
        order_func = desc if sort_order == 'desc' else asc
        
        # Get orders with items count
        query = (
            select(Order, func.count(OrderItem.id).label('items_count'))
            .outerjoin(OrderItem, OrderItem.order_id == Order.id)
            .where(and_(*query_filters))
            .group_by(Order.id)
            .order_by(order_func(sort_column))
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        
        result = await db.execute(query)
        
        orders = []
        for order, items_count in result.fetchall():
            orders.append({
                'id': order.id,
                'order_number': order.order_number,
                'customer_name': order.customer_name,
                'customer_email': order.customer_email,
                'status': order.status.value,
                'payment_status': order.payment_status.value,
                'total_amount': Decimal(str(order.total_amount)),
                'items_count': items_count,
                'created_at': order.created_at,
                'has_tracking': order.tracking_number is not None
            })
        
        return {
            'items': orders,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        }
    
    @staticmethod
    async def get_order_detail(
        db: AsyncSession,
        order_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get complete order details"""
        result = await db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            return None
        
        # Get items with product details
        items_result = await db.execute(
            select(OrderItem, Product.name, Product.images)
            .join(Product, Product.id == OrderItem.product_id)
            .where(OrderItem.order_id == order_id)
        )
        
        items = []
        for item, product_name, product_images in items_result.fetchall():
            thumbnail = None
            if product_images and len(product_images) > 0:
                thumbnail = product_images[0].get('url')
            
            items.append({
                'id': item.id,
                'product_id': item.product_id,
                'product_name': product_name,
                'variant_id': item.variant_id,
                'variant_options': item.variant_options,
                'quantity': item.quantity,
                'price': Decimal(str(item.price)),
                'total_price': Decimal(str(item.total_price)),
                'thumbnail': thumbnail
            })
        
        # Get status history
        history_result = await db.execute(
            select(OrderStatusHistory)
            .where(OrderStatusHistory.order_id == order_id)
            .order_by(OrderStatusHistory.created_at)
        )
        
        status_history = []
        for history in history_result.scalars().all():
            status_history.append({
                'old_status': history.old_status,
                'new_status': history.new_status,
                'note': history.note,
                'changed_by': history.changed_by,
                'created_at': history.created_at
            })
        
        return {
            'id': order.id,
            'order_number': order.order_number,
            'status': order.status.value,
            'payment_status': order.payment_status.value,
            'customer_email': order.customer_email,
            'customer_name': order.customer_name,
            'customer_phone': order.customer_phone,
            'user_id': order.user_id,
            'items': items,
            'shipping_address': order.shipping_address,
            'shipping_city': order.shipping_city,
            'shipping_state': order.shipping_state,
            'shipping_postal_code': order.shipping_postal_code,
            'shipping_country': order.shipping_country,
            'billing_address': order.billing_address,
            'billing_city': order.billing_city,
            'billing_state': order.billing_state,
            'billing_postal_code': order.billing_postal_code,
            'billing_country': order.billing_country,
            'subtotal': Decimal(str(order.subtotal)),
            'shipping_cost': Decimal(str(order.shipping_cost)),
            'tax_amount': Decimal(str(order.tax_amount)),
            'discount_amount': Decimal(str(order.discount_amount)),
            'total_amount': Decimal(str(order.total_amount)),
            'coupon_code': order.coupon_code,
            'tracking_number': order.tracking_number,
            'tracking_carrier': order.tracking_carrier,
            'payment_method': order.payment_method,
            'payment_intent_id': order.payment_intent_id,
            'notes': order.notes,
            'admin_notes': order.admin_notes,
            'tags': order.tags,
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'paid_at': order.paid_at,
            'shipped_at': order.shipped_at,
            'delivered_at': order.delivered_at,
            'cancelled_at': order.cancelled_at,
            'status_history': status_history
        }
    
    @staticmethod
    async def update_order_status(
        db: AsyncSession,
        order_id: int,
        new_status: str,
        note: Optional[str] = None,
        admin_id: Optional[int] = None,
        send_notification: bool = True
    ) -> Dict[str, Any]:
        """Update order status"""
        result = await db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            return {'error': 'Order not found'}
        
        old_status = order.status
        order.status = OrderStatus(new_status)
        
        # Update timestamps based on status
        if order.status == OrderStatus.SHIPPED and not order.shipped_at:
            order.shipped_at = datetime.now()
        elif order.status == OrderStatus.DELIVERED and not order.delivered_at:
            order.delivered_at = datetime.now()
        elif order.status == OrderStatus.CANCELLED and not order.cancelled_at:
            order.cancelled_at = datetime.now()
        
        # Record status change
        history = OrderStatusHistory(
            order_id=order_id,
            old_status=old_status.value,
            new_status=new_status,
            note=note,
            changed_by=admin_id
        )
        db.add(history)
        
        await db.commit()
        
        # Send notification
        if send_notification:
            try:
                notification_service = OrderNotificationService()
                
                if order.status == OrderStatus.SHIPPED:
                    await notification_service.send_shipping_notification(order)
                elif order.status == OrderStatus.DELIVERED:
                    await notification_service.send_delivery_confirmation(order)
                elif order.status == OrderStatus.CANCELLED:
                    await notification_service.send_cancellation_notification(order, note or "")
            except Exception as e:
                print(f"Failed to send notification: {e}")
        
        return {'success': True, 'order_id': order_id, 'new_status': new_status}
    
    @staticmethod
    async def create_manual_order(
        db: AsyncSession,
        store_id: int,
        order_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create order manually"""
        # Calculate totals
        subtotal = Decimal('0')
        items_to_create = []
        
        for item_data in order_data['items']:
            # Get product
            product_result = await db.execute(
                select(Product).where(Product.id == item_data['product_id'])
            )
            product = product_result.scalar_one_or_none()
            
            if not product:
                return {'error': f"Product {item_data['product_id']} not found"}
            
            # Get price
            price = item_data.get('price') or Decimal(str(product.price))
            quantity = item_data['quantity']
            total_price = price * quantity
            
            subtotal += total_price
            
            items_to_create.append({
                'product_id': product.id,
                'product_name': product.name,
                'variant_id': item_data.get('variant_id'),
                'quantity': quantity,
                'price': float(price),
                'total_price': float(total_price)
            })
        
        # Calculate final amounts
        shipping_cost = order_data.get('shipping_cost', Decimal('0'))
        discount_amount = order_data.get('discount_amount', Decimal('0'))
        tax_rate = order_data.get('tax_rate', Decimal('0'))
        
        tax_amount = (subtotal - discount_amount) * (tax_rate / 100)
        total_amount = subtotal + shipping_cost + tax_amount - discount_amount
        
        # Create order
        order = Order(
            store_id=store_id,
            order_number=generate_order_number(),
            status=OrderStatus.PENDING,
            payment_status=PaymentStatus.COMPLETED if order_data.get('mark_as_paid') else PaymentStatus.PENDING,
            customer_email=order_data.get('customer_email'),
            customer_name=order_data['customer_name'],
            customer_phone=order_data.get('customer_phone'),
            shipping_address=order_data['shipping_address'],
            shipping_city=order_data['shipping_city'],
            shipping_state=order_data.get('shipping_state'),
            shipping_postal_code=order_data['shipping_postal_code'],
            shipping_country=order_data.get('shipping_country', 'IT'),
            billing_address=order_data.get('billing_address') or order_data['shipping_address'],
            billing_city=order_data.get('billing_city') or order_data['shipping_city'],
            billing_state=order_data.get('billing_state') or order_data.get('shipping_state'),
            billing_postal_code=order_data.get('billing_postal_code') or order_data['shipping_postal_code'],
            billing_country=order_data.get('billing_country') or order_data.get('shipping_country', 'IT'),
            subtotal=float(subtotal),
            shipping_cost=float(shipping_cost),
            tax_amount=float(tax_amount),
            discount_amount=float(discount_amount),
            total_amount=float(total_amount),
            payment_method=order_data.get('payment_method', 'manual'),
            notes=order_data.get('notes'),
            tags=order_data.get('tags')
        )
        
        if order_data.get('mark_as_paid'):
            order.paid_at = datetime.now()
        
        db.add(order)
        await db.flush()
        
        # Create order items
        for item_data in items_to_create:
            item = OrderItem(
                order_id=order.id,
                **item_data
            )
            db.add(item)
        
        await db.commit()
        await db.refresh(order)
        
        # Send confirmation email
        if order_data.get('send_confirmation') and order.customer_email:
            try:
                notification_service = OrderNotificationService()
                await notification_service.send_order_confirmation(order)
            except Exception as e:
                print(f"Failed to send confirmation: {e}")
        
        return {
            'success': True,
            'order_id': order.id,
            'order_number': order.order_number
        }
    
    @staticmethod
    async def get_order_statistics(
        db: AsyncSession,
        store_id: int
    ) -> Dict[str, Any]:
        """Get order statistics"""
        # Total orders by status
        status_result = await db.execute(
            select(
                func.count(Order.id).label('total'),
                func.count(func.nullif(Order.status == OrderStatus.PENDING, False)).label('pending'),
                func.count(func.nullif(Order.status == OrderStatus.PROCESSING, False)).label('processing'),
                func.count(func.nullif(Order.status == OrderStatus.DELIVERED, False)).label('completed'),
                func.count(func.nullif(Order.status == OrderStatus.CANCELLED, False)).label('cancelled'),
                func.coalesce(func.sum(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=0
                    )
                ), 0).label('revenue'),
                func.coalesce(func.avg(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=None
                    )
                ), 0).label('aov')
            )
            .where(Order.store_id == store_id)
        )
        stats = status_result.first()
        
        # Today's stats
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_result = await db.execute(
            select(
                func.count(Order.id).label('orders'),
                func.coalesce(func.sum(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=0
                    )
                ), 0).label('revenue')
            )
            .where(
                Order.store_id == store_id,
                Order.created_at >= today_start
            )
        )
        today_stats = today_result.first()
        
        return {
            'total_orders': stats.total,
            'pending_orders': stats.pending,
            'processing_orders': stats.processing,
            'completed_orders': stats.completed,
            'cancelled_orders': stats.cancelled,
            'total_revenue': Decimal(str(stats.revenue)),
            'average_order_value': Decimal(str(stats.aov)),
            'today_orders': today_stats.orders,
            'today_revenue': Decimal(str(today_stats.revenue))
        }
    
    @staticmethod
    async def export_orders_to_csv(
        db: AsyncSession,
        store_id: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """Export orders to CSV"""
        query_filters = [Order.store_id == store_id]
        
        if filters:
            # Apply same filters as get_orders_list
            if filters.get('status'):
                status_list = [OrderStatus(s) for s in filters['status']]
                query_filters.append(Order.status.in_(status_list))
            
            if filters.get('date_from'):
                query_filters.append(cast(Order.created_at, Date) >= filters['date_from'])
            if filters.get('date_to'):
                query_filters.append(cast(Order.created_at, Date) <= filters['date_to'])
        
        result = await db.execute(
            select(Order)
            .where(and_(*query_filters))
            .order_by(desc(Order.created_at))
        )
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Order Number', 'Date', 'Customer Name', 'Customer Email',
            'Status', 'Payment Status', 'Subtotal', 'Shipping', 'Tax',
            'Discount', 'Total', 'Tracking Number'
        ])
        
        # Data
        for order in result.scalars().all():
            writer.writerow([
                order.order_number,
                order.created_at.strftime('%Y-%m-%d %H:%M'),
                order.customer_name or '',
                order.customer_email or '',
                order.status.value,
                order.payment_status.value,
                order.subtotal,
                order.shipping_cost,
                order.tax_amount,
                order.discount_amount,
                order.total_amount,
                order.tracking_number or ''
            ])
        
        return output.getvalue()
