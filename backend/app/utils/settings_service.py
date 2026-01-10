"""
Settings management service for admin operations
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from decimal import Decimal

from app.models.settings import (
    StoreSettings, PaymentMethod, ShippingZone, ShippingRate,
    TaxRate, TaxSettings as TaxSettingsModel, ThemeSettings
)


class SettingsService:
    """Service for settings operations"""
    
    @staticmethod
    async def get_or_create_store_settings(
        db: AsyncSession,
        store_id: int = 1
    ) -> StoreSettings:
        """Get or create store settings"""
        result = await db.execute(
            select(StoreSettings).where(StoreSettings.store_id == store_id)
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            # Create default settings
            settings = StoreSettings(
                store_id=store_id,
                store_name="My Store",
                store_email="store@example.com",
                currency="EUR",
                timezone="Europe/Rome",
                language="it",
                country="IT"
            )
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        
        return settings
    
    @staticmethod
    async def update_store_settings(
        db: AsyncSession,
        store_id: int,
        data: Dict[str, Any],
        admin_id: int
    ) -> StoreSettings:
        """Update store settings"""
        settings = await SettingsService.get_or_create_store_settings(db, store_id)
        
        for field, value in data.items():
            if hasattr(settings, field):
                setattr(settings, field, value)
        
        settings.updated_by = admin_id
        await db.commit()
        await db.refresh(settings)
        
        return settings
    
    @staticmethod
    async def get_all_payment_methods(
        db: AsyncSession,
        store_id: int = 1
    ) -> List[PaymentMethod]:
        """Get all payment methods"""
        result = await db.execute(
            select(PaymentMethod)
            .where(PaymentMethod.store_id == store_id)
            .order_by(PaymentMethod.sort_order)
        )
        return result.scalars().all()
    
    @staticmethod
    async def create_payment_method(
        db: AsyncSession,
        store_id: int,
        data: Dict[str, Any]
    ) -> PaymentMethod:
        """Create payment method"""
        payment_method = PaymentMethod(
            store_id=store_id,
            **data
        )
        db.add(payment_method)
        await db.commit()
        await db.refresh(payment_method)
        return payment_method
    
    @staticmethod
    async def update_payment_method(
        db: AsyncSession,
        method_id: int,
        data: Dict[str, Any]
    ) -> Optional[PaymentMethod]:
        """Update payment method"""
        result = await db.execute(
            select(PaymentMethod).where(PaymentMethod.id == method_id)
        )
        method = result.scalar_one_or_none()
        
        if not method:
            return None
        
        for field, value in data.items():
            if hasattr(method, field):
                setattr(method, field, value)
        
        await db.commit()
        await db.refresh(method)
        return method
    
    @staticmethod
    async def get_all_shipping_zones(
        db: AsyncSession,
        store_id: int = 1
    ) -> List[ShippingZone]:
        """Get all shipping zones with rates"""
        result = await db.execute(
            select(ShippingZone)
            .where(ShippingZone.store_id == store_id)
        )
        return result.scalars().all()
    
    @staticmethod
    async def create_shipping_zone(
        db: AsyncSession,
        store_id: int,
        data: Dict[str, Any]
    ) -> ShippingZone:
        """Create shipping zone"""
        zone = ShippingZone(
            store_id=store_id,
            **data
        )
        db.add(zone)
        await db.commit()
        await db.refresh(zone)
        return zone
    
    @staticmethod
    async def create_shipping_rate(
        db: AsyncSession,
        data: Dict[str, Any]
    ) -> ShippingRate:
        """Create shipping rate"""
        rate = ShippingRate(**data)
        db.add(rate)
        await db.commit()
        await db.refresh(rate)
        return rate
    
    @staticmethod
    async def update_shipping_rate(
        db: AsyncSession,
        rate_id: int,
        data: Dict[str, Any]
    ) -> Optional[ShippingRate]:
        """Update shipping rate"""
        result = await db.execute(
            select(ShippingRate).where(ShippingRate.id == rate_id)
        )
        rate = result.scalar_one_or_none()
        
        if not rate:
            return None
        
        for field, value in data.items():
            if hasattr(rate, field):
                setattr(rate, field, value)
        
        await db.commit()
        await db.refresh(rate)
        return rate
    
    @staticmethod
    async def get_all_tax_rates(
        db: AsyncSession,
        store_id: int = 1
    ) -> List[TaxRate]:
        """Get all tax rates"""
        result = await db.execute(
            select(TaxRate)
            .where(TaxRate.store_id == store_id)
            .order_by(TaxRate.priority)
        )
        return result.scalars().all()
    
    @staticmethod
    async def create_tax_rate(
        db: AsyncSession,
        store_id: int,
        data: Dict[str, Any]
    ) -> TaxRate:
        """Create tax rate"""
        tax_rate = TaxRate(
            store_id=store_id,
            **data
        )
        db.add(tax_rate)
        await db.commit()
        await db.refresh(tax_rate)
        return tax_rate
    
    @staticmethod
    async def get_or_create_tax_settings(
        db: AsyncSession,
        store_id: int = 1
    ) -> TaxSettingsModel:
        """Get or create tax settings"""
        result = await db.execute(
            select(TaxSettingsModel).where(TaxSettingsModel.store_id == store_id)
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            settings = TaxSettingsModel(store_id=store_id)
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        
        return settings
    
    @staticmethod
    async def update_tax_settings(
        db: AsyncSession,
        store_id: int,
        data: Dict[str, Any]
    ) -> TaxSettingsModel:
        """Update tax settings"""
        settings = await SettingsService.get_or_create_tax_settings(db, store_id)
        
        for field, value in data.items():
            if hasattr(settings, field):
                setattr(settings, field, value)
        
        await db.commit()
        await db.refresh(settings)
        return settings
    
    @staticmethod
    async def get_or_create_theme_settings(
        db: AsyncSession,
        store_id: int = 1
    ) -> ThemeSettings:
        """Get or create theme settings"""
        result = await db.execute(
            select(ThemeSettings).where(ThemeSettings.store_id == store_id)
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            # Default theme
            settings = ThemeSettings(
                store_id=store_id,
                theme_name="Default",
                colors={
                    "primary": "#3B82F6",
                    "secondary": "#10B981",
                    "accent": "#F59E0B",
                    "success": "#10B981",
                    "warning": "#F59E0B",
                    "error": "#EF4444",
                    "background": "#FFFFFF",
                    "surface": "#F9FAFB",
                    "text_primary": "#111827",
                    "text_secondary": "#6B7280"
                },
                typography={
                    "font_family_primary": "Inter",
                    "font_family_secondary": "Inter",
                    "font_size_base": 16,
                    "font_weight_normal": 400,
                    "font_weight_medium": 500,
                    "font_weight_bold": 700
                },
                layout={
                    "container_max_width": 1280,
                    "border_radius": 8,
                    "spacing_unit": 8,
                    "header_height": 64,
                    "footer_height": 200
                }
            )
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        
        return settings
    
    @staticmethod
    async def update_theme_settings(
        db: AsyncSession,
        store_id: int,
        data: Dict[str, Any],
        admin_id: int
    ) -> ThemeSettings:
        """Update theme settings"""
        settings = await SettingsService.get_or_create_theme_settings(db, store_id)
        
        for field, value in data.items():
            if hasattr(settings, field):
                setattr(settings, field, value)
        
        settings.updated_by = admin_id
        await db.commit()
        await db.refresh(settings)
        return settings
