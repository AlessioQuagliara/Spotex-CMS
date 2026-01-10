"""
Cart schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal


class CartItemBase(BaseModel):
    """Base cart item schema"""
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(..., ge=1, le=999)
    custom_options: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class CartItemCreate(CartItemBase):
    """Create cart item"""
    pass


class CartItemUpdate(BaseModel):
    """Update cart item"""
    quantity: int = Field(..., ge=0, le=999)  # 0 to remove
    custom_options: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class CartItemResponse(CartItemBase):
    """Cart item response"""
    id: int
    cart_id: int
    price: Decimal
    total_price: Decimal
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    variant_name: Optional[str] = None
    is_available: bool = True
    created_at: datetime
    updated_at: datetime


class CartSummary(BaseModel):
    """Cart summary"""
    subtotal: Decimal
    discount_amount: Decimal = Decimal('0')
    shipping_cost: Decimal = Decimal('0')
    tax_amount: Decimal = Decimal('0')
    total: Decimal
    items_count: int
    coupon_code: Optional[str] = None

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    """Cart response"""
    id: int
    store_id: int
    items: List[CartItemResponse]
    summary: CartSummary
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApplyCouponRequest(BaseModel):
    """Apply coupon to cart"""
    coupon_code: str = Field(..., min_length=1, max_length=50)


class MergeCartRequest(BaseModel):
    """Merge guest cart with user cart"""
    session_id: str = Field(..., min_length=1, max_length=255)
