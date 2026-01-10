"""
API Key schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class APIKeyBase(BaseModel):
    """Base API key schema"""
    name: str = Field(..., min_length=1, max_length=255)
    permissions: List[str] = Field(default_factory=list)
    expires_in_days: Optional[int] = Field(None, ge=1, le=3650)

    class Config:
        from_attributes = True

class APIKeyCreate(APIKeyBase):
    """API key creation schema"""
    store_id: Optional[int] = None

class APIKeyUpdate(BaseModel):
    """API key update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class APIKeyResponse(BaseModel):
    """API key response schema"""
    id: int
    name: str
    permissions: List[str]
    is_active: bool
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    key: Optional[str] = None  # Only shown on creation

    class Config:
        from_attributes = True
