"""
Settings management schemas for admin dashboard
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, HttpUrl, validator
from decimal import Decimal


# ============================================
# GENERAL STORE SETTINGS
# ============================================

class StoreGeneralSettings(BaseModel):
    """General store settings"""
    store_name: str = Field(..., min_length=1, max_length=200)
    store_description: Optional[str] = None
    store_email: EmailStr
    store_phone: Optional[str] = None
    store_logo: Optional[HttpUrl] = None
    store_favicon: Optional[HttpUrl] = None
    
    # Address
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "IT"
    
    # Business info
    vat_number: Optional[str] = None
    tax_code: Optional[str] = None
    company_name: Optional[str] = None
    
    # Settings
    currency: str = Field(default="EUR", pattern="^[A-Z]{3}$")
    timezone: str = Field(default="Europe/Rome")
    language: str = Field(default="it", pattern="^[a-z]{2}$")
    
    # Features
    enable_registration: bool = True
    enable_guest_checkout: bool = True
    enable_reviews: bool = True
    enable_wishlist: bool = True
    
    # Social media
    facebook_url: Optional[HttpUrl] = None
    instagram_url: Optional[HttpUrl] = None
    twitter_url: Optional[HttpUrl] = None
    linkedin_url: Optional[HttpUrl] = None

    class Config:
        from_attributes = True


class StoreGeneralSettingsResponse(StoreGeneralSettings):
    """Store settings with metadata"""
    id: int
    updated_at: datetime
    updated_by: Optional[int]

    class Config:
        from_attributes = True


# ============================================
# PAYMENT METHODS
# ============================================

class PaymentMethodCreate(BaseModel):
    """Create payment method"""
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50, pattern="^[a-z0-9_]+$")
    description: Optional[str] = None
    enabled: bool = True
    
    # Configuration (JSON for flexibility)
    config: Dict[str, Any] = {}
    
    # Stripe specific
    stripe_enabled: bool = False
    stripe_publishable_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    
    # PayPal specific
    paypal_enabled: bool = False
    paypal_client_id: Optional[str] = None
    paypal_secret: Optional[str] = None
    paypal_mode: str = Field(default="sandbox", pattern="^(sandbox|live)$")
    
    # Bank transfer
    bank_transfer_enabled: bool = False
    bank_name: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_swift: Optional[str] = None
    
    # Cash on delivery
    cod_enabled: bool = False
    cod_fee: Decimal = Field(default=Decimal('0'))
    
    # Display
    icon: Optional[str] = None
    sort_order: int = 0

    class Config:
        from_attributes = True


class PaymentMethodUpdate(BaseModel):
    """Update payment method"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    enabled: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None
    stripe_enabled: Optional[bool] = None
    stripe_publishable_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    paypal_enabled: Optional[bool] = None
    paypal_client_id: Optional[str] = None
    paypal_secret: Optional[str] = None
    paypal_mode: Optional[str] = None
    bank_transfer_enabled: Optional[bool] = None
    bank_name: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_swift: Optional[str] = None
    cod_enabled: Optional[bool] = None
    cod_fee: Optional[Decimal] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None

    class Config:
        from_attributes = True


class PaymentMethodResponse(BaseModel):
    """Payment method response"""
    id: int
    name: str
    code: str
    description: Optional[str]
    enabled: bool
    config: Dict[str, Any]
    stripe_enabled: bool
    paypal_enabled: bool
    bank_transfer_enabled: bool
    cod_enabled: bool
    cod_fee: Decimal
    icon: Optional[str]
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# SHIPPING ZONES
# ============================================

class ShippingZoneCreate(BaseModel):
    """Create shipping zone"""
    name: str = Field(..., min_length=1, max_length=100)
    countries: List[str] = Field(..., min_items=1)  # ISO country codes
    enabled: bool = True

    class Config:
        from_attributes = True


