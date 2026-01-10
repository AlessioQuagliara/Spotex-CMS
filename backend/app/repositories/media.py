from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.models.media import Media, MediaType
from app.schemas.media import MediaCreate, MediaResponse
from .base import BaseRepository

class MediaRepository(BaseRepository[Media, MediaCreate, MediaResponse]):
    def __init__(self):
        super().__init__(Media)
    
    async def get_by_type(
        self, 
        db: AsyncSession, 
        media_type: MediaType,
        skip: int = 0,
        limit: int = 100
    ) -> List[Media]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.media_type == media_type)
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
    ) -> List[Media]:
        result = await db.execute(
            select(self.model)
            .filter(
                self.model.filename.ilike(f"%{query}%") |
                self.model.original_filename.ilike(f"%{query}%") |
                self.model.alt_text.ilike(f"%{query}%")
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()