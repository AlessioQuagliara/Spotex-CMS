from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import os
import uuid
from pathlib import Path
from app.database.database import get_db
from app.repositories.media import MediaRepository, MediaType
from app.schemas.media import MediaCreate, MediaResponse
import shutil

router = APIRouter()
repo = MediaRepository()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def save_upload_file(upload_file: UploadFile, destination: Path) -> str:
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return str(destination.relative_to(UPLOAD_DIR))

@router.get("/", response_model=List[MediaResponse])
async def read_media(
    skip: int = 0,
    limit: int = 100,
    media_type: Optional[MediaType] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    if search:
        return await repo.search(db, query=search, skip=skip, limit=limit)
    
    if media_type:
        return await repo.get_by_type(db, media_type=media_type, skip=skip, limit=limit)
    
    return await repo.get_multi(db, skip=skip, limit=limit)

@router.get("/{media_id}", response_model=MediaResponse)
async def read_media_item(media_id: int, db: AsyncSession = Depends(get_db)):
    media = await repo.get(db, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    return media

@router.post("/upload", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    # Validate file size (max 10MB)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10MB."
        )
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Create year/month directory structure
    from datetime import datetime
    now = datetime.now()
    year_month_dir = UPLOAD_DIR / str(now.year) / f"{now.month:02d}"
    year_month_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = save_upload_file(file, year_month_dir / unique_filename)
    
    # Determine media type from MIME type
    mime_type = file.content_type or "application/octet-stream"
    
    if mime_type.startswith("image/"):
        media_type = MediaType.IMAGE
        # TODO: Get image dimensions
        width, height = None, None
    elif mime_type.startswith("video/"):
        media_type = MediaType.VIDEO
        width, height = None, None
    elif mime_type.startswith("audio/"):
        media_type = MediaType.AUDIO
        width, height = None, None
    else:
        media_type = MediaType.DOCUMENT
        width, height = None, None
    
    # Create media record
    media_data = MediaCreate(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        media_type=media_type,
        alt_text=alt_text,
        caption=caption,
        width=width,
        height=height
    )
    
    return await repo.create(db, obj_in=media_data)

@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(media_id: int, db: AsyncSession = Depends(get_db)):
    media = await repo.get(db, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    # Delete file from filesystem
    file_path = UPLOAD_DIR / media.file_path
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    await repo.delete(db, media_id)
    return None