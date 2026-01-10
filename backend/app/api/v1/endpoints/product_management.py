"""
Product management endpoints for admin
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc
import io
import os
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.product import Product
from app.schemas.product_admin import *
from app.utils.product_management_service import (
    ProductBulkService,
    ProductImportExportService,
    ProductImageService
)

router = APIRouter()


# Bulk Operations
@router.post("/bulk/price-update", response_model=BulkOperationResponse)
async def bulk_update_prices(
    store_id: int,
    request: BulkPriceUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk update product prices"""
    result = await ProductBulkService.bulk_update_prices(
        db=db,
        store_id=store_id,
        product_ids=request.product_ids,
        adjustment_type=request.price_adjustment_type,
        adjustment_value=request.adjustment_value,
        apply_to_compare_price=request.apply_to_compare_price
    )
    
    return BulkOperationResponse(**result)


@router.post("/bulk/category-update", response_model=BulkOperationResponse)
async def bulk_update_category(
    store_id: int,
    request: BulkCategoryUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk update product category"""
    result = await ProductBulkService.bulk_update_category(
        db=db,
        store_id=store_id,
        product_ids=request.product_ids,
        category_id=request.category_id
    )
    
    return BulkOperationResponse(**result)


@router.post("/bulk/tag-update", response_model=BulkOperationResponse)
async def bulk_update_tags(
    store_id: int,
    request: BulkTagUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk update product tags"""
    result = await ProductBulkService.bulk_update_tags(
        db=db,
        store_id=store_id,
        product_ids=request.product_ids,
        tags=request.tags,
        action=request.action
    )
    
    return BulkOperationResponse(**result)


@router.post("/bulk/status-update", response_model=BulkOperationResponse)
async def bulk_update_status(
    store_id: int,
    request: BulkStatusUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk update product status"""
    result = await ProductBulkService.bulk_update_status(
        db=db,
        store_id=store_id,
        product_ids=request.product_ids,
        is_active=request.is_active,
        is_featured=request.is_featured
    )
    
    return BulkOperationResponse(**result)


@router.post("/bulk/delete", response_model=BulkOperationResponse)
async def bulk_delete_products(
    store_id: int,
    request: BulkDeleteRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk delete products"""
    result = await ProductBulkService.bulk_delete_products(
        db=db,
        store_id=store_id,
        product_ids=request.product_ids,
        permanent=request.permanent
    )
    
    return BulkOperationResponse(**result)


# Import/Export
@router.post("/import/csv", response_model=ProductImportResult)
async def import_products_csv(
    store_id: int,
    file: UploadFile = File(...),
    update_existing: bool = Form(True),
    create_categories: bool = Form(True),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Import products from CSV file"""
    # Read CSV content
    content = await file.read()
    csv_content = content.decode('utf-8')
    
    # Parse CSV
    products = ProductImportExportService.parse_csv_file(csv_content)
    
    # Import products
    result = await ProductImportExportService.import_products(
        db=db,
        store_id=store_id,
        products=products,
        update_existing=update_existing,
        create_categories=create_categories
    )
    
    return ProductImportResult(**result)


@router.post("/import/json", response_model=ProductImportResult)
async def import_products_json(
    store_id: int,
    request: ProductImportRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Import products from JSON"""
    products = [product.model_dump() for product in request.products]
    
    result = await ProductImportExportService.import_products(
        db=db,
        store_id=store_id,
        products=products,
        update_existing=request.update_existing,
        create_categories=request.create_categories
    )
    
    return ProductImportResult(**result)


@router.get("/export/csv")
async def export_products_csv(
    store_id: int,
    product_ids: Optional[str] = Query(None),  # Comma-separated IDs
    category_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Export products to CSV file"""
    # Parse product IDs
    ids_list = None
    if product_ids:
        ids_list = [int(id) for id in product_ids.split(',')]
    
    # Generate CSV
    csv_content = await ProductImportExportService.export_products_to_csv(
        db=db,
        store_id=store_id,
        product_ids=ids_list,
        category_id=category_id,
        is_active=is_active
    )
    
    # Return as downloadable file
    filename = f"products_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/template")
async def download_import_template(
    current_user: User = Depends(get_current_admin_user)
):
    """Download CSV import template"""
    template = """sku,name,description,category,price,compare_price,cost_price,stock_quantity,track_inventory,low_stock_threshold,tags,is_active,is_featured,weight,meta_title,meta_description
PROD-001,Example Product,Product description,Electronics,29.99,39.99,15.00,100,true,10,"electronics,gadgets",true,false,0.5,Example Meta Title,Example meta description
PROD-002,Another Product,Another description,Clothing,49.99,59.99,25.00,50,true,5,"fashion,clothing",true,true,0.3,Another Meta Title,Another meta description"""
    
    return StreamingResponse(
        io.StringIO(template),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=product_import_template.csv"}
    )


# Image Management
@router.post("/images/upload", response_model=ImageUploadResponse)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user)
):
    """Upload product image"""
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
        )
    
    # Read file
    content = await file.read()
    
    # TODO: Upload to cloud storage (S3, CloudFlare, etc.)
    # For now, save locally
    upload_dir = "uploads/products"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{timestamp}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)
    
    with open(filepath, 'wb') as f:
        f.write(content)
    
    # Return URL (in production, this would be CDN URL)
    url = f"/uploads/products/{filename}"
    
    return ImageUploadResponse(
        url=url,
        filename=filename,
        size=len(content),
        mime_type=file.content_type
    )


@router.post("/{product_id}/images", response_model=dict)
async def update_product_images(
    product_id: int,
    request: BulkImageUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update product images (add/remove/replace/reorder)"""
    result = await ProductImageService.update_product_images(
        db=db,
        product_id=product_id,
        images=request.images,
        action=request.action
    )
    
    if 'error' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result['error']
        )
    
    return result


# Advanced Operations
@router.post("/{product_id}/duplicate")
async def duplicate_product(
    product_id: int,
    request: ProductDuplicateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Duplicate a product"""
    # Get original product
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    original = result.scalar_one_or_none()
    
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Create duplicate
    new_product = Product(
        store_id=original.store_id,
        sku=request.new_sku or f"{original.sku}-COPY",
        name=request.new_name or f"{original.name} (Copy)",
        description=original.description,
        category_id=original.category_id,
        price=original.price,
        compare_price=original.compare_price,
        cost_price=original.cost_price,
        stock_quantity=0,  # Don't copy inventory
        track_inventory=original.track_inventory,
        low_stock_threshold=original.low_stock_threshold,
        tags=original.tags.copy() if original.tags else None,
        is_active=False,  # Start as inactive
        is_featured=False,
        weight=original.weight,
        length=original.length,
        width=original.width,
        height=original.height,
        meta_title=original.meta_title,
        meta_description=original.meta_description,
        meta_keywords=original.meta_keywords
    )
    
    if request.copy_images and original.images:
        new_product.images = original.images.copy()
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return {
        "message": "Product duplicated successfully",
        "new_product_id": new_product.id,
        "original_product_id": product_id
    }


@router.get("/advanced-filter")
async def advanced_product_filter(
    store_id: int,
    category_ids: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    price_min: Optional[float] = Query(None),
    price_max: Optional[float] = Query(None),
    stock_status: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_featured: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query('created_at'),
    sort_order: str = Query('desc'),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Advanced product filtering for admin"""
    filters = [Product.store_id == store_id]
    
    # Category filter
    if category_ids:
        cat_ids = [int(id) for id in category_ids.split(',')]
        filters.append(Product.category_id.in_(cat_ids))
    
    # Tags filter
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',')]
        # Check if any tag matches
        for tag in tag_list:
            filters.append(Product.tags.contains([tag]))
    
    # Price range
    if price_min is not None:
        filters.append(Product.price >= price_min)
    if price_max is not None:
        filters.append(Product.price <= price_max)
    
    # Stock status
    if stock_status == 'in_stock':
        filters.append(Product.stock_quantity > Product.low_stock_threshold)
    elif stock_status == 'low_stock':
        filters.append(
            and_(
                Product.stock_quantity > 0,
                Product.stock_quantity <= Product.low_stock_threshold
            )
        )
    elif stock_status == 'out_of_stock':
        filters.append(Product.stock_quantity == 0)
    
    # Status filters
    if is_active is not None:
        filters.append(Product.is_active == is_active)
    if is_featured is not None:
        filters.append(Product.is_featured == is_featured)
    
    # Search
    if search:
        search_filter = or_(
            Product.name.ilike(f'%{search}%'),
            Product.sku.ilike(f'%{search}%'),
            Product.description.ilike(f'%{search}%')
        )
        filters.append(search_filter)
    
    # Count total
    count_result = await db.execute(
        select(func.count(Product.id)).where(and_(*filters))
    )
    total = count_result.scalar()
    
    # Sort
    sort_column = getattr(Product, sort_by, Product.created_at)
    order_func = desc if sort_order == 'desc' else asc
    
    # Get products
    query = (
        select(Product)
        .where(and_(*filters))
        .order_by(order_func(sort_column))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return {
        'items': products,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }
