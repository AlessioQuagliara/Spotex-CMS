"""
Audit log schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AuditLogBase(BaseModel):
    """Base audit log schema"""
    user_id: Optional[int] = None
    action: str
    resource_type: str
    resource_id: Optional[int] = None
    ip_address: str
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogResponse(AuditLogBase):
    """Audit log response schema"""
    id: int
    created_at: datetime
    details: Optional[str] = None
    user_info: Optional[Dict[str, Any]] = None

class AuditLogDetailResponse(AuditLogResponse):
    """Detailed audit log response"""
    details_parsed: Optional[Dict[str, Any]] = None

class UserBasicInfo(BaseModel):
    """Basic user info for audit logs"""
    id: int
    username: str
    email: str
    full_name: str

    class Config:
        from_attributes = True

class PaginatedAuditLogResponse(BaseModel):
    """Paginated audit log response"""
    items: List[AuditLogResponse]
    total: int
    page: int
    per_page: int
    pages: int

class AuditStatsResponse(BaseModel):
    """Audit statistics response"""
    total_logs: int
    unique_users: int
    actions: Dict[str, int]
    resources: Dict[str, int]
    period_days: int
