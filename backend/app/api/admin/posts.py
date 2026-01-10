from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.database import get_db
from app.repositories.post import PostRepository
from app.schemas.post import PostCreate, PostUpdate, PostResponse
from app.middleware.auth import get_current_user, require_role
from app.models.user import User

router = APIRouter()
repo = PostRepository()

@router.get("/admin", response_model=List[PostResponse])
async def read_all_posts_admin(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("author"))
):
    # Admin può vedere tutti i post, anche non pubblicati
    return await repo.get_multi(db, skip=skip, limit=limit)

@router.post("/admin", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post_admin(
    post: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("author"))
):
    # Auto-set author_id to current user
    post.author_id = current_user.id
    return await repo.create(db, obj_in=post)