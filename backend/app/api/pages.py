from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.database import get_db
from app.repositories.page import PageRepository
from app.schemas.page import PageCreate, PageUpdate, PageResponse

router = APIRouter()
repo = PageRepository()

@router.get("/", response_model=List[PageResponse])
async def read_pages(
    skip: int = 0,
    limit: int = 100,
    published_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    if published_only:
        return await repo.get_published(db)
    return await repo.get_multi(db, skip=skip, limit=limit)

@router.get("/published", response_model=List[PageResponse])
async def read_published_pages(db: AsyncSession = Depends(get_db)):
    return await repo.get_published(db)

@router.get("/homepage", response_model=PageResponse)
async def read_homepage(db: AsyncSession = Depends(get_db)):
    page = await repo.get_homepage(db)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homepage not found"
        )
    return page

@router.get("/{page_id}", response_model=PageResponse)
async def read_page(page_id: int, db: AsyncSession = Depends(get_db)):
    page = await repo.get(db, page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    return page

@router.get("/slug/{slug}", response_model=PageResponse)
async def read_page_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    page = await repo.get_by_slug(db, slug)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    return page

@router.post("/", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
async def create_page(page: PageCreate, db: AsyncSession = Depends(get_db)):
    # Check unique slug
    existing_page = await repo.get_by_slug(db, slug=page.slug)
    if existing_page:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already exists"
        )
    
    # If setting as homepage, unset any existing homepage
    if page.is_homepage:
        current_homepage = await repo.get_homepage(db)
        if current_homepage:
            current_homepage.is_homepage = False
            await db.commit()
            await db.refresh(current_homepage)
    
    return await repo.create(db, obj_in=page)

@router.put("/{page_id}", response_model=PageResponse)
async def update_page(
    page_id: int,
    page: PageUpdate,
    db: AsyncSession = Depends(get_db)
):
    db_page = await repo.get(db, page_id)
    if not db_page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check unique slug if updating
    if page.slug:
        existing_page = await repo.get_by_slug(db, slug=page.slug)
        if existing_page and existing_page.id != page_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slug already exists"
            )
    
    # If setting as homepage, unset any existing homepage
    if page.is_homepage:
        current_homepage = await repo.get_homepage(db)
        if current_homepage and current_homepage.id != page_id:
            current_homepage.is_homepage = False
            await db.commit()
            await db.refresh(current_homepage)
    
    return await repo.update(db, db_obj=db_page, obj_in=page)

@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(page_id: int, db: AsyncSession = Depends(get_db)):
    page = await repo.get(db, page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    await repo.delete(db, page_id)
    return None