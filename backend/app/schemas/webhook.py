"""
Webhook schemas for request/response validation
"""
from typing import Optional, List, Dict
from pydantic import Field, HttpUrl
from app.schemas.base import BaseSchema, TimestampSchema


class WebhookBase(BaseSchema):
    """Base webhook schema"""
    name: str = Field(..., min_length=1, max_length=200)
    url: HttpUrl
    secret: Optional[str] = Field(None, max_length=500)
    is_active: bool = True
    events: List[str] = Field(default_factory=list)
    headers: Optional[Dict[str, str]] = None


class WebhookCreate(WebhookBase):
    """Schema for creating a webhook"""
    pass


class WebhookUpdate(BaseSchema):
    """Schema for updating a webhook"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    url: Optional[HttpUrl] = None
    secret: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    events: Optional[List[str]] = None
    headers: Optional[Dict[str, str]] = None


class WebhookResponse(WebhookBase, TimestampSchema):
    """Schema for webhook response"""
    total_calls: int
    failed_calls: int
    last_called_at: Optional[str]


class WebhookEvent(BaseSchema):
    """Schema for webhook event payload"""
    event: str
    data: dict
    timestamp: str
