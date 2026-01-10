"""
Coupon and discount models
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, JSON, Enum
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from decimal import Decimal
import enum

from app.database import Base


class DiscountType(str, enum.Enum):
    """Discount type enum"""
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_SHIPPING = "free_shipping"


class Coupon(Base):
    """Coupon/discount code"""
    __tablename__ = "coupons"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # Coupon info
    code: Mapped[str] = Column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = Column(String(500))
    
    # Discount
    discount_type: Mapped[str] = Column(Enum(DiscountType), nullable=False)
    discount_value: Mapped[float] = Column(Numeric(10, 2), nullable=False)  # Percentage or fixed amount
    
    # Constraints
    minimum_purchase: Mapped[Optional[float]] = Column(Numeric(10, 2))
    maximum_discount: Mapped[Optional[float]] = Column(Numeric(10, 2))  # Max discount for percentage
    
    # Usage limits
    usage_limit: Mapped[Optional[int]] = Column(Integer)  # Total uses
    usage_limit_per_user: Mapped[Optional[int]] = Column(Integer)
    current_usage: Mapped[int] = Column(Integer, default=0)
    
    # Validity
    valid_from: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    valid_until: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Restrictions
    applicable_products: Mapped[Optional[str]] = Column(JSON)  # List of product IDs
    applicable_categories: Mapped[Optional[str]] = Column(JSON)  # List of category IDs
    excluded_products: Mapped[Optional[str]] = Column(JSON)
    
    # First order only
    first_order_only: Mapped[bool] = Column(Boolean, default=False)
    
    # Status
    is_active: Mapped[bool] = Column(Boolean, default=True)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    store: Mapped["Store"] = relationship("Store")
    usage_records: Mapped[List["CouponUsage"]] = relationship("CouponUsage", back_populates="coupon", cascade="all, delete-orphan")
    
    def is_valid(self, user_id: Optional[int] = None, cart_total: Decimal = Decimal('0')) -> tuple[bool, str]:
        """Check if coupon is valid"""
        now = datetime.now()
        
        if not self.is_active:
            return False, "Coupon is not active"
        
        if self.valid_from and now < self.valid_from:
            return False, "Coupon is not yet valid"
        
        if self.valid_until and now > self.valid_until:
            return False, "Coupon has expired"
        
        if self.usage_limit and self.current_usage >= self.usage_limit:
            return False, "Coupon usage limit reached"
        
        if self.minimum_purchase and cart_total < Decimal(str(self.minimum_purchase)):
            return False, f"Minimum purchase of {self.minimum_purchase} required"
        
        return True, "Valid"
    
    def calculate_discount(self, subtotal: Decimal) -> Decimal:
        """Calculate discount amount"""
        if self.discount_type == DiscountType.PERCENTAGE:
            discount = subtotal * (Decimal(str(self.discount_value)) / 100)
            if self.maximum_discount:
                discount = min(discount, Decimal(str(self.maximum_discount)))
            return discount
        elif self.discount_type == DiscountType.FIXED_AMOUNT:
            return min(Decimal(str(self.discount_value)), subtotal)
        elif self.discount_type == DiscountType.FREE_SHIPPING:
            return Decimal('0')  # Handled separately
        return Decimal('0')


class CouponUsage(Base):
    """Coupon usage tracking"""
    __tablename__ = "coupon_usage"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    coupon_id: Mapped[int] = Column(Integer, ForeignKey("coupons.id"), nullable=False, index=True)
    order_id: Mapped[int] = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    user_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("users.id"), index=True)
    
    discount_amount: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    coupon: Mapped["Coupon"] = relationship("Coupon", back_populates="usage_records")
    order: Mapped["Order"] = relationship("Order")
    user: Mapped[Optional["User"]] = relationship("User")


class ShippingRate(Base):
    """Shipping rates configuration"""
    __tablename__ = "shipping_rates"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    name: Mapped[str] = Column(String(100), nullable=False)
    description: Mapped[Optional[str]] = Column(String(500))
    
    # Pricing
    base_rate: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    rate_per_kg: Mapped[Optional[float]] = Column(Numeric(10, 2))
    
    # Free shipping threshold
    free_shipping_threshold: Mapped[Optional[float]] = Column(Numeric(10, 2))
    
    # Geographic constraints
    countries: Mapped[Optional[str]] = Column(JSON)  # List of country codes
    
    # Delivery estimate
    min_delivery_days: Mapped[Optional[int]] = Column(Integer)
    max_delivery_days: Mapped[Optional[int]] = Column(Integer)
    
    # Status
    is_active: Mapped[bool] = Column(Boolean, default=True)
    
    # Display order
    position: Mapped[int] = Column(Integer, default=0)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    store: Mapped["Store"] = relationship("Store")
    
    def calculate_shipping(self, subtotal: Decimal, weight: Decimal, country: str) -> Decimal:
        """Calculate shipping cost"""
        if self.free_shipping_threshold and subtotal >= Decimal(str(self.free_shipping_threshold)):
            return Decimal('0')
        
        cost = Decimal(str(self.base_rate))
        
        if self.rate_per_kg and weight > 0:
            cost += Decimal(str(self.rate_per_kg)) * weight
        
        return cost
