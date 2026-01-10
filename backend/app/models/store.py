"""
Store model for multi-tenant support
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func

from app.database import Base


class Store(Base):
    """Store model for multi-tenant architecture"""
    __tablename__ = "stores"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    
    # Store info
    name: Mapped[str] = Column(String(255), nullable=False)
    slug: Mapped[str] = Column(String(255), unique=True, index=True, nullable=False)
    domain: Mapped[Optional[str]] = Column(String(255), unique=True, index=True)
    
    # Contact
    email: Mapped[Optional[str]] = Column(String(255))
    phone: Mapped[Optional[str]] = Column(String(50))
    
    # Address
    address: Mapped[Optional[str]] = Column(Text)
    city: Mapped[Optional[str]] = Column(String(100))
    state: Mapped[Optional[str]] = Column(String(100))
    country: Mapped[Optional[str]] = Column(String(100))
    postal_code: Mapped[Optional[str]] = Column(String(20))
    
    # Settings
    settings: Mapped[Optional[str]] = Column(JSON)  # Store-specific settings
    
    # Status
    is_active: Mapped[bool] = Column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    products: Mapped[List["Product"]] = relationship("Product", back_populates="store")
    users: Mapped[List["User"]] = relationship("User", back_populates="store")
