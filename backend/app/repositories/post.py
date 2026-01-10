from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any, List
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate
from .base import BaseRepository

class PostRepository(BaseRepository[Post, PostCreate, PostUpdate]):
    def __init__(self):
        super().__init__(Post)
    
    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Post]:
        result = await db.execute(select(self.model).filter(self.model.slug == slug))
        return result.scalar_one_or_none()
    
    async def get_published(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Post]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.is_published == True)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_by_category(
        self, 
        db: AsyncSession, 
        category_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Post]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.category_id == category_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def search(
        self,
        db: AsyncSession,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Post]:
        result = await db.execute(
            select(self.model)
            .filter(
                self.model.title.ilike(f"%{query}%") |
                self.model.content.ilike(f"%{query}%") |
                self.model.excerpt.ilike(f"%{query}%")
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def increment_views(self, db: AsyncSession, post_id: int) -> Post:
        post = await self.get(db, post_id)
        if post:
            post.views += 1
            await db.commit()
            await db.refresh(post)
        return post