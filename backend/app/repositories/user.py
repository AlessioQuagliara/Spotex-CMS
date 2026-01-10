from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from .base import BaseRepository
import bcrypt

class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    def __init__(self):
        super().__init__(User)
    
    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        # Ensure password doesn't exceed bcrypt's 72 byte limit
        password_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash."""
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    
    async def create(self, db: AsyncSession, obj_in: UserCreate) -> User:
        obj_in_data = obj_in.model_dump()
        # Hash password
        if 'password' in obj_in_data:
            password = obj_in_data.pop('password')
            obj_in_data['hashed_password'] = self._hash_password(password)
        
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        stmt = select(self.model).filter(self.model.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        stmt = select(self.model).filter(self.model.username == username)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def authenticate(self, db: AsyncSession, username: str, password: str) -> Optional[User]:
        user = await self.get_by_username(db, username)
        if not user:
            user = await self.get_by_email(db, username)
        
        if not user or not self._verify_password(password, user.hashed_password):
            return None
        return user
    
    async def update(self, db: AsyncSession, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Hash new password if provided
        if 'password' in update_data:
            update_data['hashed_password'] = self._hash_password(update_data.pop('password'))
        
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj