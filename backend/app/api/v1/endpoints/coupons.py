"""
Coupon and shipping endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.coupon import Coupon, ShippingRate
from app.schemas.coupon import *

router = APIRouter()

# ========== COUPON ENDPOINTS ==========

@router.post("/", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    coupon_data: CouponCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create coupon (admin only)"""
    # Check if code already exists
    result = await db.execute(
        select(Coupon).where(Coupon.code == coupon_data.code.upper())
    )
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon code already exists"
        )
    
    # Create coupon
    coupon_dict = coupon_data.dict()
    coupon_dict['code'] = coupon_dict['code'].upper()
    
    coupon = Coupon(**coupon_dict)
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    
    return coupon


@router.get("/", response_model=List[CouponResponse])
async def list_coupons(
    store_id: int,
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List coupons (admin only)"""
    filters = [Coupon.store_id == store_id]
    
    if is_active is not None:
        filters.append(Coupon.is_active == is_active)
    
    query = select(Coupon).where(and_(*filters)).order_by(desc(Coupon.created_at))
    result = await db.execute(query)
    coupons = result.scalars().all()
    
    return coupons


@router.get("/{coupon_id}", response_model=CouponResponse)
async def get_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get coupon (admin only)"""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    return coupon


@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: int,
    coupon_data: CouponUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update coupon (admin only)"""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    # Update fields
    update_data = coupon_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(coupon, field, value)
    
    await db.commit()
    await db.refresh(coupon)
    
    return coupon


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete coupon (admin only)"""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    await db.delete(coupon)
    await db.commit()


@router.post("/validate", response_model=ValidateCouponResponse)
async def validate_coupon(
    store_id: int,
    code: str,
    cart_total: Decimal,
    user_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Validate coupon code (public endpoint)"""
    result = await db.execute(
        select(Coupon).where(
            Coupon.code == code.upper(),
            Coupon.store_id == store_id
        )
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        return ValidateCouponResponse(
            valid=False,
            message="Coupon not found"
        )
    
    is_valid, message = coupon.is_valid(user_id=user_id, cart_total=cart_total)
    
    if not is_valid:
        return ValidateCouponResponse(
            valid=False,
            message=message
        )
    
    discount_amount = coupon.calculate_discount(cart_total)
    final_total = cart_total - discount_amount
    
    return ValidateCouponResponse(
        valid=True,
        message="Coupon is valid",
        discount_amount=discount_amount,
        final_total=final_total
    )


# ========== SHIPPING RATE ENDPOINTS ==========

@router.post("/shipping-rates", response_model=ShippingRateResponse, status_code=status.HTTP_201_CREATED)
async def create_shipping_rate(
    shipping_data: ShippingRateCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create shipping rate (admin only)"""
    shipping_rate = ShippingRate(**shipping_data.dict())
    db.add(shipping_rate)
    await db.commit()
    await db.refresh(shipping_rate)
    
    return shipping_rate


@router.get("/shipping-rates", response_model=List[ShippingRateResponse])
async def list_shipping_rates(
    store_id: int,
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List shipping rates"""
    filters = [ShippingRate.store_id == store_id]
    
    if is_active is not None:
        filters.append(ShippingRate.is_active == is_active)
    
    query = select(ShippingRate).where(and_(*filters)).order_by(ShippingRate.position)
    result = await db.execute(query)
    rates = result.scalars().all()
    
    return rates


@router.get("/shipping-rates/{rate_id}", response_model=ShippingRateResponse)
async def get_shipping_rate(
    rate_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get shipping rate"""
    result = await db.execute(select(ShippingRate).where(ShippingRate.id == rate_id))
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping rate not found"
        )
    
    return rate


@router.put("/shipping-rates/{rate_id}", response_model=ShippingRateResponse)
async def update_shipping_rate(
    rate_id: int,
    shipping_data: ShippingRateUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update shipping rate (admin only)"""
    result = await db.execute(select(ShippingRate).where(ShippingRate.id == rate_id))
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping rate not found"
        )
    
    # Update fields
    update_data = shipping_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rate, field, value)
    
    await db.commit()
    await db.refresh(rate)
    
    return rate


@router.delete("/shipping-rates/{rate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shipping_rate(
    rate_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete shipping rate (admin only)"""
    result = await db.execute(select(ShippingRate).where(ShippingRate.id == rate_id))
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping rate not found"
        )
    
    await db.delete(rate)
    await db.commit()


@router.post("/shipping-rates/calculate", response_model=List[ShippingOptionResponse])
async def calculate_shipping(
    store_id: int,
    shipping_request: CalculateShippingRequest,
    cart_total: Decimal = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Calculate available shipping options"""
    # Get all active shipping rates
    result = await db.execute(
        select(ShippingRate).where(
            ShippingRate.store_id == store_id,
            ShippingRate.is_active == True
        ).order_by(ShippingRate.position)
    )
    rates = result.scalars().all()
    
    options = []
    
    for rate in rates:
        # Check if rate applies to country
        if rate.countries and shipping_request.country not in rate.countries:
            continue
        
        # Calculate cost
        weight = shipping_request.weight or Decimal('0')
        cost = rate.calculate_shipping(cart_total, weight, shipping_request.country)
        
        # Build estimated delivery
        estimated_days = None
        if rate.min_delivery_days and rate.max_delivery_days:
            estimated_days = f"{rate.min_delivery_days}-{rate.max_delivery_days} days"
        elif rate.min_delivery_days:
            estimated_days = f"{rate.min_delivery_days}+ days"
        
        options.append(ShippingOptionResponse(
            shipping_rate_id=rate.id,
            name=rate.name,
            description=rate.description,
            cost=cost,
            estimated_days=estimated_days
        ))
    
    return options
