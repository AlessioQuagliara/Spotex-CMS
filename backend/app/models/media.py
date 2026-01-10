"""
Media model for file uploads and management
"""
from sqlalchemy import Column, String, Integer, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class MediaType(str, enum.Enum):
    """Media type enumeration"""
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    AUDIO = "audio"
    OTHER = "other"


class Media(BaseModel):
    """Media model for uploaded files"""
    __tablename__ = "media"
    
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False, unique=True)
    file_size = Column(Integer, nullable=False)  # in bytes
    mime_type = Column(String(100), nullable=False)
    media_type = Column(
        SQLEnum(MediaType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    alt_text = Column(String(500), nullable=True)
    caption = Column(String(1000), nullable=True)
    
    # Dimensions for images/videos
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Uploader tracking
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploader = relationship("User")
    
    def __repr__(self):
        return f"<Media {self.filename}>"
    
    @property
    def url(self) -> str:
        """Get file URL"""
        return f"/uploads/{self.file_path}"