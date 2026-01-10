"""Pages CRUD endpoints"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.page import Page
from app.schemas.page import PageCreate, PageUpdate, PageResponse
from app.schemas.base import PaginatedResponse, MessageResponse

router = APIRouter()

@router.get("/", response_model=List[PageResponse])
async def list_pages(
    is_published: bool = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List all pages"""
    query = select(Page).order_by(Page.order)
    
    if is_published is not None:
        query = query.where(Page.is_published == is_published)
    
    result = await db.execute(query)
    pages = result.scalars().all()
    return pages

@router.get("/{page_id}", response_model=PageResponse)
async def get_page(page_id: int, db: AsyncSession = Depends(get_db)):
    """Get page by ID"""
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.get("/slug/{slug}", response_model=PageResponse)
async def get_page_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get page by slug"""
    result = await db.execute(select(Page).where(Page.slug == slug))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.post("/", response_model=PageResponse, status_code=201)
async def create_page(
    page_data: PageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create page"""
    db_page = Page(**page_data.model_dump())
    db.add(db_page)
    await db.commit()
    await db.refresh(db_page)
    return db_page

@router.put("/{page_id}", response_model=PageResponse)
async def update_page(
    page_id: int,
    page_data: PageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update page"""
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = page_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(page, field, value)
    
    await db.commit()
    await db.refresh(page)
    return page

@router.delete("/{page_id}", response_model=MessageResponse)
async def delete_page(
    page_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete page"""
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    await db.delete(page)
    await db.commit()
    return {"message": "Page deleted successfully"}
