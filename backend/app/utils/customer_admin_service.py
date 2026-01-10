"""
Customer management service for admin operations
"""
import csv
import io
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc, cast, Date, extract
from decimal import Decimal

from app.models.user import User, UserStatus
from app.models.order import Order, OrderItem, PaymentStatus
from app.models.customer_address import CustomerAddress


class CustomerAdminService:
    """Service for admin customer operations"""
    
    @staticmethod
    async def get_customers_list(
        db: AsyncSession,
        filters: Dict[str, Any],
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get filtered customers list"""
        query_filters = []
        
        # Search in name, email, phone
        if filters.get('search'):
            search_term = f"%{filters['search']}%"
            query_filters.append(
                or_(
                    User.email.ilike(search_term),
                    User.name.ilike(search_term),
                    User.phone.ilike(search_term)
                )
            )
        
        # Status filter
        if filters.get('status'):
            query_filters.append(User.status == UserStatus(filters['status']))
        
        # Registration date range
        if filters.get('registered_from'):
            query_filters.append(cast(User.created_at, Date) >= filters['registered_from'])
        if filters.get('registered_to'):
            query_filters.append(cast(User.created_at, Date) <= filters['registered_to'])
        
        # Segment/tags
        if filters.get('segment'):
            query_filters.append(User.segment == filters['segment'])
        if filters.get('tags'):
            for tag in filters['tags']:
                query_filters.append(User.tags.contains([tag]))
        
        # Build subquery for order stats
        order_stats_subquery = (
            select(
                Order.user_id,
                func.count(Order.id).label('orders_count'),
                func.coalesce(func.sum(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=0
                    )
                ), 0).label('total_spent'),
                func.max(Order.created_at).label('last_order_at')
            )
            .where(Order.user_id.isnot(None))
            .group_by(Order.user_id)
            .subquery()
        )
        
        # Join with order stats
        base_query = (
            select(
                User,
                func.coalesce(order_stats_subquery.c.orders_count, 0).label('orders_count'),
                func.coalesce(order_stats_subquery.c.total_spent, 0).label('total_spent'),
                order_stats_subquery.c.last_order_at
            )
            .outerjoin(order_stats_subquery, User.id == order_stats_subquery.c.user_id)
        )
        
        if query_filters:
            base_query = base_query.where(and_(*query_filters))
        
        # Has orders filter
        if filters.get('has_orders') is not None:
            if filters['has_orders']:
                base_query = base_query.having(func.coalesce(order_stats_subquery.c.orders_count, 0) > 0)
            else:
                base_query = base_query.having(func.coalesce(order_stats_subquery.c.orders_count, 0) == 0)
        
        # Orders count range
        if filters.get('min_orders'):
            base_query = base_query.having(func.coalesce(order_stats_subquery.c.orders_count, 0) >= filters['min_orders'])
        if filters.get('max_orders'):
            base_query = base_query.having(func.coalesce(order_stats_subquery.c.orders_count, 0) <= filters['max_orders'])
        
        # Spent range
        if filters.get('min_spent'):
            base_query = base_query.having(func.coalesce(order_stats_subquery.c.total_spent, 0) >= float(filters['min_spent']))
        if filters.get('max_spent'):
            base_query = base_query.having(func.coalesce(order_stats_subquery.c.total_spent, 0) <= float(filters['max_spent']))
        
        # Last order date range
        if filters.get('last_order_from'):
            base_query = base_query.having(cast(order_stats_subquery.c.last_order_at, Date) >= filters['last_order_from'])
        if filters.get('last_order_to'):
            base_query = base_query.having(cast(order_stats_subquery.c.last_order_at, Date) <= filters['last_order_to'])
        
        # Count total (need to execute the query to count with having clauses)
        count_query = select(func.count()).select_from(base_query.subquery())
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        # Sort
        sort_by = filters.get('sort_by', 'created_at')
        sort_order = filters.get('sort_order', 'desc')
        
        if sort_by == 'email':
            sort_column = User.email
        elif sort_by == 'created_at':
            sort_column = User.created_at
        elif sort_by == 'total_spent':
            sort_column = order_stats_subquery.c.total_spent
        elif sort_by == 'orders_count':
            sort_column = order_stats_subquery.c.orders_count
        elif sort_by == 'last_order_at':
            sort_column = order_stats_subquery.c.last_order_at
        else:
            sort_column = User.created_at
        
        order_func = desc if sort_order == 'desc' else asc
        
        # Paginate
        final_query = (
            base_query
            .order_by(order_func(sort_column))
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        
        result = await db.execute(final_query)
        
        customers = []
        for user, orders_count, total_spent, last_order_at in result.fetchall():
            avg_order_value = Decimal('0')
            if orders_count > 0:
                avg_order_value = Decimal(str(total_spent)) / orders_count
            
            customers.append({
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'phone': user.phone,
                'status': user.status.value if hasattr(user.status, 'value') else user.status,
                'orders_count': orders_count,
                'total_spent': Decimal(str(total_spent)),
                'average_order_value': avg_order_value,
                'last_order_at': last_order_at,
                'created_at': user.created_at,
                'tags': user.tags
            })
        
        return {
            'items': customers,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page if total > 0 else 0
        }
    
    @staticmethod
    async def get_customer_detail(
        db: AsyncSession,
        customer_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get complete customer details"""
        # Get user
        result = await db.execute(
            select(User).where(User.id == customer_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        # Get order statistics
        stats_result = await db.execute(
            select(
                func.count(Order.id).label('orders_count'),
                func.coalesce(func.sum(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=0
                    )
                ), 0).label('total_spent'),
                func.min(Order.created_at).label('first_order_at'),
                func.max(Order.created_at).label('last_order_at')
            )
            .where(Order.user_id == customer_id)
        )
        stats = stats_result.first()
        
        orders_count = stats.orders_count
        total_spent = Decimal(str(stats.total_spent))
        avg_order_value = total_spent / orders_count if orders_count > 0 else Decimal('0')
        lifetime_value = total_spent  # Can be enhanced with predictive models
        
        # Get recent orders
        recent_orders_result = await db.execute(
            select(Order, func.count(OrderItem.id).label('items_count'))
            .outerjoin(OrderItem, OrderItem.order_id == Order.id)
            .where(Order.user_id == customer_id)
            .group_by(Order.id)
            .order_by(desc(Order.created_at))
            .limit(10)
        )
        
        recent_orders = []
        for order, items_count in recent_orders_result.fetchall():
            recent_orders.append({
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status.value,
                'payment_status': order.payment_status.value,
                'total_amount': Decimal(str(order.total_amount)),
                'items_count': items_count,
                'created_at': order.created_at
            })
        
        # Get addresses
        addresses_result = await db.execute(
            select(CustomerAddress)
            .where(CustomerAddress.user_id == customer_id)
            .order_by(desc(CustomerAddress.is_default))
        )
        
        all_addresses = []
        default_shipping = None
        default_billing = None
        
        for address in addresses_result.scalars().all():
            address_dict = {
                'id': address.id,
                'address_type': address.address_type,
                'address_line1': address.address_line1,
                'address_line2': address.address_line2,
                'city': address.city,
                'state': address.state,
                'postal_code': address.postal_code,
                'country': address.country,
                'is_default': address.is_default
            }
            all_addresses.append(address_dict)
            
            if address.is_default:
                if address.address_type == 'shipping':
                    default_shipping = address_dict
                elif address.address_type == 'billing':
                    default_billing = address_dict
        
        # Get loyalty info
        loyalty_points = None
        loyalty_tier = None
        try:
            from app.models.marketing import LoyaltyAccount
            loyalty_result = await db.execute(
                select(LoyaltyAccount).where(LoyaltyAccount.user_id == customer_id)
            )
            loyalty_account = loyalty_result.scalar_one_or_none()
            if loyalty_account:
                loyalty_points = loyalty_account.current_points
                loyalty_tier = loyalty_account.tier
        except:
            pass
        
        return {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'phone': user.phone,
            'status': user.status.value if hasattr(user.status, 'value') else user.status,
            'avatar': user.avatar if hasattr(user, 'avatar') else None,
            'orders_count': orders_count,
            'total_spent': total_spent,
            'average_order_value': avg_order_value,
            'lifetime_value': lifetime_value,
            'first_order_at': stats.first_order_at,
            'last_order_at': stats.last_order_at,
            'created_at': user.created_at,
            'updated_at': user.updated_at,
            'last_login_at': user.last_login_at if hasattr(user, 'last_login_at') else None,
            'default_shipping_address': default_shipping,
            'default_billing_address': default_billing,
            'all_addresses': all_addresses,
            'segment': user.segment if hasattr(user, 'segment') else None,
            'tags': user.tags,
            'notes': user.notes if hasattr(user, 'notes') else None,
            'recent_orders': recent_orders,
            'loyalty_points': loyalty_points,
            'loyalty_tier': loyalty_tier
        }
    
    @staticmethod
    async def get_customer_statistics(
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Get customer statistics"""
        # Total customers by status
        status_result = await db.execute(
            select(
                func.count(User.id).label('total'),
                func.count(func.nullif(User.status == UserStatus.ACTIVE, False)).label('active'),
                func.count(func.nullif(User.status == UserStatus.INACTIVE, False)).label('inactive'),
                func.count(func.nullif(User.status == UserStatus.BLOCKED, False)).label('blocked')
            )
        )
        status_stats = status_result.first()
        
        # New customers
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        
        new_customers_result = await db.execute(
            select(
                func.count(func.nullif(User.created_at >= today_start, False)).label('today'),
                func.count(func.nullif(User.created_at >= week_start, False)).label('week'),
                func.count(func.nullif(User.created_at >= month_start, False)).label('month')
            )
        )
        new_stats = new_customers_result.first()
        
        # Customers with/without orders
        orders_result = await db.execute(
            select(
                func.count(func.distinct(Order.user_id)).label('with_orders')
            )
            .where(Order.user_id.isnot(None))
        )
        with_orders = orders_result.scalar()
        without_orders = status_stats.total - with_orders
        
        # Customer value metrics
        value_result = await db.execute(
            select(
                func.coalesce(func.avg(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=None
                    )
                ), 0).label('avg_value'),
                func.coalesce(func.sum(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=0
                    )
                ), 0).label('total_value')
            )
        )
        value_stats = value_result.first()
        
        # Repeat customers
        repeat_result = await db.execute(
            select(func.count().label('repeat_customers'))
            .select_from(
                select(Order.user_id)
                .where(
                    Order.user_id.isnot(None),
                    Order.payment_status == PaymentStatus.COMPLETED
                )
                .group_by(Order.user_id)
                .having(func.count(Order.id) > 1)
                .subquery()
            )
        )
        repeat_customers = repeat_result.scalar()
        repeat_rate = (repeat_customers / with_orders * 100) if with_orders > 0 else 0
        
        return {
            'total_customers': status_stats.total,
            'active_customers': status_stats.active,
            'inactive_customers': status_stats.inactive,
            'blocked_customers': status_stats.blocked,
            'new_customers_today': new_stats.today,
            'new_customers_week': new_stats.week,
            'new_customers_month': new_stats.month,
            'customers_with_orders': with_orders,
            'customers_without_orders': without_orders,
            'average_customer_value': Decimal(str(value_stats.avg_value)),
            'total_customer_value': Decimal(str(value_stats.total_value)),
            'repeat_customers': repeat_customers,
            'repeat_rate': round(repeat_rate, 2)
        }
    
    @staticmethod
    async def export_customers_to_csv(
        db: AsyncSession,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """Export customers to CSV"""
        # Use get_customers_list to apply filters
        customers_data = await CustomerAdminService.get_customers_list(
            db=db,
            filters=filters or {},
            page=1,
            per_page=10000  # Export all
        )
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'ID', 'Email', 'Name', 'Phone', 'Status',
            'Orders Count', 'Total Spent', 'Average Order Value',
            'Last Order', 'Registered', 'Tags'
        ])
        
        # Data
        for customer in customers_data['items']:
            writer.writerow([
                customer['id'],
                customer['email'],
                customer['name'] or '',
                customer['phone'] or '',
                customer['status'],
                customer['orders_count'],
                customer['total_spent'],
                customer['average_order_value'],
                customer['last_order_at'].strftime('%Y-%m-%d %H:%M') if customer['last_order_at'] else '',
                customer['created_at'].strftime('%Y-%m-%d %H:%M'),
                ','.join(customer['tags']) if customer['tags'] else ''
            ])
        
        return output.getvalue()
    
    @staticmethod
    async def get_segment_analysis(
        db: AsyncSession
    ) -> List[Dict[str, Any]]:
        """Analyze customers by segment"""
        result = await db.execute(
            select(
                User.segment,
                func.count(func.distinct(User.id)).label('customers_count'),
                func.count(Order.id).label('total_orders'),
                func.coalesce(func.sum(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=0
                    )
                ), 0).label('total_revenue'),
                func.coalesce(func.avg(
                    func.case(
                        (Order.payment_status == PaymentStatus.COMPLETED, Order.total_amount),
                        else_=None
                    )
                ), 0).label('avg_order_value')
            )
            .outerjoin(Order, Order.user_id == User.id)
            .where(User.segment.isnot(None))
            .group_by(User.segment)
        )
        
        segments = []
        for row in result.fetchall():
            avg_orders = row.total_orders / row.customers_count if row.customers_count > 0 else 0
            
            segments.append({
                'segment_name': row.segment,
                'customers_count': row.customers_count,
                'total_orders': row.total_orders,
                'total_revenue': Decimal(str(row.total_revenue)),
                'average_order_value': Decimal(str(row.avg_order_value)),
                'average_orders_per_customer': round(avg_orders, 2)
            })
        
        return segments
