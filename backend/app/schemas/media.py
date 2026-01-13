from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum
from .base import BaseSchema

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    AUDIO = "audio"

class MediaBase(BaseModel):
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    media_type: MediaType
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None

class MediaCreate(MediaBase):
    filename: str

class MediaUpdate(BaseModel):
    alt_text: Optional[str] = None
    caption: Optional[str] = None

class MediaResponse(MediaBase, BaseSchema):
    filename: str

class MediaUploadResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    url: str
    file_size: int
    mime_type: str
    media_type: MediaType