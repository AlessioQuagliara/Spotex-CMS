"""
Admin dashboard schemas
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from decimal import Decimal


class RealtimeMetrics(BaseModel):
    """Real-time metrics"""
    # Sales metrics
    today_revenue: Decimal
    today_orders: int
    today_customers: int
    
    # Comparison with yesterday
    revenue_change: float  # percentage
    orders_change: float
    customers_change: float
    
    # Current status
    pending_orders: int
    low_stock_products: int
    active_customers_now: int  # online now
    
    # Averages
    average_order_value: Decimal
    conversion_rate: float
    
    class Config:
        from_attributes = True


class SalesChartData(BaseModel):
    """Sales chart data point"""
    timestamp: str  # ISO format
    revenue: Decimal
    orders: int
    
    class Config:
        from_attributes = True


class SalesChart(BaseModel):
    """Sales chart response"""
    period: str  # hourly, daily, weekly, monthly
    data: List[SalesChartData]
    total_revenue: Decimal
    total_orders: int
    
    class Config:
        from_attributes = True


class RecentOrderSummary(BaseModel):
    """Recent order summary"""
    id: int
    order_number: str
    customer_email: str
    customer_name: Optional[str]
    total_amount: Decimal
    status: str
    payment_status: str
    items_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class StoreActivity(BaseModel):
    """Store activity entry"""
    id: int
    activity_type: str  # order_created, product_added, customer_registered, etc.
    description: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    user_email: Optional[str]
    
    class Config:
        from_attributes = True


class TopProduct(BaseModel):
    """Top selling product"""
    product_id: int
    product_name: str
    units_sold: int
    revenue: Decimal
    thumbnail: Optional[str]
    
    class Config:
        from_attributes = True


class TopCategory(BaseModel):
    """Top category by sales"""
    category_id: int
    category_name: str
    products_sold: int
    revenue: Decimal
    
    class Config:
        from_attributes = True


class CustomerActivity(BaseModel):
    """Customer activity summary"""
    new_customers_today: int
    returning_customers_today: int
    active_carts: int
    abandoned_carts_today: int
    
    class Config:
        from_attributes = True


class InventoryAlert(BaseModel):
    """Inventory alert"""
    product_id: int
    product_name: str
    current_stock: int
    min_stock_level: int
    variant_name: Optional[str]
    
    class Config:
        from_attributes = True


class RevenueByCategory(BaseModel):
    """Revenue breakdown by category"""
    category_name: str
    revenue: Decimal
    percentage: float
    
    class Config:
        from_attributes = True


class AdminDashboardResponse(BaseModel):
    """Complete admin dashboard response"""
    # Real-time metrics
    metrics: RealtimeMetrics
    
    # Charts
    sales_chart_today: SalesChart
    sales_chart_week: SalesChart
    
    # Recent activity
    recent_orders: List[RecentOrderSummary]
    recent_activities: List[StoreActivity]
    
    # Top performers
    top_products: List[TopProduct]
    top_categories: List[TopCategory]
    
    # Customer insights
    customer_activity: CustomerActivity
    
    # Alerts
    inventory_alerts: List[InventoryAlert]
    pending_returns: int
    
    # Revenue breakdown
    revenue_by_category: List[RevenueByCategory]
    
    class Config:
        from_attributes = True


class QuickStats(BaseModel):
    """Quick statistics cards"""
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    
    # Period comparison
    products_change: float
    customers_change: float
    orders_change: float
    revenue_change: float
    
    class Config:
        from_attributes = True
