"""
Product endpoints for e-commerce
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_verified_user, get_current_admin_user
from app.models.user import User
from app.models.product import (
    Product, ProductVariant, ProductImage, ProductCategory, 
    ProductTag, ProductReview, InventoryTransaction
)
from app.schemas.product import *

router = APIRouter()

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new product"""
    # Check store access
    if not current_user.is_superuser and current_user.store_id != product_data.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this store"
        )
    
    # Check unique constraints
    result = await db.execute(
        select(Product).where(
            or_(Product.slug == product_data.slug, Product.sku == product_data.sku)
        )
    )
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this slug or SKU already exists"
        )
    
    # Create product
    product_dict = product_data.dict(exclude={'category_ids', 'tags'})
    product = Product(**product_dict)
    
    db.add(product)
    await db.flush()
    
    # Add categories
    if product_data.category_ids:
        for idx, cat_id in enumerate(product_data.category_ids):
            prod_cat = ProductCategory(
                product_id=product.id,
                category_id=cat_id,
                is_primary=(idx == 0)
            )
            db.add(prod_cat)
    
    # Add tags
    if product_data.tags:
        for tag in product_data.tags:
            prod_tag = ProductTag(product_id=product.id, tag=tag.lower())
            db.add(prod_tag)
    
    await db.commit()
    await db.refresh(product)
    
    # Load relationships
    result = await db.execute(
        select(Product)
        .options(
            joinedload(Product.variants),
            joinedload(Product.images),
            joinedload(Product.categories),
            joinedload(Product.tags)
        )
        .where(Product.id == product.id)
    )
    product = result.scalar_one()
    
    return product

