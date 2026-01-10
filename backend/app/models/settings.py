"""
Settings models for database
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, JSON, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class StoreSettings(Base):
    """Store general settings"""
    __tablename__ = "store_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, nullable=False, default=1)
    
    # Basic info
    store_name = Column(String(200), nullable=False)
    store_description = Column(Text)
    store_email = Column(String(255), nullable=False)
    store_phone = Column(String(50))
    store_logo = Column(String(500))
    store_favicon = Column(String(500))
    
    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(2), default="IT")
    
    # Business
    vat_number = Column(String(50))
    tax_code = Column(String(50))
    company_name = Column(String(255))
    
    # Settings
    currency = Column(String(3), default="EUR")
    timezone = Column(String(50), default="Europe/Rome")
    language = Column(String(2), default="it")
    
    # Features
    enable_registration = Column(Boolean, default=True)
    enable_guest_checkout = Column(Boolean, default=True)
    enable_reviews = Column(Boolean, default=True)
    enable_wishlist = Column(Boolean, default=True)
    
    # Social
    facebook_url = Column(String(500))
    instagram_url = Column(String(500))
    twitter_url = Column(String(500))
    linkedin_url = Column(String(500))
    
    # Metadata
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(Integer)


class PaymentMethod(Base):
    """Payment method configuration"""
    __tablename__ = "payment_methods"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, nullable=False, default=1)
    
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    enabled = Column(Boolean, default=True)
    
    # Generic config
    config = Column(JSON, default={})
    
    # Stripe
    stripe_enabled = Column(Boolean, default=False)
    stripe_publishable_key = Column(String(255))
    stripe_secret_key = Column(String(255))
    
    # PayPal
    paypal_enabled = Column(Boolean, default=False)
    paypal_client_id = Column(String(255))
    paypal_secret = Column(String(255))
    paypal_mode = Column(String(10), default="sandbox")
    
    # Bank Transfer
    bank_transfer_enabled = Column(Boolean, default=False)
    bank_name = Column(String(255))
    bank_iban = Column(String(50))
    bank_swift = Column(String(20))
    
    # Cash on Delivery
    cod_enabled = Column(Boolean, default=False)
    cod_fee = Column(Numeric(10, 2), default=0)
    
    # Display
    icon = Column(String(255))
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class ShippingZone(Base):
    """Shipping zone"""
    __tablename__ = "shipping_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, nullable=False, default=1)
    
    name = Column(String(100), nullable=False)
    countries = Column(JSON, nullable=False)  # List of ISO country codes
    enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    rates = relationship("ShippingRate", back_populates="zone", cascade="all, delete-orphan")


class ShippingRate(Base):
    """Shipping rate for a zone"""
    __tablename__ = "shipping_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("shipping_zones.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Calculation method: flat_rate, weight_based, price_based, free
    calculation_method = Column(String(20), nullable=False)
    
    # Flat rate
    flat_rate = Column(Numeric(10, 2), default=0)
    
    # Weight based
    min_weight = Column(Numeric(10, 2))
    max_weight = Column(Numeric(10, 2))
    rate_per_kg = Column(Numeric(10, 2))
    
    # Price based
    min_order_amount = Column(Numeric(10, 2))
    max_order_amount = Column(Numeric(10, 2))
    rate_percentage = Column(Numeric(5, 2))
    
    # Free shipping
    free_shipping_min_amount = Column(Numeric(10, 2))
    
    # Settings
    enabled = Column(Boolean, default=True)
    estimated_days_min = Column(Integer)
    estimated_days_max = Column(Integer)
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    zone = relationship("ShippingZone", back_populates="rates")


class TaxRate(Base):
    """Tax rate"""
    __tablename__ = "tax_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, nullable=False, default=1)
    
    name = Column(String(100), nullable=False)
    rate = Column(Numeric(5, 2), nullable=False)  # Percentage
    
    # Location
    country = Column(String(2), nullable=False)
    state = Column(String(100))
    zip_code = Column(String(20))
    
    # Priority and compounding
    priority = Column(Integer, default=1)
    compound = Column(Boolean, default=False)
    
    # Applicability
    apply_to_shipping = Column(Boolean, default=False)
    
    enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class TaxSettings(Base):
    """General tax settings"""
    __tablename__ = "tax_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, nullable=False, default=1)
    
    prices_include_tax = Column(Boolean, default=False)
    calculate_tax_based_on = Column(String(20), default="shipping")
    shipping_tax_class = Column(String(50), default="standard")
    display_prices_in_shop = Column(String(20), default="excluding")
    display_prices_during_cart_checkout = Column(String(20), default="excluding")
    
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class ThemeSettings(Base):
    """Theme customization settings"""
    __tablename__ = "theme_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, nullable=False, default=1)
    
    theme_name = Column(String(100), default="Default")
    dark_mode = Column(Boolean, default=False)
    
    # Colors, typography, layout stored as JSON
    colors = Column(JSON, default={})
    typography = Column(JSON, default={})
    layout = Column(JSON, default={})
    
    # Custom CSS
    custom_css = Column(Text)
    
    # Homepage sections
    show_hero_banner = Column(Boolean, default=True)
    show_featured_products = Column(Boolean, default=True)
    show_categories = Column(Boolean, default=True)
    show_testimonials = Column(Boolean, default=False)
    show_newsletter = Column(Boolean, default=True)
    
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(Integer)
