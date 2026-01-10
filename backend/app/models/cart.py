"""
Shopping cart models
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, JSON
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from decimal import Decimal

from app.database import Base


class Cart(Base):
    """Shopping cart"""
    __tablename__ = "carts"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("users.id"), index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # For guest carts
    session_id: Mapped[Optional[str]] = Column(String(255), unique=True, index=True)
    
    # Coupon
    coupon_code: Mapped[Optional[str]] = Column(String(50))
    
    # Timestamps
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    expires_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Relationships
    items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    user: Mapped[Optional["User"]] = relationship("User")
    store: Mapped["Store"] = relationship("Store")
    
    @property
    def subtotal(self) -> Decimal:
        """Calculate cart subtotal"""
        return sum(item.total_price for item in self.items)
    
    @property
    def total_items(self) -> int:
        """Total number of items"""
        return sum(item.quantity for item in self.items)


class CartItem(Base):
    """Cart item"""
    __tablename__ = "cart_items"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    cart_id: Mapped[int] = Column(Integer, ForeignKey("carts.id"), nullable=False, index=True)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    variant_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("product_variants.id"), index=True)
    
    quantity: Mapped[int] = Column(Integer, nullable=False, default=1)
    price: Mapped[float] = Column(Numeric(10, 2), nullable=False)  # Price at time of adding
    
    # Custom options (e.g., engraving, gift wrap)
    custom_options: Mapped[Optional[str]] = Column(JSON)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product: Mapped["Product"] = relationship("Product")
    variant: Mapped[Optional["ProductVariant"]] = relationship("ProductVariant")
    
    @property
    def total_price(self) -> Decimal:
        """Calculate item total"""
        return Decimal(str(self.price)) * self.quantity
