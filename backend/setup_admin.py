#!/usr/bin/env python
"""Setup script to create admin user in database"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.base import BaseModel

async def setup_admin():
    """Create admin user"""
    # Create async engine
    engine = create_async_engine(settings.database_url_async, echo=False)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if admin already exists
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print("✅ Admin user already exists")
            return
        
        # Create admin user
        admin = User(
            email="admin@spotex.local",
            username="admin",
            full_name="Administrator",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_superuser=True
        )
        
        session.add(admin)
        await session.commit()
        print("✅ Admin user created successfully")
        print(f"   Email: admin@spotex.local")
        print(f"   Username: admin")
        print(f"   Password: admin123")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(setup_admin())
