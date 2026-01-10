"""Media upload and management endpoints"""
import os
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from PIL import Image

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.media import Media, MediaType
from app.schemas.media import MediaCreate, MediaUpdate, MediaResponse, MediaUploadResponse
from app.schemas.base import PaginatedResponse, MessageResponse

router = APIRouter()

def get_media_type(mime_type: str) -> MediaType:
    """Determine media type from MIME type"""
    if mime_type.startswith("image/"):
        return MediaType.IMAGE
    elif mime_type.startswith("video/"):
        return MediaType.VIDEO
    elif mime_type.startswith("audio/"):
        return MediaType.AUDIO
    elif mime_type in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument"]:
        return MediaType.DOCUMENT
    return MediaType.OTHER

@router.post("/upload", response_model=MediaUploadResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload media file"""
    # Validate file size
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE} bytes"
        )
    
    # Validate extension
    file_ext = Path(file.filename).suffix.lower().lstrip(".")
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = Path(settings.UPLOAD_DIR) / unique_filename
    
    # Create upload directory if not exists
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Get image dimensions if image
    width, height = None, None
    media_type = get_media_type(file.content_type)
    
    if media_type == MediaType.IMAGE:
        try:
            with Image.open(file_path) as img:
                width, height = img.size
        except:
            pass
    
    # Create media record
    db_media = Media(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=unique_filename,
        file_size=file_size,
        mime_type=file.content_type,
        media_type=media_type,
        width=width,
        height=height,
        uploaded_by=current_user.id
    )
    
    db.add(db_media)
    await db.commit()
    await db.refresh(db_media)
    
    return MediaUploadResponse(
        id=db_media.id,
        filename=db_media.filename,
        url=db_media.url,
        file_size=db_media.file_size,
        media_type=db_media.media_type
    )

@router.get("/", response_model=PaginatedResponse)
async def list_media(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    media_type: MediaType = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List media files"""
    from app.schemas.base import PaginationParams
    
    pagination = PaginationParams(page=page, page_size=page_size)
    query = select(Media)
    
    if media_type:
        query = query.where(Media.media_type == media_type)
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get items
    query = query.offset(pagination.offset).limit(pagination.page_size).order_by(Media.created_at.desc())
    result = await db.execute(query)
    media_list = result.scalars().all()
    
    return PaginatedResponse.create(
        items=[MediaResponse.model_validate(m) for m in media_list],
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{media_id}", response_model=MediaResponse)
async def get_media(media_id: int, db: AsyncSession = Depends(get_db)):
    """Get media by ID"""
    result = await db.execute(select(Media).where(Media.id == media_id))
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media

@router.put("/{media_id}", response_model=MediaResponse)
async def update_media(
    media_id: int,
    media_data: MediaUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update media metadata"""
    result = await db.execute(select(Media).where(Media.id == media_id))
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    update_data = media_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(media, field, value)
    
    await db.commit()
    await db.refresh(media)
    return media

@router.delete("/{media_id}", response_model=MessageResponse)
async def delete_media(
    media_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete media"""
    result = await db.execute(select(Media).where(Media.id == media_id))
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Delete file from disk
    file_path = Path(settings.UPLOAD_DIR) / media.file_path
    if file_path.exists():
        file_path.unlink()
    
    await db.delete(media)
    await db.commit()
    return {"message": "Media deleted successfully"}
