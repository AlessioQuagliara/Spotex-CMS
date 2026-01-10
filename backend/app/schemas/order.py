"""
Order schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from decimal import Decimal
from app.models.order import OrderStatus, PaymentStatus, PaymentMethod


class OrderItemResponse(BaseModel):
    """Order item response"""
    id: int
    product_id: int
    variant_id: Optional[int] = None
    product_name: str
    product_sku: str
    variant_name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    custom_options: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ShippingAddressBase(BaseModel):
    """Base shipping address"""
    line1: str = Field(..., min_length=1, max_length=255)
    line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=20)


class BillingAddressBase(ShippingAddressBase):
    """Base billing address"""
    pass


class CheckoutRequest(BaseModel):
    """Checkout request"""
    # Customer info
    customer_email: EmailStr
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=50)
    
    # Addresses
    shipping_address: ShippingAddressBase
    billing_address: Optional[BillingAddressBase] = None  # If None, use shipping
    
    # Shipping
    shipping_method: str = Field(..., min_length=1, max_length=100)
    
    # Payment
    payment_method: PaymentMethod
    
    # Notes
    customer_notes: Optional[str] = None
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Order response"""
    id: int
    order_number: str
    store_id: int
    user_id: Optional[int] = None
    
    status: OrderStatus
    payment_status: PaymentStatus
    
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    
    shipping_address_line1: str
    shipping_address_line2: Optional[str] = None
    shipping_city: str
    shipping_state: Optional[str] = None
    shipping_country: str
    shipping_postal_code: str
    
    billing_address_line1: str
    billing_address_line2: Optional[str] = None
    billing_city: str
    billing_state: Optional[str] = None
    billing_country: str
    billing_postal_code: str
    
    subtotal: Decimal
    shipping_cost: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    
    coupon_code: Optional[str] = None
    shipping_method: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    
    customer_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    
    items: List[OrderItemResponse] = []
    
    created_at: datetime
    updated_at: datetime
    paid_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Order list item (minimal)"""
    id: int
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    customer_name: str
    customer_email: str
    total_amount: Decimal
    items_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedOrderResponse(BaseModel):
    """Paginated order response"""
    items: List[OrderListResponse]
    total: int
    page: int
    per_page: int
    pages: int


class UpdateOrderStatusRequest(BaseModel):
    """Update order status"""
    status: OrderStatus
    note: Optional[str] = None


class UpdateShippingRequest(BaseModel):
    """Update shipping info"""
    tracking_number: str = Field(..., min_length=1, max_length=100)
    carrier: str = Field(..., min_length=1, max_length=100)


class PaymentIntentResponse(BaseModel):
    """Payment intent response"""
    client_secret: str
    payment_intent_id: str
    amount: Decimal
    currency: str


class PayPalOrderResponse(BaseModel):
    """PayPal order response"""
    order_id: str
    approval_url: str
    amount: Decimal
    currency: str


class ConfirmPaymentRequest(BaseModel):
    """Confirm payment"""
    payment_intent_id: Optional[str] = None
    paypal_order_id: Optional[str] = None
