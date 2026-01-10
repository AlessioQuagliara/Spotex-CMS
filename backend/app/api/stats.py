from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.database import get_db
from app.models.post import Post
from app.models.user import User
from app.models.media import Media
from app.models.category import Category
from app.utils.cache import cache_response
from pydantic import BaseModel

router = APIRouter()

class Stats(BaseModel):
    posts: int
    users: int
    media: int
    categories: int

@router.get("/stats", response_model=Stats)
@cache_response(prefix="stats", ttl=600)  # Cache per 10 minuti
async def get_stats(db: AsyncSession = Depends(get_db)):
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
    
    return {
        "posts": posts_count,
        "users": users_count,
        "media": media_count,
        "categories": categories_count
    }