class ShippingZoneUpdate(BaseModel):
    """Update shipping zone"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    countries: Optional[List[str]] = None
    enabled: Optional[bool] = None

    class Config:
        from_attributes = True


class ShippingRateCreate(BaseModel):
    """Create shipping rate"""
    zone_id: int
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    
    # Calculation method
    calculation_method: str = Field(..., pattern="^(flat_rate|weight_based|price_based|free)$")
    
    # Flat rate
    flat_rate: Decimal = Field(default=Decimal('0'))
    
    # Weight based
    min_weight: Optional[Decimal] = None
    max_weight: Optional[Decimal] = None
    rate_per_kg: Optional[Decimal] = None
    
    # Price based
    min_order_amount: Optional[Decimal] = None
    max_order_amount: Optional[Decimal] = None
    rate_percentage: Optional[Decimal] = None
    
    # Free shipping
    free_shipping_min_amount: Optional[Decimal] = None
    
    # Settings
    enabled: bool = True
    estimated_days_min: Optional[int] = None
    estimated_days_max: Optional[int] = None
    sort_order: int = 0

    class Config:
        from_attributes = True


class ShippingRateUpdate(BaseModel):
    """Update shipping rate"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    calculation_method: Optional[str] = None
    flat_rate: Optional[Decimal] = None
    min_weight: Optional[Decimal] = None
    max_weight: Optional[Decimal] = None
    rate_per_kg: Optional[Decimal] = None
    min_order_amount: Optional[Decimal] = None
    max_order_amount: Optional[Decimal] = None
    rate_percentage: Optional[Decimal] = None
    free_shipping_min_amount: Optional[Decimal] = None
    enabled: Optional[bool] = None
    estimated_days_min: Optional[int] = None
    estimated_days_max: Optional[int] = None
    sort_order: Optional[int] = None

    class Config:
        from_attributes = True


