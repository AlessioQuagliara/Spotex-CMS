from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from enum import Enum
from .base import BaseSchema

class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    AUTHOR = "author"
    SUBSCRIBER = "subscriber"

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.AUTHOR
    is_active: bool = True
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @field_validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username deve contenere solo lettere, numeri, _ e -')
        return v.lower()

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase, BaseSchema):
    pass

class UserInDB(UserResponse):
    hashed_password: str