@router.get("/", response_model=PaginatedProductResponse)
async def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    store_id: Optional[int] = Query(None),
    query: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    tags: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    is_featured: Optional[bool] = Query(None),
    is_in_stock: Optional[bool] = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|price|name|popularity)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
):
    """List products with advanced filters"""
    # Build query
    filters = [Product.is_active == True]
    
    if store_id:
        filters.append(Product.store_id == store_id)
    
    if query:
        # Full-text search
        search_filter = or_(
            Product.name.ilike(f"%{query}%"),
            Product.description.ilike(f"%{query}%"),
            Product.sku.ilike(f"%{query}%")
        )
        filters.append(search_filter)
    
    if category_id:
        # Join with categories
        filters.append(
            Product.id.in_(
                select(ProductCategory.product_id).where(
                    ProductCategory.category_id == category_id
                )
            )
        )
    
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(',')]
        filters.append(
            Product.id.in_(
                select(ProductTag.product_id).where(
                    ProductTag.tag.in_(tag_list)
                )
            )
        )
    
    if min_price is not None:
        filters.append(Product.price >= min_price)
    
    if max_price is not None:
        filters.append(Product.price <= max_price)
    
    if is_featured is not None:
        filters.append(Product.is_featured == is_featured)
    
    if is_in_stock:
        filters.append(
            or_(
                Product.track_inventory == False,
                Product.inventory_quantity > 0,
                Product.allow_backorder == True
            )
        )
    
    # Count total
    count_query = select(func.count(Product.id)).where(and_(*filters))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Build main query
    query_stmt = select(Product).where(and_(*filters))
    
    # Sorting
    sort_column = {
        'created_at': Product.created_at,
        'price': Product.price,
        'name': Product.name,
        'popularity': Product.id  # TODO: Add view count
    }.get(sort_by, Product.created_at)
    
    if sort_order == 'asc':
        query_stmt = query_stmt.order_by(asc(sort_column))
    else:
        query_stmt = query_stmt.order_by(desc(sort_column))
    
    # Pagination
    query_stmt = query_stmt.offset((page - 1) * per_page).limit(per_page)
    
    # Execute
    result = await db.execute(query_stmt)
    products = result.scalars().all()
    
    # Convert to list response
    items = []
    for product in products:
        # Get primary image
        image_result = await db.execute(
            select(ProductImage.url)
            .where(ProductImage.product_id == product.id, ProductImage.is_primary == True)
            .limit(1)
        )
        primary_image = image_result.scalar()
        
        # Get review stats
        review_stats = await db.execute(
            select(
                func.avg(ProductReview.rating).label('avg_rating'),
                func.count(ProductReview.id).label('count')
            )
            .where(ProductReview.product_id == product.id, ProductReview.is_approved == True)
        )
        stats = review_stats.first()
        
        item = ProductListResponse(
            id=product.id,
            store_id=product.store_id,
            name=product.name,
            slug=product.slug,
            sku=product.sku,
            short_description=product.short_description,
            price=product.price,
            compare_at_price=product.compare_at_price,
            discount_percentage=product.discount_percentage,
            is_active=product.is_active,
            is_featured=product.is_featured,
            is_in_stock=product.is_in_stock,
            is_low_stock=product.is_low_stock,
            primary_image=primary_image,
            average_rating=float(stats.avg_rating) if stats.avg_rating else None,
            review_count=stats.count,
            created_at=product.created_at
        )
        items.append(item)
    
    return PaginatedProductResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get product by ID"""
    result = await db.execute(
        select(Product)
        .options(
            joinedload(Product.variants),
            joinedload(Product.images),
            joinedload(Product.categories),
            joinedload(Product.tags)
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get review stats
    review_stats = await db.execute(
        select(
            func.avg(ProductReview.rating).label('avg_rating'),
            func.count(ProductReview.id).label('count')
        )
        .where(ProductReview.product_id == product.id, ProductReview.is_approved == True)
    )
    stats = review_stats.first()
    
    response = ProductResponse.from_orm(product)
    response.average_rating = float(stats.avg_rating) if stats.avg_rating else None
    response.review_count = stats.count
    
    return response

@router.get("/slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get product by slug"""
    result = await db.execute(
        select(Product)
        .options(
            joinedload(Product.variants),
            joinedload(Product.images),
            joinedload(Product.categories),
            joinedload(Product.tags)
        )
        .where(Product.slug == slug)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update product"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != product.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    update_data = product_data.dict(exclude_unset=True, exclude={'category_ids', 'tags'})
    for field, value in update_data.items():
        setattr(product, field, value)
    
    # Update categories
    if product_data.category_ids is not None:
        # Remove old categories
        await db.execute(
            select(ProductCategory).where(ProductCategory.product_id == product_id)
        )
        await db.execute(
            ProductCategory.__table__.delete().where(ProductCategory.product_id == product_id)
        )
        
        # Add new categories
        for idx, cat_id in enumerate(product_data.category_ids):
            prod_cat = ProductCategory(
                product_id=product.id,
                category_id=cat_id,
                is_primary=(idx == 0)
            )
            db.add(prod_cat)
    
    # Update tags
    if product_data.tags is not None:
        # Remove old tags
        await db.execute(
            ProductTag.__table__.delete().where(ProductTag.product_id == product_id)
        )
        
        # Add new tags
        for tag in product_data.tags:
            prod_tag = ProductTag(product_id=product.id, tag=tag.lower())
            db.add(prod_tag)
    
    await db.commit()
    await db.refresh(product)
    
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete product"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != product.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await db.delete(product)
    await db.commit()

# Variant endpoints
@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
async def create_variant(
    product_id: int,
    variant_data: ProductVariantCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create product variant"""
    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != product.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Create variant
    variant = ProductVariant(product_id=product_id, **variant_data.dict())
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    
    return variant

# Image endpoints
@router.post("/{product_id}/images", response_model=ProductImageResponse, status_code=status.HTTP_201_CREATED)
async def add_product_image(
    product_id: int,
    image_data: ProductImageCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Add product image"""
    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != product.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # If this is primary, unset other primary images
    if image_data.is_primary:
        await db.execute(
            ProductImage.__table__.update()
            .where(ProductImage.product_id == product_id)
            .values(is_primary=False)
        )
    
    # Create image
    image = ProductImage(product_id=product_id, **image_data.dict())
    db.add(image)
    await db.commit()
    await db.refresh(image)
    
    return image

# Inventory endpoints
@router.post("/{product_id}/inventory", status_code=status.HTTP_200_OK)
async def adjust_inventory(
    product_id: int,
    adjustment: InventoryAdjustment,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Adjust product inventory"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != product.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update inventory
    product.inventory_quantity += adjustment.quantity_change
    
    if product.inventory_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient inventory"
        )
    
    # Create transaction record
    transaction = InventoryTransaction(
        product_id=product_id,
        quantity_change=adjustment.quantity_change,
        reason=adjustment.reason,
        note=adjustment.note,
        created_by=current_user.id
    )
    db.add(transaction)
    
    await db.commit()
    
    return {
        "message": "Inventory adjusted successfully",
        "new_quantity": product.inventory_quantity
    }

# Review endpoints
@router.post("/{product_id}/reviews", response_model=ProductReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    product_id: int,
    review_data: ProductReviewCreate,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Create product review"""
    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if user already reviewed
    existing = await db.execute(
        select(ProductReview).where(
            ProductReview.product_id == product_id,
            ProductReview.user_id == current_user.id
        )
    )
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )
    
    # Create review
    review = ProductReview(
        product_id=product_id,
        user_id=current_user.id,
        **review_data.dict()
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    
    return review

@router.get("/{product_id}/reviews", response_model=List[ProductReviewResponse])
async def list_product_reviews(
    product_id: int,
    only_approved: bool = Query(True),
    db: AsyncSession = Depends(get_db)
):
    """List product reviews"""
    query_stmt = select(ProductReview).where(ProductReview.product_id == product_id)
    
    if only_approved:
        query_stmt = query_stmt.where(ProductReview.is_approved == True)
    
    query_stmt = query_stmt.order_by(desc(ProductReview.created_at))
    
    result = await db.execute(query_stmt)
    reviews = result.scalars().all()
    
    return reviews
