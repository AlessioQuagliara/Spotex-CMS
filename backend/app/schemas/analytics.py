"""
Analytics schemas
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal


class SalesDashboardResponse(BaseModel):
    """Sales dashboard overview"""
    # Today's metrics
    today_sales: Decimal
    today_orders: int
    today_visitors: int
    today_conversion_rate: float
    
    # Period comparison
    period_sales: Decimal
    period_orders: int
    period_growth: float  # percentage
    
    # Averages
    average_order_value: Decimal
    
    # Top performers
    top_products: List[Dict[str, Any]]
    top_categories: List[Dict[str, Any]]
    
    # Recent activity
    recent_orders: int
    pending_orders: int
    
    # Cart metrics
    abandoned_carts: int
    abandoned_cart_value: Decimal
    recovery_rate: float

    class Config:
        from_attributes = True


class SalesReportRequest(BaseModel):
    """Sales report request"""
    start_date: date
    end_date: date
    group_by: str = Field(default="day", pattern="^(hour|day|week|month)$")
    metrics: Optional[List[str]] = None  # revenue, orders, customers, etc.

    class Config:
        from_attributes = True


class SalesReportResponse(BaseModel):
    """Sales report response"""
    period: str
    data: List[Dict[str, Any]]
    summary: Dict[str, Any]
    
    class Config:
        from_attributes = True


class CustomerInsightResponse(BaseModel):
    """Customer insights"""
    total_customers: int
    new_customers: int
    returning_customers: int
    
    # Segments
    segments: Dict[str, int]  # Champions: 150, Loyal: 200, etc.
    
    # Behavior
    average_lifetime_value: Decimal
    average_order_count: float
    repeat_purchase_rate: float
    
    # Churn
    at_risk_customers: int
    churned_customers: int
    
    # Top customers
    top_customers: List[Dict[str, Any]]

    class Config:
        from_attributes = True


class ProductAnalyticsResponse(BaseModel):
    """Product analytics"""
    product_id: int
    product_name: str
    
    # Views and engagement
    view_count: int
    add_to_cart_count: int
    purchase_count: int
    
    # Sales
    units_sold: int
    revenue: Decimal
    
    # Conversion
    view_to_cart_rate: float
    cart_to_purchase_rate: float
    conversion_rate: float
    
    # Returns
    return_count: int
    return_rate: float
    
    period_start: datetime
    period_end: datetime

    class Config:
        from_attributes = True


class AbandonedCartResponse(BaseModel):
    """Abandoned cart response"""
    id: int
    cart_id: int
    email: Optional[str] = None
    items_count: int
    cart_value: Decimal
    abandoned_at: datetime
    recovery_email_sent: bool
    recovery_email_sent_at: Optional[datetime] = None
    converted: bool
    converted_at: Optional[datetime] = None
    order_id: Optional[int] = None

    class Config:
        from_attributes = True


class AbandonedCartListResponse(BaseModel):
    """Abandoned cart list"""
    items: List[AbandonedCartResponse]
    total: int
    total_value: Decimal
    recovery_rate: float
    page: int
    per_page: int
    pages: int


class ActivityLogRequest(BaseModel):
    """Activity log request"""
    activity_type: str = Field(..., max_length=50)
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    page_url: Optional[str] = Field(None, max_length=500)
    referrer: Optional[str] = Field(None, max_length=500)
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class CustomerSegmentResponse(BaseModel):
    """Customer segment response"""
    segment_name: str
    customer_count: int
    total_revenue: Decimal
    average_order_value: Decimal
    average_orders: float

    class Config:
        from_attributes = True


class RevenueByPeriodResponse(BaseModel):
    """Revenue by period"""
    period: str  # Date or datetime string
    revenue: Decimal
    orders: int
    customers: int
    average_order_value: Decimal

    class Config:
        from_attributes = True


class TopProductResponse(BaseModel):
    """Top product by sales"""
    product_id: int
    product_name: str
    units_sold: int
    revenue: Decimal
    orders: int

    class Config:
        from_attributes = True


class CategoryPerformanceResponse(BaseModel):
    """Category performance"""
    category_id: int
    category_name: str
    products_sold: int
    revenue: Decimal
    orders: int

    class Config:
        from_attributes = True


class ConversionFunnelResponse(BaseModel):
    """Conversion funnel analysis"""
    visitors: int
    product_views: int
    add_to_cart: int
    checkout_started: int
    orders_completed: int
    
    # Rates
    view_rate: float
    cart_rate: float
    checkout_rate: float
    conversion_rate: float

    class Config:
        from_attributes = True
