from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from app.database.database import get_db
from app.repositories.post import PostRepository
from app.schemas.post import PostCreate, PostUpdate, PostResponse

router = APIRouter()
repo = PostRepository()

@router.get("/", response_model=List[PostResponse])
async def read_posts(
    skip: int = 0,
    limit: int = 100,
    published_only: bool = False,
    category_id: Optional[int] = None,
    author_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    if search:
        return await repo.search(db, query=search, skip=skip, limit=limit)
    
    filters = {}
    if published_only:
        filters["is_published"] = True
    if category_id:
        filters["category_id"] = category_id
    if author_id:
        filters["author_id"] = author_id
    
    return await repo.get_multi(db, skip=skip, limit=limit, filters=filters)

@router.get("/published", response_model=List[PostResponse])
async def read_published_posts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    return await repo.get_published(db, skip=skip, limit=limit)

@router.get("/{post_id}", response_model=PostResponse)
async def read_post(post_id: int, db: AsyncSession = Depends(get_db)):
    post = await repo.get(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    return post

@router.get("/slug/{slug}", response_model=PostResponse)
async def read_post_by_slug(slug: str, increment_views: bool = True, db: AsyncSession = Depends(get_db)):
    post = await repo.get_by_slug(db, slug)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if increment_views:
        await repo.increment_views(db, post.id)
    
    return post

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(post: PostCreate, db: AsyncSession = Depends(get_db)):
    # Check unique slug
    existing_post = await repo.get_by_slug(db, slug=post.slug)
    if existing_post:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already exists"
        )
    
    # Set published_at if publishing
    if post.is_published and not post.published_at:
        post.published_at = datetime.utcnow()
    
    return await repo.create(db, obj_in=post)

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post: PostUpdate,
    db: AsyncSession = Depends(get_db)
):
    db_post = await repo.get(db, post_id)
    if not db_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check unique slug if updating
    if post.slug:
        existing_post = await repo.get_by_slug(db, slug=post.slug)
        if existing_post and existing_post.id != post_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slug already exists"
            )
    
    # Set published_at if publishing for the first time
    if post.is_published and not db_post.is_published:
        post.published_at = post.published_at or datetime.utcnow()
    
    return await repo.update(db, db_obj=db_post, obj_in=post)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    post = await repo.get(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    await repo.delete(db, post_id)
    return None

@router.get("/category/{category_id}", response_model=List[PostResponse])
async def read_posts_by_category(
    category_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    return await repo.get_by_category(db, category_id, skip=skip, limit=limit)

@router.post("/{post_id}/view", response_model=PostResponse)
async def increment_post_views(post_id: int, db: AsyncSession = Depends(get_db)):
    post = await repo.increment_views(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    return post