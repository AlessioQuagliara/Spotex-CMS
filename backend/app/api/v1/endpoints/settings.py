"""
Settings management endpoints for admin
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.settings import PaymentMethod, ShippingZone, ShippingRate, TaxRate
from app.schemas.settings_admin import *
from app.utils.settings_service import SettingsService

router = APIRouter()


# ============================================
# GENERAL STORE SETTINGS
# ============================================

@router.get("/general", response_model=StoreGeneralSettingsResponse)
async def get_general_settings(
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get general store settings"""
    settings = await SettingsService.get_or_create_store_settings(db, store_id)
    return settings


@router.put("/general", response_model=StoreGeneralSettingsResponse)
async def update_general_settings(
    request: StoreGeneralSettings,
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update general store settings"""
    settings = await SettingsService.update_store_settings(
        db=db,
        store_id=store_id,
        data=request.model_dump(exclude_unset=True),
        admin_id=current_user.id
    )
    return settings


# ============================================
# PAYMENT METHODS
# ============================================

@router.get("/payment-methods", response_model=List[PaymentMethodResponse])
async def get_payment_methods(
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all payment methods"""
    methods = await SettingsService.get_all_payment_methods(db, store_id)
    return methods


@router.post("/payment-methods", response_model=PaymentMethodResponse)
async def create_payment_method(
    request: PaymentMethodCreate,
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create payment method"""
    method = await SettingsService.create_payment_method(
        db=db,
        store_id=store_id,
        data=request.model_dump()
    )
    return method


@router.put("/payment-methods/{method_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    method_id: int,
    request: PaymentMethodUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update payment method"""
    method = await SettingsService.update_payment_method(
        db=db,
        method_id=method_id,
        data=request.model_dump(exclude_unset=True)
    )
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    return method


@router.delete("/payment-methods/{method_id}")
async def delete_payment_method(
    method_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete payment method"""
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == method_id)
    )
    method = result.scalar_one_or_none()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    await db.delete(method)
    await db.commit()
    
    return {'success': True, 'message': 'Payment method deleted'}


# ============================================
# SHIPPING ZONES
# ============================================

@router.get("/shipping-zones", response_model=List[ShippingZoneResponse])
async def get_shipping_zones(
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all shipping zones with rates"""
    zones = await SettingsService.get_all_shipping_zones(db, store_id)
    
    result = []
    for zone in zones:
        result.append({
            'id': zone.id,
            'name': zone.name,
            'countries': zone.countries,
            'enabled': zone.enabled,
            'rates': zone.rates,
            'created_at': zone.created_at,
            'updated_at': zone.updated_at
        })
    
    return result


@router.post("/shipping-zones", response_model=dict)
async def create_shipping_zone(
    request: ShippingZoneCreate,
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create shipping zone"""
    zone = await SettingsService.create_shipping_zone(
        db=db,
        store_id=store_id,
        data=request.model_dump()
    )
    return {'success': True, 'zone_id': zone.id}


@router.put("/shipping-zones/{zone_id}", response_model=dict)
async def update_shipping_zone(
    zone_id: int,
    request: ShippingZoneUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update shipping zone"""
    result = await db.execute(
        select(ShippingZone).where(ShippingZone.id == zone_id)
    )
    zone = result.scalar_one_or_none()
    
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping zone not found"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(zone, field, value)
    
    await db.commit()
    return {'success': True, 'zone_id': zone_id}


@router.delete("/shipping-zones/{zone_id}")
async def delete_shipping_zone(
    zone_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete shipping zone"""
    result = await db.execute(
        select(ShippingZone).where(ShippingZone.id == zone_id)
    )
    zone = result.scalar_one_or_none()
    
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping zone not found"
        )
    
    await db.delete(zone)
    await db.commit()
    
    return {'success': True, 'message': 'Shipping zone deleted'}


# ============================================
# SHIPPING RATES
# ============================================

@router.post("/shipping-rates", response_model=ShippingRateResponse)
async def create_shipping_rate(
    request: ShippingRateCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create shipping rate"""
    rate = await SettingsService.create_shipping_rate(
        db=db,
        data=request.model_dump()
    )
    return rate


@router.put("/shipping-rates/{rate_id}", response_model=ShippingRateResponse)
async def update_shipping_rate(
    rate_id: int,
    request: ShippingRateUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update shipping rate"""
    rate = await SettingsService.update_shipping_rate(
        db=db,
        rate_id=rate_id,
        data=request.model_dump(exclude_unset=True)
    )
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping rate not found"
        )
    
    return rate


@router.delete("/shipping-rates/{rate_id}")
async def delete_shipping_rate(
    rate_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete shipping rate"""
    result = await db.execute(
        select(ShippingRate).where(ShippingRate.id == rate_id)
    )
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping rate not found"
        )
    
    await db.delete(rate)
    await db.commit()
    
    return {'success': True, 'message': 'Shipping rate deleted'}


# ============================================
# TAX RATES
# ============================================

@router.get("/tax-rates", response_model=List[TaxRateResponse])
async def get_tax_rates(
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tax rates"""
    rates = await SettingsService.get_all_tax_rates(db, store_id)
    return rates


@router.post("/tax-rates", response_model=TaxRateResponse)
async def create_tax_rate(
    request: TaxRateCreate,
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create tax rate"""
    rate = await SettingsService.create_tax_rate(
        db=db,
        store_id=store_id,
        data=request.model_dump()
    )
    return rate


@router.put("/tax-rates/{rate_id}", response_model=TaxRateResponse)
async def update_tax_rate(
    rate_id: int,
    request: TaxRateUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update tax rate"""
    result = await db.execute(
        select(TaxRate).where(TaxRate.id == rate_id)
    )
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax rate not found"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rate, field, value)
    
    await db.commit()
    await db.refresh(rate)
    return rate


@router.delete("/tax-rates/{rate_id}")
async def delete_tax_rate(
    rate_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete tax rate"""
    result = await db.execute(
        select(TaxRate).where(TaxRate.id == rate_id)
    )
    rate = result.scalar_one_or_none()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax rate not found"
        )
    
    await db.delete(rate)
    await db.commit()
    
    return {'success': True, 'message': 'Tax rate deleted'}


@router.get("/tax-settings", response_model=TaxSettings)
async def get_tax_settings(
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get tax settings"""
    settings = await SettingsService.get_or_create_tax_settings(db, store_id)
    return settings


@router.put("/tax-settings", response_model=TaxSettings)
async def update_tax_settings(
    request: TaxSettings,
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update tax settings"""
    settings = await SettingsService.update_tax_settings(
        db=db,
        store_id=store_id,
        data=request.model_dump()
    )
    return settings


# ============================================
# THEME CUSTOMIZATION
# ============================================

@router.get("/theme", response_model=ThemeCustomizationResponse)
async def get_theme_settings(
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get theme settings"""
    settings = await SettingsService.get_or_create_theme_settings(db, store_id)
    
    return {
        'id': settings.id,
        'theme_name': settings.theme_name,
        'dark_mode': settings.dark_mode,
        'colors': settings.colors,
        'typography': settings.typography,
        'layout': settings.layout,
        'custom_css': settings.custom_css,
        'show_hero_banner': settings.show_hero_banner,
        'show_featured_products': settings.show_featured_products,
        'show_categories': settings.show_categories,
        'show_testimonials': settings.show_testimonials,
        'show_newsletter': settings.show_newsletter,
        'updated_at': settings.updated_at,
        'updated_by': settings.updated_by
    }


@router.put("/theme", response_model=ThemeCustomizationResponse)
async def update_theme_settings(
    request: ThemeCustomization,
    store_id: int = 1,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update theme settings"""
    settings = await SettingsService.update_theme_settings(
        db=db,
        store_id=store_id,
        data=request.model_dump(exclude_unset=True),
        admin_id=current_user.id
    )
    
    return {
        'id': settings.id,
        'theme_name': settings.theme_name,
        'dark_mode': settings.dark_mode,
        'colors': settings.colors,
        'typography': settings.typography,
        'layout': settings.layout,
        'custom_css': settings.custom_css,
        'show_hero_banner': settings.show_hero_banner,
        'show_featured_products': settings.show_featured_products,
        'show_categories': settings.show_categories,
        'show_testimonials': settings.show_testimonials,
        'show_newsletter': settings.show_newsletter,
        'updated_at': settings.updated_at,
        'updated_by': settings.updated_by
    }
