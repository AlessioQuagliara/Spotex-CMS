# Pydantic schemas for authentication and authorization

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator, HttpUrl
from enum import Enum

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    STORE_OWNER = "store_owner"
    STAFF = "staff"
    CUSTOMER = "customer"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class TwoFactorMethod(str, Enum):
    NONE = "none"
    TOTP = "totp"
    SMS = "sms"
    EMAIL = "email"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

class TimestampSchema(BaseSchema):
    created_at: datetime
    updated_at: datetime

# User schemas
class UserBase(BaseSchema):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole = UserRole.CUSTOMER
    status: UserStatus = UserStatus.ACTIVE
    is_active: bool = True
    is_verified: bool = False

class UserCreate(BaseSchema):
    email: EmailStr
    username: str
    full_name: str
    password: str
    role: Optional[UserRole] = UserRole.CUSTOMER
    store_id: Optional[int] = None

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserUpdate(BaseSchema):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    is_active: Optional[bool] = None
    store_id: Optional[int] = None

class UserResponse(UserBase, TimestampSchema):
    id: int
    last_login_at: Optional[datetime] = None
    email_verified_at: Optional[datetime] = None
    two_factor_method: TwoFactorMethod = TwoFactorMethod.NONE

class UserBasicResponse(BaseSchema):
    id: int
    username: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool

# Authentication schemas
class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    session_token: Optional[str] = None
    requires_2fa: bool = False

class RefreshTokenRequest(BaseSchema):
    refresh_token: str

class MagicLinkRequest(BaseSchema):
    email: EmailStr

class MagicLinkResponse(BaseSchema):
    message: str

class TwoFactorSetupRequest(BaseSchema):
    method: str  # "totp", "sms", "email"

class TwoFactorSetupResponse(BaseSchema):
    method: str
    secret: str
    qr_code: str
    backup_codes: List[str]

class TwoFactorVerify(BaseSchema):
    temp_token: str
    code: str

class TwoFactorEnableRequest(BaseSchema):
    code: str
    method: Optional[str] = None

class TwoFactorDisableRequest(BaseSchema):
    password: str

class TwoFactorStatusResponse(BaseSchema):
    enabled: bool
    method: str
    has_backup_codes: bool

class UpdatePasswordRequest(BaseSchema):
    current_password: str
    new_password: str

    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class ForgotPasswordRequest(BaseSchema):
    email: EmailStr

class ResetPasswordRequest(BaseSchema):
    token: str
    new_password: str

    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

# Store schemas
class StoreBase(BaseSchema):
    name: str
    slug: str
    domain: str
    description: Optional[str] = None
    logo_url: Optional[HttpUrl] = None
    primary_color: str = "#007bff"
    is_active: bool = True

class StoreCreate(StoreBase):
    settings: Optional[Dict[str, Any]] = None

class StoreUpdate(BaseSchema):
    name: Optional[str] = None
    slug: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[HttpUrl] = None
    primary_color: Optional[str] = None
    is_active: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None

class StoreResponse(StoreBase, TimestampSchema):
    id: int

class StoreDetailResponse(StoreResponse):
    settings_parsed: Optional[Dict[str, Any]] = None

# API Key schemas
class APIKeyBase(BaseSchema):
    name: str
    permissions: List[str]
    expires_in_days: Optional[int] = None

class APIKeyCreate(APIKeyBase):
    store_id: Optional[int] = None

class APIKeyUpdate(BaseSchema):
    name: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

class APIKeyResponse(BaseSchema):
    id: int
    name: str
    permissions: List[str]
    is_active: bool
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    key: Optional[str] = None  # Only shown on creation

# Session schemas
class SessionResponse(BaseSchema):
    session_token: str
    ip_address: str
    user_agent: Optional[str] = None
    expires_at: datetime
    created_at: datetime

# Audit log schemas
class AuditLogBase(BaseSchema):
    user_id: Optional[int] = None
    action: str
    resource_type: str
    resource_id: Optional[int] = None
    ip_address: str
    user_agent: Optional[str] = None

class AuditLogResponse(AuditLogBase, TimestampSchema):
    id: int
    details: Optional[str] = None

class AuditLogDetailResponse(AuditLogResponse):
    details_parsed: Optional[Dict[str, Any]] = None
    user_info: Optional[Dict[str, Any]] = None

class UserBasicInfo(BaseSchema):
    id: int
    username: str
    email: str
    full_name: str

class PaginatedAuditLogResponse(BaseSchema):
    items: List[AuditLogResponse]
    total: int
    page: int
    per_page: int
    pages: int

class AuditStatsResponse(BaseSchema):
    total_logs: int
    unique_users: int
    actions: Dict[str, int]
    resources: Dict[str, int]
    period_days: int