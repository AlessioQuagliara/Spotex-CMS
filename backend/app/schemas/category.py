from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from .base import BaseSchema

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    
    @field_validator('slug')
    def slug_format(cls, v):
        if ' ' in v:
            v = v.replace(' ', '-')
        return v.lower()

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None

class CategoryResponse(CategoryBase, BaseSchema):
    pass

class CategoryTree(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    subcategories: List['CategoryTree']
    
    model_config = ConfigDict(from_attributes=True)