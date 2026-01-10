"""
Shopping cart endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductVariant
from app.models.coupon import Coupon
from app.schemas.cart import *

router = APIRouter()


async def get_or_create_cart(
    db: AsyncSession,
    store_id: int,
    user: Optional[User] = None,
    session_id: Optional[str] = None
) -> Cart:
    """Get or create cart for user or session"""
    if user:
        # User cart
        result = await db.execute(
            select(Cart)
            .options(joinedload(Cart.items))
            .where(Cart.user_id == user.id, Cart.store_id == store_id)
        )
        cart = result.scalar_one_or_none()
        
        if not cart:
            cart = Cart(
                user_id=user.id,
                store_id=store_id,
                expires_at=datetime.now() + timedelta(days=30)
            )
            db.add(cart)
            await db.flush()
    else:
        # Guest cart
        if not session_id:
            session_id = str(uuid.uuid4())
        
        result = await db.execute(
            select(Cart)
            .options(joinedload(Cart.items))
            .where(Cart.session_id == session_id, Cart.store_id == store_id)
        )
        cart = result.scalar_one_or_none()
        
        if not cart:
            cart = Cart(
                session_id=session_id,
                store_id=store_id,
                expires_at=datetime.now() + timedelta(days=7)
            )
            db.add(cart)
            await db.flush()
    
    return cart


@router.get("/", response_model=CartResponse)
async def get_cart(
    store_id: int,
    x_session_id: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current cart"""
    cart = await get_or_create_cart(db, store_id, current_user, x_session_id)
    
    # Load items with product details
    result = await db.execute(
        select(Cart)
        .options(
            joinedload(Cart.items).joinedload(CartItem.product),
            joinedload(Cart.items).joinedload(CartItem.variant)
        )
        .where(Cart.id == cart.id)
    )
    cart = result.scalar_one()
    
    # Build response
    items = []
    for item in cart.items:
        # Get product image
        product_image = None
        if item.product.images:
            primary = next((img for img in item.product.images if img.is_primary), None)
            product_image = primary.url if primary else (item.product.images[0].url if item.product.images else None)
        
        items.append(CartItemResponse(
            id=item.id,
            cart_id=item.cart_id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            price=item.price,
            total_price=item.total_price,
            product_name=item.product.name,
            product_image=product_image,
            variant_name=item.variant.name if item.variant else None,
            is_available=item.product.is_in_stock,
            custom_options=item.custom_options,
            created_at=item.created_at,
            updated_at=item.updated_at
        ))
    
    # Calculate totals
    subtotal = cart.subtotal
    discount_amount = Decimal('0')
    
    # Apply coupon if present
    if cart.coupon_code:
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.code == cart.coupon_code)
        )
        coupon = coupon_result.scalar_one_or_none()
        if coupon:
            is_valid, message = coupon.is_valid(
                user_id=current_user.id if current_user else None,
                cart_total=subtotal
            )
            if is_valid:
                discount_amount = coupon.calculate_discount(subtotal)
    
    summary = CartSummary(
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_cost=Decimal('0'),  # Calculated at checkout
        tax_amount=Decimal('0'),  # Calculated at checkout
        total=subtotal - discount_amount,
        items_count=cart.total_items,
        coupon_code=cart.coupon_code
    )
    
    return CartResponse(
        id=cart.id,
        store_id=cart.store_id,
        items=items,
        summary=summary,
        created_at=cart.created_at,
        updated_at=cart.updated_at,
        expires_at=cart.expires_at
    )


