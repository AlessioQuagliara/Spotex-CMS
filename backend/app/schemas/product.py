"""
Product schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator, HttpUrl
from decimal import Decimal

# Base schemas
class ProductVariantBase(BaseModel):
    """Base product variant schema"""
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    options: Dict[str, str] = Field(default_factory=dict)
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    inventory_quantity: int = Field(default=0, ge=0)
    image_url: Optional[HttpUrl] = None
    is_active: bool = True
    position: int = 0

    class Config:
        from_attributes = True

class ProductVariantCreate(ProductVariantBase):
    """Create product variant"""
    pass

class ProductVariantUpdate(BaseModel):
    """Update product variant"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    options: Optional[Dict[str, str]] = None
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    inventory_quantity: Optional[int] = Field(None, ge=0)
    image_url: Optional[HttpUrl] = None
    is_active: Optional[bool] = None
    position: Optional[int] = None

    class Config:
        from_attributes = True

class ProductVariantResponse(ProductVariantBase):
    """Product variant response"""
    id: int
    product_id: int
    created_at: datetime
    updated_at: datetime

class ProductImageBase(BaseModel):
    """Base product image schema"""
    url: HttpUrl
    alt_text: Optional[str] = Field(None, max_length=255)
    position: int = 0
    is_primary: bool = False

    class Config:
        from_attributes = True

class ProductImageCreate(ProductImageBase):
    """Create product image"""
    pass

class ProductImageResponse(ProductImageBase):
    """Product image response"""
    id: int
    product_id: int
    created_at: datetime

class ProductTagResponse(BaseModel):
    """Product tag response"""
    id: int
    tag: str

    class Config:
        from_attributes = True

class ProductCategoryResponse(BaseModel):
    """Product category response"""
    id: int
    category_id: int
    is_primary: bool
    category_name: Optional[str] = None
    category_slug: Optional[str] = None

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    """Base product schema"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    
    # Pricing
    price: Decimal = Field(..., ge=0)
    compare_at_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    
    # Inventory
    track_inventory: bool = True
    inventory_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)
    allow_backorder: bool = False
    
    # Status
    is_active: bool = True
    is_featured: bool = False
    is_digital: bool = False
    
    # SEO
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)
    meta_keywords: Optional[str] = Field(None, max_length=500)
    
    # Shipping
    weight: Optional[Decimal] = Field(None, ge=0)
    length: Optional[Decimal] = Field(None, ge=0)
    width: Optional[Decimal] = Field(None, ge=0)
    height: Optional[Decimal] = Field(None, ge=0)
    requires_shipping: bool = True
    
    # Additional
    attributes: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

    @validator('compare_at_price')
    def compare_price_must_be_greater(cls, v, values):
        if v is not None and 'price' in values and v <= values['price']:
            raise ValueError('compare_at_price must be greater than price')
        return v

class ProductCreate(ProductBase):
    """Create product"""
    store_id: int
    category_ids: List[int] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

class ProductUpdate(BaseModel):
    """Update product"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    
    price: Optional[Decimal] = Field(None, ge=0)
    compare_at_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    
    track_inventory: Optional[bool] = None
    inventory_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    allow_backorder: Optional[bool] = None
    
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_digital: Optional[bool] = None
    
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)
    meta_keywords: Optional[str] = Field(None, max_length=500)
    
    weight: Optional[Decimal] = Field(None, ge=0)
    length: Optional[Decimal] = Field(None, ge=0)
    width: Optional[Decimal] = Field(None, ge=0)
    height: Optional[Decimal] = Field(None, ge=0)
    requires_shipping: Optional[bool] = None
    
    attributes: Optional[Dict[str, Any]] = None
    category_ids: Optional[List[int]] = None
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True

class ProductResponse(ProductBase):
    """Product response"""
    id: int
    store_id: int
    
    is_in_stock: bool
    is_low_stock: bool
    discount_percentage: float
    
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    
    # Relationships
    variants: List[ProductVariantResponse] = Field(default_factory=list)
    images: List[ProductImageResponse] = Field(default_factory=list)
    categories: List[ProductCategoryResponse] = Field(default_factory=list)
    tags: List[ProductTagResponse] = Field(default_factory=list)
    
    # Stats
    average_rating: Optional[float] = None
    review_count: int = 0

class ProductListResponse(BaseModel):
    """Product list item (minimal)"""
    id: int
    store_id: int
    name: str
    slug: str
    sku: str
    short_description: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    discount_percentage: float
    is_active: bool
    is_featured: bool
    is_in_stock: bool
    is_low_stock: bool
    primary_image: Optional[str] = None
    average_rating: Optional[float] = None
    review_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class PaginatedProductResponse(BaseModel):
    """Paginated product response"""
    items: List[ProductListResponse]
    total: int
    page: int
    per_page: int
    pages: int

class ProductSearchFilters(BaseModel):
    """Product search filters"""
    query: Optional[str] = None
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    is_featured: Optional[bool] = None
    is_in_stock: Optional[bool] = None
    sort_by: str = Field(default="created_at", pattern="^(created_at|price|name|popularity)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")

class InventoryAdjustment(BaseModel):
    """Inventory adjustment"""
    quantity_change: int
    reason: str = Field(..., pattern="^(purchase|sale|return|adjustment|damage)$")
    note: Optional[str] = None

    class Config:
        from_attributes = True

class ProductReviewBase(BaseModel):
    """Base product review schema"""
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = None

    class Config:
        from_attributes = True

class ProductReviewCreate(ProductReviewBase):
    """Create product review"""
    pass

class ProductReviewResponse(ProductReviewBase):
    """Product review response"""
    id: int
    product_id: int
    user_id: int
    is_verified_purchase: bool
    is_approved: bool
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None

class BulkPriceUpdate(BaseModel):
    """Bulk price update"""
    product_ids: List[int]
    price_adjustment: Decimal
    adjustment_type: str = Field(..., pattern="^(percent|amount)$")
