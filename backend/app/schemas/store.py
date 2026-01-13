"""
Store schemas for multi-tenant architecture
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, HttpUrl, Field

class StoreBase(BaseModel):
    """Base store schema"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    domain: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    logo_url: Optional[HttpUrl] = None
    primary_color: str = Field(default="#007bff", pattern="^#[0-9A-Fa-f]{6}$")
    is_active: bool = True

    class Config:
        from_attributes = True

class StoreCreate(StoreBase):
    """Store creation schema"""
    settings: Optional[Dict[str, Any]] = None

class StoreUpdate(BaseModel):
    """Store update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    domain: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    logo_url: Optional[HttpUrl] = None
    primary_color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    is_active: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class StoreResponse(StoreBase):
    """Store response schema"""
    id: int
    created_at: datetime
    updated_at: datetime

class StoreDetailResponse(StoreResponse):
    """Detailed store response with parsed settings"""
    settings_parsed: Optional[Dict[str, Any]] = None

class UserBasicResponse(BaseModel):
    """Basic user info for store staff listing"""
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True
