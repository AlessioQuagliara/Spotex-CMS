"""
Coupon schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from app.models.coupon import DiscountType


class CouponBase(BaseModel):
    """Base coupon schema"""
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    discount_type: DiscountType
    discount_value: Decimal = Field(..., ge=0)
    minimum_purchase: Optional[Decimal] = Field(None, ge=0)
    maximum_discount: Optional[Decimal] = Field(None, ge=0)
    usage_limit: Optional[int] = Field(None, ge=1)
    usage_limit_per_user: Optional[int] = Field(None, ge=1)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    applicable_products: Optional[List[int]] = None
    applicable_categories: Optional[List[int]] = None
    excluded_products: Optional[List[int]] = None
    first_order_only: bool = False
    is_active: bool = True

    class Config:
        from_attributes = True

    @validator('discount_value')
    def validate_discount_value(cls, v, values):
        if 'discount_type' in values:
            if values['discount_type'] == DiscountType.PERCENTAGE and v > 100:
                raise ValueError('Percentage discount cannot exceed 100')
        return v


class CouponCreate(CouponBase):
    """Create coupon"""
    store_id: int


class CouponUpdate(BaseModel):
    """Update coupon"""
    description: Optional[str] = Field(None, max_length=500)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[Decimal] = Field(None, ge=0)
    minimum_purchase: Optional[Decimal] = Field(None, ge=0)
    maximum_discount: Optional[Decimal] = Field(None, ge=0)
    usage_limit: Optional[int] = Field(None, ge=1)
    usage_limit_per_user: Optional[int] = Field(None, ge=1)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    applicable_products: Optional[List[int]] = None
    applicable_categories: Optional[List[int]] = None
    excluded_products: Optional[List[int]] = None
    first_order_only: Optional[bool] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True


class CouponResponse(CouponBase):
    """Coupon response"""
    id: int
    store_id: int
    current_usage: int
    created_at: datetime
    updated_at: datetime


class ValidateCouponResponse(BaseModel):
    """Validate coupon response"""
    valid: bool
    message: str
    discount_amount: Optional[Decimal] = None
    final_total: Optional[Decimal] = None


class ShippingRateBase(BaseModel):
    """Base shipping rate schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    base_rate: Decimal = Field(..., ge=0)
    rate_per_kg: Optional[Decimal] = Field(None, ge=0)
    free_shipping_threshold: Optional[Decimal] = Field(None, ge=0)
    countries: Optional[List[str]] = None
    min_delivery_days: Optional[int] = Field(None, ge=0)
    max_delivery_days: Optional[int] = Field(None, ge=0)
    is_active: bool = True
    position: int = 0

    class Config:
        from_attributes = True


class ShippingRateCreate(ShippingRateBase):
    """Create shipping rate"""
    store_id: int


class ShippingRateUpdate(BaseModel):
    """Update shipping rate"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    base_rate: Optional[Decimal] = Field(None, ge=0)
    rate_per_kg: Optional[Decimal] = Field(None, ge=0)
    free_shipping_threshold: Optional[Decimal] = Field(None, ge=0)
    countries: Optional[List[str]] = None
    min_delivery_days: Optional[int] = Field(None, ge=0)
    max_delivery_days: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    position: Optional[int] = None

    class Config:
        from_attributes = True


class ShippingRateResponse(ShippingRateBase):
    """Shipping rate response"""
    id: int
    store_id: int
    created_at: datetime
    updated_at: datetime


class CalculateShippingRequest(BaseModel):
    """Calculate shipping request"""
    country: str = Field(..., min_length=2, max_length=100)
    weight: Optional[Decimal] = Field(None, ge=0)


class ShippingOptionResponse(BaseModel):
    """Available shipping option"""
    shipping_rate_id: int
    name: str
    description: Optional[str] = None
    cost: Decimal
    estimated_days: Optional[str] = None
