"""
Return and refund models
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Enum, JSON
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from decimal import Decimal
import enum

from app.database import Base


class ReturnStatus(str, enum.Enum):
    """Return status enum"""
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    RECEIVED = "received"
    REFUNDED = "refunded"
    COMPLETED = "completed"


class ReturnReason(str, enum.Enum):
    """Return reason enum"""
    DEFECTIVE = "defective"
    WRONG_ITEM = "wrong_item"
    NOT_AS_DESCRIBED = "not_as_described"
    CHANGED_MIND = "changed_mind"
    LATE_DELIVERY = "late_delivery"
    OTHER = "other"


class OrderReturn(Base):
    """Order return/refund request"""
    __tablename__ = "order_returns"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    return_number: Mapped[str] = Column(String(50), unique=True, index=True, nullable=False)
    order_id: Mapped[int] = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    
    # Status
    status: Mapped[str] = Column(Enum(ReturnStatus), default=ReturnStatus.REQUESTED, nullable=False, index=True)
    
    # Reason
    reason: Mapped[str] = Column(Enum(ReturnReason), nullable=False)
    reason_detail: Mapped[Optional[str]] = Column(Text)
    
    # Items to return (JSON array of {order_item_id, quantity})
    items: Mapped[str] = Column(JSON, nullable=False)
    
    # Refund amount
    refund_amount: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    # Shipping
    return_shipping_carrier: Mapped[Optional[str]] = Column(String(100))
    return_tracking_number: Mapped[Optional[str]] = Column(String(100))
    
    # Images/proof
    images: Mapped[Optional[str]] = Column(JSON)  # Array of image URLs
    
    # Admin notes
    admin_notes: Mapped[Optional[str]] = Column(Text)
    rejection_reason: Mapped[Optional[str]] = Column(Text)
    
    # Timestamps
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    approved_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    received_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    refunded_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Relationships
    order: Mapped["Order"] = relationship("Order")


class ReturnStatusHistory(Base):
    """Return status change history"""
    __tablename__ = "return_status_history"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    return_id: Mapped[int] = Column(Integer, ForeignKey("order_returns.id"), nullable=False, index=True)
    
    old_status: Mapped[Optional[str]] = Column(Enum(ReturnStatus))
    new_status: Mapped[str] = Column(Enum(ReturnStatus), nullable=False)
    
    note: Mapped[Optional[str]] = Column(Text)
    changed_by: Mapped[Optional[int]] = Column(Integer, ForeignKey("users.id"))
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    return_request: Mapped["OrderReturn"] = relationship("OrderReturn")
    user: Mapped[Optional["User"]] = relationship("User")
