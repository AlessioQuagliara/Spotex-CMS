"""
Order models
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric, JSON, Enum
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from decimal import Decimal
import enum

from app.database import Base


class OrderStatus(str, enum.Enum):
    """Order status enum"""
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, enum.Enum):
    """Payment status enum"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    """Payment method enum"""
    STRIPE = "stripe"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    CASH_ON_DELIVERY = "cash_on_delivery"


class Order(Base):
    """Order model"""
    __tablename__ = "orders"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    order_number: Mapped[str] = Column(String(50), unique=True, index=True, nullable=False)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    user_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("users.id"), index=True)
    
    # Status
    status: Mapped[str] = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    payment_status: Mapped[str] = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Customer info (for guests)
    customer_email: Mapped[str] = Column(String(255), nullable=False)
    customer_name: Mapped[str] = Column(String(255), nullable=False)
    customer_phone: Mapped[Optional[str]] = Column(String(50))
    
    # Shipping address
    shipping_address_line1: Mapped[str] = Column(String(255), nullable=False)
    shipping_address_line2: Mapped[Optional[str]] = Column(String(255))
    shipping_city: Mapped[str] = Column(String(100), nullable=False)
    shipping_state: Mapped[Optional[str]] = Column(String(100))
    shipping_country: Mapped[str] = Column(String(100), nullable=False)
    shipping_postal_code: Mapped[str] = Column(String(20), nullable=False)
    
    # Billing address (can be same as shipping)
    billing_address_line1: Mapped[str] = Column(String(255), nullable=False)
    billing_address_line2: Mapped[Optional[str]] = Column(String(255))
    billing_city: Mapped[str] = Column(String(100), nullable=False)
    billing_state: Mapped[Optional[str]] = Column(String(100))
    billing_country: Mapped[str] = Column(String(100), nullable=False)
    billing_postal_code: Mapped[str] = Column(String(20), nullable=False)
    
    # Pricing
    subtotal: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    shipping_cost: Mapped[float] = Column(Numeric(10, 2), default=0)
    tax_amount: Mapped[float] = Column(Numeric(10, 2), default=0)
    discount_amount: Mapped[float] = Column(Numeric(10, 2), default=0)
    total_amount: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    # Coupon
    coupon_code: Mapped[Optional[str]] = Column(String(50))
    
    # Shipping
    shipping_method: Mapped[Optional[str]] = Column(String(100))
    tracking_number: Mapped[Optional[str]] = Column(String(100))
    carrier: Mapped[Optional[str]] = Column(String(100))
    
    # Notes
    customer_notes: Mapped[Optional[str]] = Column(Text)
    admin_notes: Mapped[Optional[str]] = Column(Text)
    
    # Metadata
    meta_data: Mapped[Optional[str]] = Column(JSON)
    
    # Timestamps
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    paid_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    shipped_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    delivered_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    cancelled_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Relationships
    store: Mapped["Store"] = relationship("Store")
    user: Mapped[Optional["User"]] = relationship("User")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    status_history: Mapped[List["OrderStatusHistory"]] = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """Order item"""
    __tablename__ = "order_items"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    variant_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("product_variants.id"), index=True)
    
    # Product snapshot at order time
    product_name: Mapped[str] = Column(String(255), nullable=False)
    product_sku: Mapped[str] = Column(String(100), nullable=False)
    variant_name: Mapped[Optional[str]] = Column(String(255))
    
    quantity: Mapped[int] = Column(Integer, nullable=False)
    unit_price: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    total_price: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    # Custom options
    custom_options: Mapped[Optional[str]] = Column(JSON)
    
    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product")
    variant: Mapped[Optional["ProductVariant"]] = relationship("ProductVariant")


class OrderStatusHistory(Base):
    """Order status change history"""
    __tablename__ = "order_status_history"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    
    old_status: Mapped[Optional[str]] = Column(Enum(OrderStatus))
    new_status: Mapped[str] = Column(Enum(OrderStatus), nullable=False)
    
    note: Mapped[Optional[str]] = Column(Text)
    changed_by: Mapped[Optional[int]] = Column(Integer, ForeignKey("users.id"))
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="status_history")
    user: Mapped[Optional["User"]] = relationship("User")


class Payment(Base):
    """Payment transaction"""
    __tablename__ = "payments"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    
    # Payment info
    payment_method: Mapped[str] = Column(Enum(PaymentMethod), nullable=False)
    payment_status: Mapped[str] = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    amount: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = Column(String(3), default="EUR", nullable=False)
    
    # External payment gateway IDs
    stripe_payment_intent_id: Mapped[Optional[str]] = Column(String(255), unique=True, index=True)
    stripe_charge_id: Mapped[Optional[str]] = Column(String(255))
    paypal_order_id: Mapped[Optional[str]] = Column(String(255), unique=True, index=True)
    paypal_capture_id: Mapped[Optional[str]] = Column(String(255))
    
    # Transaction details
    transaction_id: Mapped[Optional[str]] = Column(String(255))
    transaction_data: Mapped[Optional[str]] = Column(JSON)
    
    # Refund info
    refund_amount: Mapped[Optional[float]] = Column(Numeric(10, 2))
    refund_reason: Mapped[Optional[str]] = Column(Text)
    refunded_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Error handling
    error_message: Mapped[Optional[str]] = Column(Text)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="payments")
