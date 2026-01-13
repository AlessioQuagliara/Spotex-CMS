"""
Post model for blog posts and articles
"""
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import BaseModel


class Post(BaseModel):
    """Post model for blog articles"""
    __tablename__ = "posts"
    
    title = Column(String(500), nullable=False)
    slug = Column(String(500), unique=True, index=True, nullable=False)
    excerpt = Column(Text)
    content = Column(Text, nullable=False)
    featured_image = Column(String(500))
    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    views = Column(Integer, default=0, nullable=False)
    
    # SEO fields
    seo_title = Column(String(500), nullable=True)
    seo_description = Column(Text, nullable=True)
    seo_keywords = Column(Text, nullable=True)
    
    # Foreign keys
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    author = relationship("User", back_populates="posts")
    category = relationship("Category", back_populates="posts")
    translations = relationship("PostTranslation", back_populates="post", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Post {self.title}>"
    
    def increment_views(self):
        """Increment post views count"""
        self.views += 1