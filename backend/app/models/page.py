"""
Page model for static pages
"""
from sqlalchemy import Column, String, Text, Boolean, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Page(BaseModel):
    """Page model for static content pages"""
    __tablename__ = "pages"
    
    title = Column(String(500), nullable=False)
    slug = Column(String(500), unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    is_homepage = Column(Boolean, default=False, nullable=False)
    template = Column(String(100), default="default", nullable=False)
    order = Column(Integer, default=0, nullable=False)
    
    # SEO fields
    seo_title = Column(String(500), nullable=True)
    seo_description = Column(Text, nullable=True)
    seo_keywords = Column(Text, nullable=True)
    
    # Relationships
    translations = relationship("PageTranslation", back_populates="page", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Page {self.title}>"