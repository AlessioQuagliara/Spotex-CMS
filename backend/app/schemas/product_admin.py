"""
Product management schemas for admin dashboard
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from decimal import Decimal


class BulkPriceUpdateRequest(BaseModel):
    """Bulk price update"""
    product_ids: List[int] = Field(..., min_items=1)
    price_adjustment_type: str = Field(..., pattern="^(percentage|fixed|set)$")
    adjustment_value: Decimal
    apply_to_compare_price: bool = False

    @validator('adjustment_value')
    def validate_adjustment(cls, v, values):
        if 'price_adjustment_type' in values:
            if values['price_adjustment_type'] == 'percentage' and (v < -100 or v > 100):
                raise ValueError('Percentage must be between -100 and 100')
            if values['price_adjustment_type'] == 'set' and v <= 0:
                raise ValueError('Set price must be positive')
        return v

    class Config:
        from_attributes = True


class BulkCategoryUpdateRequest(BaseModel):
    """Bulk category update"""
    product_ids: List[int] = Field(..., min_items=1)
    category_id: int

    class Config:
        from_attributes = True


class BulkTagUpdateRequest(BaseModel):
    """Bulk tag update"""
    product_ids: List[int] = Field(..., min_items=1)
    tags: List[str]
    action: str = Field(..., pattern="^(add|remove|replace)$")

    class Config:
        from_attributes = True


class BulkStatusUpdateRequest(BaseModel):
    """Bulk status update"""
    product_ids: List[int] = Field(..., min_items=1)
    is_active: bool
    is_featured: Optional[bool] = None

    class Config:
        from_attributes = True


class BulkInventoryUpdateRequest(BaseModel):
    """Bulk inventory adjustment"""
    adjustments: List[Dict[str, Any]] = Field(..., min_items=1)
    # Each item: {product_id: int, quantity: int, reason: str}

    class Config:
        from_attributes = True


class BulkDeleteRequest(BaseModel):
    """Bulk delete products"""
    product_ids: List[int] = Field(..., min_items=1)
    permanent: bool = False  # Soft delete by default

    class Config:
        from_attributes = True


class ProductImportRow(BaseModel):
    """Single product import row"""
    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Decimal
    compare_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    stock_quantity: int = 0
    track_inventory: bool = True
    low_stock_threshold: int = 10
    tags: Optional[str] = None  # Comma separated
    is_active: bool = True
    is_featured: bool = False
    weight: Optional[Decimal] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

    class Config:
        from_attributes = True


class ProductImportRequest(BaseModel):
    """Product import request"""
    products: List[ProductImportRow]
    update_existing: bool = True  # Update if SKU exists
    create_categories: bool = True  # Auto-create missing categories

    class Config:
        from_attributes = True


class ProductImportResult(BaseModel):
    """Product import result"""
    total_rows: int
    imported: int
    updated: int
    failed: int
    errors: List[Dict[str, Any]]  # [{row: int, sku: str, error: str}]

    class Config:
        from_attributes = True


class ProductExportRequest(BaseModel):
    """Product export request"""
    product_ids: Optional[List[int]] = None  # None = all products
    category_id: Optional[int] = None
    is_active: Optional[bool] = None
    include_variants: bool = True
    include_inventory: bool = True

    class Config:
        from_attributes = True


class ImageUploadResponse(BaseModel):
    """Image upload response"""
    url: str
    filename: str
    size: int
    mime_type: str

    class Config:
        from_attributes = True


class BulkImageUpdateRequest(BaseModel):
    """Bulk image operations"""
    product_id: int
    images: List[Dict[str, Any]]  # [{url, alt_text, position}]
    action: str = Field(..., pattern="^(add|remove|replace|reorder)$")

    class Config:
        from_attributes = True


class ProductDuplicateRequest(BaseModel):
    """Duplicate product"""
    product_id: int
    new_name: Optional[str] = None
    new_sku: Optional[str] = None
    copy_images: bool = True
    copy_variants: bool = True

    class Config:
        from_attributes = True


class BulkOperationResponse(BaseModel):
    """Bulk operation response"""
    success: int
    failed: int
    total: int
    errors: List[Dict[str, Any]]

    class Config:
        from_attributes = True


class AdvancedProductFilter(BaseModel):
    """Advanced product filtering"""
    category_ids: Optional[List[int]] = None
    tags: Optional[List[str]] = None
    price_min: Optional[Decimal] = None
    price_max: Optional[Decimal] = None
    stock_status: Optional[str] = Field(None, pattern="^(in_stock|low_stock|out_of_stock)$")
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    search: Optional[str] = None
    sort_by: str = Field(default="created_at", pattern="^(name|price|stock|created_at|updated_at)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")

    class Config:
        from_attributes = True


class ProductQuickEdit(BaseModel):
    """Quick edit product fields"""
    product_id: int
    field: str
    value: Any

    class Config:
        from_attributes = True


class ProductVariantBulkUpdate(BaseModel):
    """Bulk update variants"""
    product_id: int
    variants: List[Dict[str, Any]]  # [{variant_id, price, stock, sku}]

    class Config:
        from_attributes = True
