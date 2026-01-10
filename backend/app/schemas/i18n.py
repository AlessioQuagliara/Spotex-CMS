"""
Internationalization schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class DirectionEnum(str, Enum):
    LTR = "ltr"
    RTL = "rtl"


class LanguageBase(BaseModel):
    code: str = Field(..., max_length=5, description="ISO 639-1 language code")
    name: str = Field(..., max_length=100)
    native_name: str = Field(..., max_length=100)
    direction: DirectionEnum = DirectionEnum.LTR
    is_default: bool = False
    is_active: bool = True
    flag_emoji: Optional[str] = None


class LanguageCreate(LanguageBase):
    pass


class LanguageUpdate(BaseModel):
    name: Optional[str] = None
    native_name: Optional[str] = None
    direction: Optional[DirectionEnum] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    flag_emoji: Optional[str] = None


class Language(LanguageBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PostTranslationBase(BaseModel):
    language_code: str
    title: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=200)
    content: str
    excerpt: Optional[str] = None
    meta_title: Optional[str] = Field(None, max_length=200)
    meta_description: Optional[str] = Field(None, max_length=300)


class PostTranslationCreate(PostTranslationBase):
    post_id: int


class PostTranslationUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class PostTranslation(PostTranslationBase):
    id: int
    post_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CategoryTranslationBase(BaseModel):
    language_code: str
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    description: Optional[str] = None


class CategoryTranslationCreate(CategoryTranslationBase):
    category_id: int


class CategoryTranslation(CategoryTranslationBase):
    id: int
    category_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PageTranslationBase(BaseModel):
    language_code: str
    title: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=200)
    content: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class PageTranslationCreate(PageTranslationBase):
    page_id: int


class PageTranslation(PageTranslationBase):
    id: int
    page_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TranslationBase(BaseModel):
    key: str = Field(..., max_length=200)
    language_code: str
    value: str
    namespace: str = "common"


class TranslationCreate(TranslationBase):
    pass


class TranslationUpdate(BaseModel):
    value: Optional[str] = None
    namespace: Optional[str] = None


class Translation(TranslationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TranslationImport(BaseModel):
    """Bulk import translations"""
    language_code: str
    namespace: str = "common"
    translations: Dict[str, str]


class CurrencyRateBase(BaseModel):
    from_currency: str = Field(..., max_length=3, description="ISO 4217 currency code")
    to_currency: str = Field(..., max_length=3)
    rate: str = Field(..., description="Exchange rate as string for precision")
    source: str = "manual"


class CurrencyRateCreate(CurrencyRateBase):
    pass


class CurrencyRateUpdate(BaseModel):
    rate: Optional[str] = None
    source: Optional[str] = None


class CurrencyRate(CurrencyRateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CurrencyConversion(BaseModel):
    """Currency conversion request/response"""
    amount: float
    from_currency: str
    to_currency: str
    converted_amount: Optional[float] = None
    rate: Optional[str] = None


class LanguageList(BaseModel):
    """List of languages with pagination"""
    items: List[Language]
    total: int
    page: int
    limit: int
