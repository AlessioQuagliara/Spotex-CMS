"""
Analytics and tracking models
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, JSON, Boolean, Index
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from decimal import Decimal

from app.database import Base


class AbandonedCart(Base):
    """Abandoned cart tracking"""
    __tablename__ = "abandoned_carts"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    cart_id: Mapped[int] = Column(Integer, ForeignKey("carts.id"), nullable=False, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    user_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("users.id"), index=True)
    
    # Contact info
    email: Mapped[Optional[str]] = Column(String(255), index=True)
    
    # Cart details
    items_count: Mapped[int] = Column(Integer, nullable=False)
    cart_value: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    # Recovery tracking
    recovery_email_sent: Mapped[bool] = Column(Boolean, default=False)
    recovery_email_sent_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    recovery_email_opened: Mapped[bool] = Column(Boolean, default=False)
    recovery_email_clicked: Mapped[bool] = Column(Boolean, default=False)
    
    # Conversion
    converted: Mapped[bool] = Column(Boolean, default=False)
    converted_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    order_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("orders.id"))
    
    # Timestamps
    abandoned_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    cart: Mapped["Cart"] = relationship("Cart")
    user: Mapped[Optional["User"]] = relationship("User")
    order: Mapped[Optional["Order"]] = relationship("Order")
    
    __table_args__ = (
        Index('ix_abandoned_carts_email_converted', 'email', 'converted'),
        Index('ix_abandoned_carts_store_abandoned', 'store_id', 'abandoned_at'),
    )


class CustomerActivity(Base):
    """Customer activity tracking"""
    __tablename__ = "customer_activities"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("users.id"), index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # Session
    session_id: Mapped[str] = Column(String(255), index=True, nullable=False)
    
    # Activity
    activity_type: Mapped[str] = Column(String(50), nullable=False, index=True)  # view, add_to_cart, purchase, etc.
    
    # Context
    product_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("products.id"), index=True)
    category_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("categories.id"))
    page_url: Mapped[Optional[str]] = Column(String(500))
    referrer: Mapped[Optional[str]] = Column(String(500))
    
    # Metadata
    metadata: Mapped[Optional[str]] = Column(JSON)
    
    # Device/browser info
    user_agent: Mapped[Optional[str]] = Column(Text)
    ip_address: Mapped[Optional[str]] = Column(String(45))
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User")
    product: Mapped[Optional["Product"]] = relationship("Product")
    
    __table_args__ = (
        Index('ix_customer_activities_session_created', 'session_id', 'created_at'),
        Index('ix_customer_activities_type_created', 'activity_type', 'created_at'),
    )


class SalesMetric(Base):
    """Daily sales metrics aggregation"""
    __tablename__ = "sales_metrics"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    metric_date: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Sales
    total_sales: Mapped[float] = Column(Numeric(12, 2), default=0)
    total_orders: Mapped[int] = Column(Integer, default=0)
    average_order_value: Mapped[float] = Column(Numeric(10, 2), default=0)
    
    # Products
    products_sold: Mapped[int] = Column(Integer, default=0)
    
    # Customers
    new_customers: Mapped[int] = Column(Integer, default=0)
    returning_customers: Mapped[int] = Column(Integer, default=0)
    
    # Refunds
    total_refunds: Mapped[float] = Column(Numeric(10, 2), default=0)
    refund_count: Mapped[int] = Column(Integer, default=0)
    
    # Cart
    abandoned_carts: Mapped[int] = Column(Integer, default=0)
    recovered_carts: Mapped[int] = Column(Integer, default=0)
    cart_recovery_revenue: Mapped[float] = Column(Numeric(10, 2), default=0)
    
    # Traffic
    total_visitors: Mapped[int] = Column(Integer, default=0)
    conversion_rate: Mapped[float] = Column(Numeric(5, 2), default=0)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_sales_metrics_store_date', 'store_id', 'metric_date', unique=True),
    )


class ProductPerformance(Base):
    """Product performance metrics"""
    __tablename__ = "product_performance"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # Period
    period_start: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)
    
    # Views and engagement
    view_count: Mapped[int] = Column(Integer, default=0)
    add_to_cart_count: Mapped[int] = Column(Integer, default=0)
    purchase_count: Mapped[int] = Column(Integer, default=0)
    
    # Sales
    units_sold: Mapped[int] = Column(Integer, default=0)
    revenue: Mapped[float] = Column(Numeric(12, 2), default=0)
    
    # Conversion
    view_to_cart_rate: Mapped[float] = Column(Numeric(5, 2), default=0)
    cart_to_purchase_rate: Mapped[float] = Column(Numeric(5, 2), default=0)
    
    # Returns
    return_count: Mapped[int] = Column(Integer, default=0)
    return_rate: Mapped[float] = Column(Numeric(5, 2), default=0)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    product: Mapped["Product"] = relationship("Product")
    
    __table_args__ = (
        Index('ix_product_performance_product_period', 'product_id', 'period_start'),
    )


class CustomerSegment(Base):
    """Customer segmentation"""
    __tablename__ = "customer_segments"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # RFM Analysis (Recency, Frequency, Monetary)
    recency_score: Mapped[int] = Column(Integer, default=0)  # 1-5
    frequency_score: Mapped[int] = Column(Integer, default=0)  # 1-5
    monetary_score: Mapped[int] = Column(Integer, default=0)  # 1-5
    rfm_segment: Mapped[str] = Column(String(50), index=True)  # Champions, Loyal, At Risk, etc.
    
    # Lifetime metrics
    total_orders: Mapped[int] = Column(Integer, default=0)
    total_revenue: Mapped[float] = Column(Numeric(12, 2), default=0)
    average_order_value: Mapped[float] = Column(Numeric(10, 2), default=0)
    
    # Dates
    first_order_date: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    last_order_date: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Behavior
    preferred_categories: Mapped[Optional[str]] = Column(JSON)
    favorite_products: Mapped[Optional[str]] = Column(JSON)
    
    # Predicted churn
    churn_risk: Mapped[float] = Column(Numeric(3, 2), default=0)  # 0-1
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    
    __table_args__ = (
        Index('ix_customer_segments_rfm', 'rfm_segment'),
        Index('ix_customer_segments_churn', 'churn_risk'),
    )
