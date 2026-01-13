from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from .base import BaseSchema

class PostBase(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    featured_image: Optional[str] = None
    is_published: bool = False
    published_at: Optional[datetime] = None
    
    @field_validator('slug')
    def slug_format(cls, v):
        if ' ' in v:
            v = v.replace(' ', '-')
        return v.lower()

class PostCreate(PostBase):
    author_id: int
    category_id: Optional[int] = None

class PostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    featured_image: Optional[str] = None
    is_published: Optional[bool] = None
    published_at: Optional[datetime] = None
    author_id: Optional[int] = None
    category_id: Optional[int] = None

class PostResponse(PostBase, BaseSchema):
    author_id: int
    category_id: Optional[int] = None
    views: int = 0

class PostListResponse(BaseModel):
    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    author_id: int
    category_id: Optional[int] = None
    views: int = 0
    created_at: datetime
    updated_at: datetime