class ShippingRateResponse(BaseModel):
    """Shipping rate response"""
    id: int
    zone_id: int
    name: str
    description: Optional[str]
    calculation_method: str
    flat_rate: Decimal
    min_weight: Optional[Decimal]
    max_weight: Optional[Decimal]
    rate_per_kg: Optional[Decimal]
    min_order_amount: Optional[Decimal]
    max_order_amount: Optional[Decimal]
    rate_percentage: Optional[Decimal]
    free_shipping_min_amount: Optional[Decimal]
    enabled: bool
    estimated_days_min: Optional[int]
    estimated_days_max: Optional[int]
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class ShippingZoneResponse(BaseModel):
    """Shipping zone with rates"""
    id: int
    name: str
    countries: List[str]
    enabled: bool
    rates: List[ShippingRateResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# TAX SETTINGS
# ============================================

class TaxRateCreate(BaseModel):
    """Create tax rate"""
    name: str = Field(..., min_length=1, max_length=100)
    rate: Decimal = Field(..., ge=0, le=100)  # Percentage
    country: str = Field(..., min_length=2, max_length=2)
    state: Optional[str] = None
    zip_code: Optional[str] = None
    
    # Priority and compounding
    priority: int = 1
    compound: bool = False  # Tax on tax
    
    # Applicability
    apply_to_shipping: bool = False
    
    enabled: bool = True

    class Config:
        from_attributes = True


class TaxRateUpdate(BaseModel):
    """Update tax rate"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    rate: Optional[Decimal] = Field(None, ge=0, le=100)
    country: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    priority: Optional[int] = None
    compound: Optional[bool] = None
    apply_to_shipping: Optional[bool] = None
    enabled: Optional[bool] = None

    class Config:
        from_attributes = True


class TaxRateResponse(BaseModel):
    """Tax rate response"""
    id: int
    name: str
    rate: Decimal
    country: str
    state: Optional[str]
    zip_code: Optional[str]
    priority: int
    compound: bool
    apply_to_shipping: bool
    enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaxSettings(BaseModel):
    """General tax settings"""
    prices_include_tax: bool = False
    calculate_tax_based_on: str = Field(default="shipping", pattern="^(shipping|billing|store)$")
    shipping_tax_class: str = Field(default="standard")
    display_prices_in_shop: str = Field(default="excluding", pattern="^(including|excluding)$")
    display_prices_during_cart_checkout: str = Field(default="excluding", pattern="^(including|excluding)$")

    class Config:
        from_attributes = True


# ============================================
# THEME CUSTOMIZATION
# ============================================

class ThemeColors(BaseModel):
    """Theme color scheme"""
    primary: str = Field(default="#3B82F6", pattern="^#[0-9A-Fa-f]{6}$")
    secondary: str = Field(default="#10B981", pattern="^#[0-9A-Fa-f]{6}$")
    accent: str = Field(default="#F59E0B", pattern="^#[0-9A-Fa-f]{6}$")
    success: str = Field(default="#10B981", pattern="^#[0-9A-Fa-f]{6}$")
    warning: str = Field(default="#F59E0B", pattern="^#[0-9A-Fa-f]{6}$")
    error: str = Field(default="#EF4444", pattern="^#[0-9A-Fa-f]{6}$")
    background: str = Field(default="#FFFFFF", pattern="^#[0-9A-Fa-f]{6}$")
    surface: str = Field(default="#F9FAFB", pattern="^#[0-9A-Fa-f]{6}$")
    text_primary: str = Field(default="#111827", pattern="^#[0-9A-Fa-f]{6}$")
    text_secondary: str = Field(default="#6B7280", pattern="^#[0-9A-Fa-f]{6}$")

    class Config:
        from_attributes = True


class ThemeTypography(BaseModel):
    """Theme typography settings"""
    font_family_primary: str = Field(default="Inter")
    font_family_secondary: str = Field(default="Inter")
    font_size_base: int = Field(default=16, ge=12, le=24)
    font_weight_normal: int = Field(default=400)
    font_weight_medium: int = Field(default=500)
    font_weight_bold: int = Field(default=700)

    class Config:
        from_attributes = True


class ThemeLayout(BaseModel):
    """Theme layout settings"""
    container_max_width: int = Field(default=1280, ge=960, le=1920)
    border_radius: int = Field(default=8, ge=0, le=32)
    spacing_unit: int = Field(default=8, ge=4, le=16)
    header_height: int = Field(default=64, ge=48, le=96)
    footer_height: int = Field(default=200, ge=100, le=400)

    class Config:
        from_attributes = True


class ThemeCustomization(BaseModel):
    """Complete theme customization"""
    theme_name: str = Field(default="Default")
    dark_mode: bool = False
    
    colors: ThemeColors = Field(default_factory=ThemeColors)
    typography: ThemeTypography = Field(default_factory=ThemeTypography)
    layout: ThemeLayout = Field(default_factory=ThemeLayout)
    
    # Custom CSS
    custom_css: Optional[str] = None
    
    # Homepage sections
    show_hero_banner: bool = True
    show_featured_products: bool = True
    show_categories: bool = True
    show_testimonials: bool = False
    show_newsletter: bool = True

    class Config:
        from_attributes = True


class ThemeCustomizationResponse(ThemeCustomization):
    """Theme with metadata"""
    id: int
    updated_at: datetime
    updated_by: Optional[int]

    class Config:
        from_attributes = True


# ============================================
# SETTINGS RESPONSES
# ============================================

class AllSettingsResponse(BaseModel):
    """Complete settings response"""
    general: StoreGeneralSettingsResponse
    payment_methods: List[PaymentMethodResponse]
    shipping_zones: List[ShippingZoneResponse]
    tax_rates: List[TaxRateResponse]
    tax_settings: TaxSettings
    theme: ThemeCustomizationResponse

    class Config:
        from_attributes = True


class SettingsUpdateResponse(BaseModel):
    """Settings update response"""
    success: bool
    message: str
    updated_fields: List[str]

    class Config:
        from_attributes = True
