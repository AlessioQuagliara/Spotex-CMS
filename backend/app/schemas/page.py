from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from .base import BaseSchema

class PageBase(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    is_published: bool = False
    is_homepage: bool = False
    template: str = "default"
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    
    @field_validator('slug')
    def slug_format(cls, v):
        if ' ' in v:
            v = v.replace(' ', '-')
        return v.lower()

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    is_published: Optional[bool] = None
    is_homepage: Optional[bool] = None
    template: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None

class PageResponse(PageBase, BaseSchema):
    pass