"""
Simple stats endpoint for CMS dashboard
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.database import get_db
from app.models.post import Post
from app.models.user import User
from app.models.media import Media
from app.models.category import Category

router = APIRouter()


class Stats(BaseModel):
    """CMS statistics"""
    posts: int
    users: int
    media: int
    categories: int


@router.get("/", response_model=Stats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get CMS statistics"""
    
    # Count posts
    posts_result = await db.execute(select(func.count()).select_from(Post))
    posts_count = posts_result.scalar() or 0
    
    # Count users
    users_result = await db.execute(select(func.count()).select_from(User))
    users_count = users_result.scalar() or 0
    
    # Count media
    media_result = await db.execute(select(func.count()).select_from(Media))
    media_count = media_result.scalar() or 0
    
    # Count categories
    categories_result = await db.execute(select(func.count()).select_from(Category))
    categories_count = categories_result.scalar() or 0
    
    return Stats(
        posts=posts_count,
        users=users_count,
        media=media_count,
        categories=categories_count
    )
