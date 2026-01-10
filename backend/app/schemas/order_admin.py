"""
Order management schemas for admin dashboard
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, validator
from decimal import Decimal


class OrderFilters(BaseModel):
    """Advanced order filters"""
    status: Optional[List[str]] = None
    payment_status: Optional[List[str]] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    customer_email: Optional[str] = None
    order_number: Optional[str] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    has_tracking: Optional[bool] = None
    sort_by: str = Field(default="created_at", regex="^(created_at|total_amount|status|customer_name)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")

    class Config:
        from_attributes = True


class OrderStatusUpdateRequest(BaseModel):
    """Update order status"""
    order_id: int
    new_status: str
    note: Optional[str] = None
    send_notification: bool = True

    class Config:
        from_attributes = True


class OrderBulkStatusUpdate(BaseModel):
    """Bulk update order status"""
    order_ids: List[int] = Field(..., min_items=1)
    new_status: str
    note: Optional[str] = None
    send_notifications: bool = True

    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    """Order item for manual order creation"""
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(..., gt=0)
    price: Optional[Decimal] = None  # None = use product price

    class Config:
        from_attributes = True


class ManualOrderCreate(BaseModel):
    """Create order manually"""
    # Customer info
    customer_email: Optional[EmailStr] = None
    customer_name: str
    customer_phone: Optional[str] = None
    
    # Items
    items: List[OrderItemCreate] = Field(..., min_items=1)
    
    # Addresses
    shipping_address: str
    shipping_city: str
    shipping_state: Optional[str] = None
    shipping_postal_code: str
    shipping_country: str = "IT"
    
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_postal_code: Optional[str] = None
    billing_country: Optional[str] = None
    
    # Pricing
    shipping_cost: Decimal = Field(default=Decimal('0'))
    discount_amount: Decimal = Field(default=Decimal('0'))
    tax_rate: Decimal = Field(default=Decimal('0'))
    
    # Metadata
    payment_method: str = Field(default="manual")
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    
    # Auto-create
    mark_as_paid: bool = False
    send_confirmation: bool = True

    @validator('billing_address', always=True)
    def set_billing_address(cls, v, values):
        if v is None and 'shipping_address' in values:
            return values['shipping_address']
        return v

    class Config:
        from_attributes = True


class OrderDetailResponse(BaseModel):
    """Complete order details for admin"""
    # Order info
    id: int
    order_number: str
    status: str
    payment_status: str
    
    # Customer
    customer_email: Optional[str]
    customer_name: Optional[str]
    customer_phone: Optional[str]
    user_id: Optional[int]
    
    # Items
    items: List[Dict[str, Any]]
    
    # Addresses
    shipping_address: str
    shipping_city: str
    shipping_state: Optional[str]
    shipping_postal_code: str
    shipping_country: str
    
    billing_address: Optional[str]
    billing_city: Optional[str]
    billing_state: Optional[str]
    billing_postal_code: Optional[str]
    billing_country: Optional[str]
    
    # Pricing
    subtotal: Decimal
    shipping_cost: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    
    # Coupon
    coupon_code: Optional[str]
    
    # Tracking
    tracking_number: Optional[str]
    tracking_carrier: Optional[str]
    
    # Metadata
    payment_method: Optional[str]
    payment_intent_id: Optional[str]
    notes: Optional[str]
    admin_notes: Optional[str]
    tags: Optional[List[str]]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    paid_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    
    # Status history
    status_history: List[Dict[str, Any]]

    class Config:
        from_attributes = True


class OrderListItem(BaseModel):
    """Order list item for table view"""
    id: int
    order_number: str
    customer_name: Optional[str]
    customer_email: Optional[str]
    status: str
    payment_status: str
    total_amount: Decimal
    items_count: int
    created_at: datetime
    has_tracking: bool

    class Config:
        from_attributes = True


class OrderUpdateRequest(BaseModel):
    """Update order details"""
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    shipping_cost: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    notes: Optional[str] = None
    admin_notes: Optional[str] = None
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True


class OrderTrackingUpdate(BaseModel):
    """Update order tracking info"""
    tracking_number: str
    tracking_carrier: str
    send_notification: bool = True

    class Config:
        from_attributes = True


class OrderRefundRequest(BaseModel):
    """Process order refund"""
    amount: Decimal
    reason: str
    refund_shipping: bool = False
    send_notification: bool = True

    class Config:
        from_attributes = True


class OrderStatistics(BaseModel):
    """Order statistics for admin"""
    total_orders: int
    pending_orders: int
    processing_orders: int
    completed_orders: int
    cancelled_orders: int
    
    total_revenue: Decimal
    average_order_value: Decimal
    
    today_orders: int
    today_revenue: Decimal
    
    class Config:
        from_attributes = True


class OrderExportRequest(BaseModel):
    """Export orders to CSV"""
    filters: Optional[OrderFilters] = None
    include_items: bool = True
    include_addresses: bool = True

    class Config:
        from_attributes = True


class OrderNoteCreate(BaseModel):
    """Add note to order"""
    note: str = Field(..., min_length=1)
    is_admin_note: bool = True
    notify_customer: bool = False

    class Config:
        from_attributes = True


class OrderEmailResend(BaseModel):
    """Resend order email"""
    email_type: str = Field(..., regex="^(confirmation|payment|shipping|delivery|cancellation|refund)$")

    class Config:
        from_attributes = True


class OrderBulkExport(BaseModel):
    """Bulk export orders"""
    order_ids: List[int]
    format: str = Field(default="csv", regex="^(csv|pdf|json)$")

    class Config:
        from_attributes = True


class OrderPaymentUpdate(BaseModel):
    """Update payment info"""
    payment_status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None

    class Config:
        from_attributes = True
