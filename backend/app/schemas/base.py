from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Generic, TypeVar, List

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class TimestampSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class MessageResponse(BaseModel):
    message: str

class PaginationParams(BaseModel):
    page: int = 1
    per_page: int = 10

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int