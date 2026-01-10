"""
Webhook model for external integrations
"""
from sqlalchemy import Column, String, Text, Boolean, JSON, Integer
from app.models.base import BaseModel


class Webhook(BaseModel):
    """Webhook model for external integrations"""
    __tablename__ = "webhooks"
    
    name = Column(String(200), nullable=False)
    url = Column(String(1000), nullable=False)
    secret = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Events to trigger webhook (e.g., post.created, post.updated)
    events = Column(JSON, nullable=False, default=list)
    
    # Headers to send with webhook request
    headers = Column(JSON, nullable=True)
    
    # Statistics
    total_calls = Column(Integer, default=0, nullable=False)
    failed_calls = Column(Integer, default=0, nullable=False)
    last_called_at = Column(String(100), nullable=True)
    
    def __repr__(self):
        return f"<Webhook {self.name}>"
