"""
Category model for organizing posts
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Category(BaseModel):
    """Category model for post organization"""
    __tablename__ = "categories"
    
    name = Column(String(200), nullable=False, unique=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True)
    
    # Self-referential relationship for hierarchical categories
    parent = relationship("Category", remote_side="Category.id", back_populates="subcategories")
    subcategories = relationship("Category", back_populates="parent")
    
    # Relationship with posts
    posts = relationship("Post", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.name}>"