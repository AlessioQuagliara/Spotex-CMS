"""
Session schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SessionResponse(BaseModel):
    """Session response schema"""
    session_token: str
    ip_address: str
    user_agent: Optional[str] = None
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
