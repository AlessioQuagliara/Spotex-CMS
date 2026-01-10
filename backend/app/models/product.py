"""
E-commerce product models
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric, JSON, Index
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TSVECTOR

from app.database import Base


class Product(Base):
    """Product model for e-commerce"""
    __tablename__ = "products"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # Basic info
    name: Mapped[str] = Column(String(255), nullable=False)
    slug: Mapped[str] = Column(String(255), unique=True, index=True, nullable=False)
    sku: Mapped[str] = Column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = Column(Text)
    short_description: Mapped[Optional[str]] = Column(String(500))
    
    # Pricing
    price: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    compare_at_price: Mapped[Optional[float]] = Column(Numeric(10, 2))  # Original price for discounts
    cost_price: Mapped[Optional[float]] = Column(Numeric(10, 2))  # Cost for profit calculations
    
    # Inventory
    track_inventory: Mapped[bool] = Column(Boolean, default=True)
    inventory_quantity: Mapped[int] = Column(Integer, default=0)
    low_stock_threshold: Mapped[int] = Column(Integer, default=10)
    allow_backorder: Mapped[bool] = Column(Boolean, default=False)
    
    # Status
    is_active: Mapped[bool] = Column(Boolean, default=True)
    is_featured: Mapped[bool] = Column(Boolean, default=False)
    is_digital: Mapped[bool] = Column(Boolean, default=False)
    
    # SEO
    meta_title: Mapped[Optional[str]] = Column(String(255))
    meta_description: Mapped[Optional[str]] = Column(String(500))
    meta_keywords: Mapped[Optional[str]] = Column(String(500))
    
    # Shipping
    weight: Mapped[Optional[float]] = Column(Numeric(10, 2))  # in kg
    length: Mapped[Optional[float]] = Column(Numeric(10, 2))  # in cm
    width: Mapped[Optional[float]] = Column(Numeric(10, 2))
    height: Mapped[Optional[float]] = Column(Numeric(10, 2))
    requires_shipping: Mapped[bool] = Column(Boolean, default=True)
    
    # Additional data
    attributes: Mapped[Optional[str]] = Column(JSON)  # Custom attributes
    
    # Full-text search
    search_vector: Mapped[Optional[str]] = Column(TSVECTOR)
    
    # Timestamps
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    published_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="products")
    variants: Mapped[List["ProductVariant"]] = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images: Mapped[List["ProductImage"]] = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    categories: Mapped[List["ProductCategory"]] = relationship("ProductCategory", back_populates="product", cascade="all, delete-orphan")
    tags: Mapped[List["ProductTag"]] = relationship("ProductTag", back_populates="product", cascade="all, delete-orphan")
    reviews: Mapped[List["ProductReview"]] = relationship("ProductReview", back_populates="product", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_products_store_active', 'store_id', 'is_active'),
        Index('ix_products_search_vector', 'search_vector', postgresql_using='gin'),
    )
    
    @property
    def is_in_stock(self) -> bool:
        """Check if product is in stock"""
        if not self.track_inventory:
            return True
        return self.inventory_quantity > 0 or self.allow_backorder
    
    @property
    def is_low_stock(self) -> bool:
        """Check if product is low on stock"""
        if not self.track_inventory:
            return False
        return 0 < self.inventory_quantity <= self.low_stock_threshold
    
    @property
    def discount_percentage(self) -> float:
        """Calculate discount percentage"""
        if self.compare_at_price and self.compare_at_price > self.price:
            return round(((self.compare_at_price - self.price) / self.compare_at_price) * 100, 2)
        return 0.0


class ProductVariant(Base):
    """Product variant (size, color, etc.)"""
    __tablename__ = "product_variants"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    
    # Variant info
    name: Mapped[str] = Column(String(255), nullable=False)
    sku: Mapped[str] = Column(String(100), unique=True, index=True, nullable=False)
    
    # Options (e.g., {"color": "Red", "size": "L"})
    options: Mapped[str] = Column(JSON, nullable=False)
    
    # Pricing (can override product price)
    price: Mapped[Optional[float]] = Column(Numeric(10, 2))
    compare_at_price: Mapped[Optional[float]] = Column(Numeric(10, 2))
    
    # Inventory
    inventory_quantity: Mapped[int] = Column(Integer, default=0)
    
    # Images
    image_url: Mapped[Optional[str]] = Column(String(500))
    
    # Status
    is_active: Mapped[bool] = Column(Boolean, default=True)
    
    # Position for sorting
    position: Mapped[int] = Column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="variants")


class ProductImage(Base):
    """Product images"""
    __tablename__ = "product_images"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    
    url: Mapped[str] = Column(String(500), nullable=False)
    alt_text: Mapped[Optional[str]] = Column(String(255))
    position: Mapped[int] = Column(Integer, default=0)
    is_primary: Mapped[bool] = Column(Boolean, default=False)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="images")


class ProductCategory(Base):
    """Product-Category association"""
    __tablename__ = "product_categories"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    category_id: Mapped[int] = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    is_primary: Mapped[bool] = Column(Boolean, default=False)
    
    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="categories")
    category: Mapped["Category"] = relationship("Category")


class ProductTag(Base):
    """Product tags"""
    __tablename__ = "product_tags"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    tag: Mapped[str] = Column(String(100), nullable=False, index=True)
    
    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="tags")


class ProductReview(Base):
    """Product reviews"""
    __tablename__ = "product_reviews"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    rating: Mapped[int] = Column(Integer, nullable=False)  # 1-5
    title: Mapped[Optional[str]] = Column(String(255))
    comment: Mapped[Optional[str]] = Column(Text)
    
    is_verified_purchase: Mapped[bool] = Column(Boolean, default=False)
    is_approved: Mapped[bool] = Column(Boolean, default=False)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="reviews")
    user: Mapped["User"] = relationship("User")


class InventoryTransaction(Base):
    """Inventory movement tracking"""
    __tablename__ = "inventory_transactions"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    product_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("products.id"), index=True)
    variant_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("product_variants.id"), index=True)
    
    quantity_change: Mapped[int] = Column(Integer, nullable=False)  # Positive or negative
    reason: Mapped[str] = Column(String(50), nullable=False)  # 'purchase', 'sale', 'return', 'adjustment', 'damage'
    reference_id: Mapped[Optional[int]] = Column(Integer)  # Order ID, etc.
    note: Mapped[Optional[str]] = Column(Text)
    
    created_by: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product: Mapped[Optional["Product"]] = relationship("Product")
    variant: Mapped[Optional["ProductVariant"]] = relationship("ProductVariant")
    user: Mapped["User"] = relationship("User")