@router.post("/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    store_id: int,
    item_data: CartItemCreate,
    x_session_id: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add item to cart"""
    cart = await get_or_create_cart(db, store_id, current_user, x_session_id)
    
    # Verify product exists and is available
    product_result = await db.execute(
        select(Product).where(Product.id == item_data.product_id)
    )
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is not available"
        )
    
    # Get price
    price = product.price
    variant = None
    
    if item_data.variant_id:
        variant_result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.id == item_data.variant_id,
                ProductVariant.product_id == item_data.product_id
            )
        )
        variant = variant_result.scalar_one_or_none()
        
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Variant not found"
            )
        
        if variant.price is not None:
            price = variant.price
    
    # Check if item already in cart
    existing_result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item_data.product_id,
            CartItem.variant_id == item_data.variant_id
        )
    )
    existing_item = existing_result.scalar_one_or_none()
    
    if existing_item:
        # Update quantity
        existing_item.quantity += item_data.quantity
        existing_item.updated_at = datetime.now()
        cart_item = existing_item
    else:
        # Create new item
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            variant_id=item_data.variant_id,
            quantity=item_data.quantity,
            price=price,
            custom_options=item_data.custom_options
        )
        db.add(cart_item)
    
    cart.updated_at = datetime.now()
    await db.commit()
    await db.refresh(cart_item)
    
    return CartItemResponse(
        id=cart_item.id,
        cart_id=cart_item.cart_id,
        product_id=cart_item.product_id,
        variant_id=cart_item.variant_id,
        quantity=cart_item.quantity,
        price=cart_item.price,
        total_price=cart_item.total_price,
        product_name=product.name,
        variant_name=variant.name if variant else None,
        is_available=product.is_in_stock,
        custom_options=cart_item.custom_options,
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at
    )


@router.put("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    x_session_id: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update cart item"""
    result = await db.execute(
        select(CartItem)
        .options(joinedload(CartItem.cart), joinedload(CartItem.product))
        .where(CartItem.id == item_id)
    )
    cart_item = result.scalar_one_or_none()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    # Verify access
    if current_user:
        if cart_item.cart.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    elif cart_item.cart.session_id != x_session_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    if item_data.quantity == 0:
        # Remove item
        await db.delete(cart_item)
        cart_item.cart.updated_at = datetime.now()
        await db.commit()
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)
    
    # Update item
    cart_item.quantity = item_data.quantity
    if item_data.custom_options is not None:
        cart_item.custom_options = item_data.custom_options
    cart_item.updated_at = datetime.now()
    cart_item.cart.updated_at = datetime.now()
    
    await db.commit()
    await db.refresh(cart_item)
    
    return CartItemResponse(
        id=cart_item.id,
        cart_id=cart_item.cart_id,
        product_id=cart_item.product_id,
        variant_id=cart_item.variant_id,
        quantity=cart_item.quantity,
        price=cart_item.price,
        total_price=cart_item.total_price,
        product_name=cart_item.product.name,
        is_available=cart_item.product.is_in_stock,
        custom_options=cart_item.custom_options,
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at
    )


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(
    item_id: int,
    x_session_id: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove item from cart"""
    result = await db.execute(
        select(CartItem)
        .options(joinedload(CartItem.cart))
        .where(CartItem.id == item_id)
    )
    cart_item = result.scalar_one_or_none()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    # Verify access
    if current_user:
        if cart_item.cart.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    elif cart_item.cart.session_id != x_session_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    cart_item.cart.updated_at = datetime.now()
    await db.delete(cart_item)
    await db.commit()


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    store_id: int,
    x_session_id: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Clear cart"""
    cart = await get_or_create_cart(db, store_id, current_user, x_session_id)
    
    # Delete all items
    await db.execute(
        CartItem.__table__.delete().where(CartItem.cart_id == cart.id)
    )
    
    cart.coupon_code = None
    cart.updated_at = datetime.now()
    await db.commit()


@router.post("/apply-coupon")
async def apply_coupon(
    store_id: int,
    coupon_data: ApplyCouponRequest,
    x_session_id: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Apply coupon to cart"""
    cart = await get_or_create_cart(db, store_id, current_user, x_session_id)
    
    # Find coupon
    result = await db.execute(
        select(Coupon).where(
            Coupon.code == coupon_data.coupon_code,
            Coupon.store_id == store_id
        )
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    # Validate coupon
    is_valid, message = coupon.is_valid(
        user_id=current_user.id if current_user else None,
        cart_total=cart.subtotal
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Apply coupon
    cart.coupon_code = coupon.code
    cart.updated_at = datetime.now()
    await db.commit()
    
    discount_amount = coupon.calculate_discount(cart.subtotal)
    
    return {
        "message": "Coupon applied successfully",
        "discount_amount": discount_amount,
        "final_total": cart.subtotal - discount_amount
    }


@router.delete("/coupon", status_code=status.HTTP_204_NO_CONTENT)
async def remove_coupon(
    store_id: int,
    x_session_id: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove coupon from cart"""
    cart = await get_or_create_cart(db, store_id, current_user, x_session_id)
    cart.coupon_code = None
    cart.updated_at = datetime.now()
    await db.commit()
