"""
Customer management schemas for admin dashboard
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, validator
from decimal import Decimal


class CustomerFilters(BaseModel):
    """Advanced customer filters"""
    search: Optional[str] = None  # Search in name, email, phone
    status: Optional[str] = Field(None, regex="^(active|inactive|blocked)$")
    has_orders: Optional[bool] = None
    min_orders: Optional[int] = None
    max_orders: Optional[int] = None
    min_spent: Optional[Decimal] = None
    max_spent: Optional[Decimal] = None
    registered_from: Optional[date] = None
    registered_to: Optional[date] = None
    last_order_from: Optional[date] = None
    last_order_to: Optional[date] = None
    segment: Optional[str] = None  # Customer segment/group
    tags: Optional[List[str]] = None
    sort_by: str = Field(default="created_at", regex="^(created_at|email|total_spent|orders_count|last_order_at)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")

    class Config:
        from_attributes = True


class CustomerListItem(BaseModel):
    """Customer list item for table view"""
    id: int
    email: str
    name: Optional[str]
    phone: Optional[str]
    status: str
    orders_count: int
    total_spent: Decimal
    average_order_value: Decimal
    last_order_at: Optional[datetime]
    created_at: datetime
    tags: Optional[List[str]]

    class Config:
        from_attributes = True


class CustomerOrderSummary(BaseModel):
    """Order summary for customer detail"""
    id: int
    order_number: str
    status: str
    payment_status: str
    total_amount: Decimal
    items_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerDetailResponse(BaseModel):
    """Complete customer details for admin"""
    # Basic info
    id: int
    email: str
    name: Optional[str]
    phone: Optional[str]
    status: str
    
    # Avatar/profile
    avatar: Optional[str]
    
    # Stats
    orders_count: int
    total_spent: Decimal
    average_order_value: Decimal
    lifetime_value: Decimal
    
    # Dates
    first_order_at: Optional[datetime]
    last_order_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]
    
    # Addresses
    default_shipping_address: Optional[Dict[str, Any]]
    default_billing_address: Optional[Dict[str, Any]]
    all_addresses: List[Dict[str, Any]]
    
    # Segmentation
    segment: Optional[str]
    tags: Optional[List[str]]
    notes: Optional[str]
    
    # Recent orders
    recent_orders: List[CustomerOrderSummary]
    
    # Loyalty
    loyalty_points: Optional[int]
    loyalty_tier: Optional[str]

    class Config:
        from_attributes = True


class CustomerUpdateRequest(BaseModel):
    """Update customer details"""
    name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = Field(None, regex="^(active|inactive|blocked)$")
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    segment: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerGroupCreate(BaseModel):
    """Create customer group/segment"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    
    # Auto-assignment rules
    rules: Optional[Dict[str, Any]] = None  # JSON rules for auto-assignment
    
    # Manual assignment
    customer_ids: Optional[List[int]] = None
    
    # Metadata
    color: Optional[str] = Field(None, regex="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerGroupUpdate(BaseModel):
    """Update customer group"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    rules: Optional[Dict[str, Any]] = None
    color: Optional[str] = Field(None, regex="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerGroupResponse(BaseModel):
    """Customer group response"""
    id: int
    name: str
    description: Optional[str]
    rules: Optional[Dict[str, Any]]
    color: Optional[str]
    icon: Optional[str]
    customers_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerBulkAction(BaseModel):
    """Bulk action on customers"""
    customer_ids: List[int] = Field(..., min_items=1)
    action: str = Field(..., regex="^(add_tag|remove_tag|set_segment|set_status|delete)$")
    value: Optional[str] = None  # Tag name, segment name, or status

    class Config:
        from_attributes = True


class CustomerStatistics(BaseModel):
    """Customer statistics for admin"""
    total_customers: int
    active_customers: int
    inactive_customers: int
    blocked_customers: int
    
    new_customers_today: int
    new_customers_week: int
    new_customers_month: int
    
    customers_with_orders: int
    customers_without_orders: int
    
    average_customer_value: Decimal
    total_customer_value: Decimal
    
    repeat_customers: int
    repeat_rate: float

    class Config:
        from_attributes = True


class CustomerExportRequest(BaseModel):
    """Export customers to CSV"""
    filters: Optional[CustomerFilters] = None
    include_addresses: bool = True
    include_stats: bool = True

    class Config:
        from_attributes = True


class CustomerSegmentAnalysis(BaseModel):
    """Segment analysis data"""
    segment_name: str
    customers_count: int
    total_orders: int
    total_revenue: Decimal
    average_order_value: Decimal
    average_orders_per_customer: float

    class Config:
        from_attributes = True


class CustomerActivityLog(BaseModel):
    """Customer activity log entry"""
    id: int
    customer_id: int
    activity_type: str
    description: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerNoteCreate(BaseModel):
    """Add note to customer"""
    note: str = Field(..., min_length=1)

    class Config:
        from_attributes = True


class CustomerMergeRequest(BaseModel):
    """Merge duplicate customers"""
    source_customer_id: int
    target_customer_id: int
    merge_orders: bool = True
    merge_addresses: bool = True
    merge_notes: bool = True

    class Config:
        from_attributes = True


class CustomerLifetimeValue(BaseModel):
    """Customer LTV calculation"""
    customer_id: int
    total_spent: Decimal
    orders_count: int
    average_order_value: Decimal
    first_order_date: Optional[datetime]
    last_order_date: Optional[datetime]
    days_as_customer: int
    predicted_ltv: Optional[Decimal]

    class Config:
        from_attributes = True


class CustomerCohortAnalysis(BaseModel):
    """Cohort analysis data"""
    cohort_month: str
    customers_count: int
    retention_rates: Dict[int, float]  # Month -> retention rate

    class Config:
        from_attributes = True
