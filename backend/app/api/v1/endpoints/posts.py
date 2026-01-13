"""
Posts CRUD endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostListResponse
from app.schemas.base import PaginationParams, PaginatedResponse, MessageResponse


router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    category_id: int = Query(None),
    is_published: bool = Query(None),
    author_id: int = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List posts with pagination and filters"""
    pagination = PaginationParams(page=page, page_size=page_size)
    
    query = select(Post).options(joinedload(Post.author), joinedload(Post.category))
    
    if search:
        query = query.where(
            or_(
                Post.title.ilike(f"%{search}%"),
                Post.content.ilike(f"%{search}%"),
                Post.excerpt.ilike(f"%{search}%")
            )
        )
    
    if category_id:
        query = query.where(Post.category_id == category_id)
    
    if is_published is not None:
        query = query.where(Post.is_published == is_published)
    
    if author_id:
        query = query.where(Post.author_id == author_id)
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get items
    query = query.offset(pagination.offset).limit(pagination.page_size).order_by(Post.created_at.desc())
    result = await db.execute(query)
    posts = result.scalars().all()
    
    return PaginatedResponse.create(
        items=[PostListResponse.model_validate(post) for post in posts],
        total=total,
        page=page,
        page_size=page_size
    )


# Dashboard endpoint - MUST be before /{post_id} to avoid route conflict
@router.get("/recent", response_model=List[PostListResponse])
async def get_recent_posts(
    limit: int = Query(default=5, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Get recent posts for dashboard"""
    result = await db.execute(
        select(Post)
        .options(joinedload(Post.author))
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    posts = result.scalars().all()
    
    return [
        PostListResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            featured_image=post.featured_image,
            is_published=post.is_published,
            published_at=post.published_at,
            author_id=post.author_id,
            category_id=post.category_id,
            views=post.views if hasattr(post, 'views') else 0,
            created_at=post.created_at,
            updated_at=post.updated_at
        )
        for post in posts
    ]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get post by ID"""
    result = await db.execute(
        select(Post).options(joinedload(Post.author), joinedload(Post.category))
        .where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Increment views
    post.increment_views()
    await db.commit()
    
    return post


@router.get("/slug/{slug}", response_model=PostResponse)
async def get_post_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get post by slug"""
    result = await db.execute(
        select(Post).options(joinedload(Post.author), joinedload(Post.category))
        .where(Post.slug == slug)
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    post.increment_views()
    await db.commit()
    
    return post


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new post"""
    # Check if slug exists
    result = await db.execute(select(Post).where(Post.slug == post_data.slug))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post with this slug already exists"
        )
    
    # Create post
    db_post = Post(
        **post_data.model_dump(),
        author_id=current_user.id
    )
    
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    
    return db_post


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update post"""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Check permissions
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Update fields
    update_data = post_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
    
    await db.commit()
    await db.refresh(post)
    
    return post


@router.delete("/{post_id}", response_model=MessageResponse)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete post"""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await db.delete(post)
    await db.commit()
    
    return {"message": "Post deleted successfully"}


