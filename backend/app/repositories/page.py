from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.models.page import Page
from app.schemas.page import PageCreate, PageUpdate
from .base import BaseRepository

class PageRepository(BaseRepository[Page, PageCreate, PageUpdate]):
    def __init__(self):
        super().__init__(Page)
    
    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Page]:
        result = await db.execute(select(self.model).filter(self.model.slug == slug))
        return result.scalar_one_or_none()
    
    async def get_published(self, db: AsyncSession) -> List[Page]:
        result = await db.execute(
            select(self.model).filter(self.model.is_published == True)
        )
        return result.scalars().all()
    
    async def get_homepage(self, db: AsyncSession) -> Optional[Page]:
        result = await db.execute(
            select(self.model).filter(self.model.is_homepage == True)
        )
        return result.scalar_one_or_none()