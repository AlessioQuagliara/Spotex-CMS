"""
Internationalization models for multi-language content
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


class LanguageCode(str, enum.Enum):
    """Supported language codes (ISO 639-1)"""
    EN = "en"  # English
    IT = "it"  # Italian
    ES = "es"  # Spanish
    FR = "fr"  # French
    DE = "de"  # German
    PT = "pt"  # Portuguese
    AR = "ar"  # Arabic (RTL)
    HE = "he"  # Hebrew (RTL)
    ZH = "zh"  # Chinese
    JA = "ja"  # Japanese
    RU = "ru"  # Russian


class Direction(str, enum.Enum):
    """Text direction"""
    LTR = "ltr"  # Left to Right
    RTL = "rtl"  # Right to Left


class Language(BaseModel):
    """Language configuration"""
    __tablename__ = "languages"
    
    code = Column(String(5), unique=True, nullable=False, index=True)  # ISO 639-1
    name = Column(String(100), nullable=False)
    native_name = Column(String(100), nullable=False)
    direction = Column(SQLEnum(Direction), default=Direction.LTR)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    flag_emoji = Column(String(10))
    
    # Relationships
    post_translations = relationship("PostTranslation", back_populates="language", cascade="all, delete-orphan")
    category_translations = relationship("CategoryTranslation", back_populates="language", cascade="all, delete-orphan")
    page_translations = relationship("PageTranslation", back_populates="language", cascade="all, delete-orphan")


class PostTranslation(BaseModel):
    """Post translations"""
    __tablename__ = "post_translations"
    
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    language_code = Column(String(5), ForeignKey("languages.code", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, index=True)
    content = Column(Text, nullable=False)
    excerpt = Column(Text)
    meta_title = Column(String(200))
    meta_description = Column(String(300))
    
    # Relationships
    post = relationship("Post", back_populates="translations")
    language = relationship("Language", back_populates="post_translations")
    
    __table_args__ = (
        {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"}
    )


class CategoryTranslation(BaseModel):
    """Category translations"""
    __tablename__ = "category_translations"
    
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    language_code = Column(String(5), ForeignKey("languages.code", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    
    # Relationships
    category = relationship("Category", back_populates="translations")
    language = relationship("Language", back_populates="category_translations")


class PageTranslation(BaseModel):
    """Page translations"""
    __tablename__ = "page_translations"
    
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    language_code = Column(String(5), ForeignKey("languages.code", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, index=True)
    content = Column(Text, nullable=False)
    meta_title = Column(String(200))
    meta_description = Column(String(300))
    
    # Relationships
    page = relationship("Page", back_populates="translations")
    language = relationship("Language", back_populates="page_translations")


class Translation(BaseModel):
    """UI translations (labels, buttons, messages)"""
    __tablename__ = "translations"
    
    key = Column(String(200), nullable=False, index=True)
    language_code = Column(String(5), ForeignKey("languages.code", ondelete="CASCADE"), nullable=False)
    value = Column(Text, nullable=False)
    namespace = Column(String(100), default="common")  # common, auth, admin, etc.
    
    # Relationship
    language = relationship("Language")
    
    __table_args__ = (
        {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"}
    )


class CurrencyRate(BaseModel):
    """Currency exchange rates"""
    __tablename__ = "currency_rates"
    
    from_currency = Column(String(3), nullable=False, index=True)  # USD, EUR, GBP
    to_currency = Column(String(3), nullable=False, index=True)
    rate = Column(String(20), nullable=False)  # Stored as string for precision
    source = Column(String(50), default="manual")  # manual, api, ecb
    
    __table_args__ = (
        {"mysql_charset": "utf8mb4"}
    )
