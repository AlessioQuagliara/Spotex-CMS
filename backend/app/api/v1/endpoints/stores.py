"""
Stores management endpoints (multi-tenant)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_superuser, get_current_store_owner
from app.core.security import create_audit_log_entry
from app.models.user import Store, User
from app.schemas.store import *

router = APIRouter()

@router.post("/", response_model=StoreResponse)
async def create_store(
    store_data: StoreCreate,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db)
):
    """Create new store (superuser only)"""
    # Check if domain/slug is unique
    result = await db.execute(
        select(Store).where(
            (Store.domain == store_data.domain) | (Store.slug == store_data.slug)
        )
    )
    existing = result.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store with this domain or slug already exists"
        )
    
    store = Store(
        name=store_data.name,
        slug=store_data.slug,
        domain=store_data.domain,
        description=store_data.description,
        logo_url=store_data.logo_url,
        primary_color=store_data.primary_color or "#007bff",
        settings=json.dumps(store_data.settings) if store_data.settings else None
    )
    
    db.add(store)
    await db.commit()
    await db.refresh(store)
    
    # Audit log
    audit_entry = create_audit_log_entry(
        user_id=current_user.id,
        action="store_create",
        resource_type="store",
        resource_id=store.id,
        details={"name": store.name, "domain": store.domain}
    )
    
    return StoreResponse.from_orm(store)

@router.get("/", response_model=List[StoreResponse])
async def list_stores(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db)
):
    """List all stores (superuser only)"""
    query = select(Store)
    
    if search:
        query = query.where(Store.name.ilike(f"%{search}%"))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    stores = result.scalars().all()
    
    return [StoreResponse.from_orm(store) for store in stores]

@router.get("/{store_id}", response_model=StoreDetailResponse)
async def get_store(
    store_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Get store details"""
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    # Check permissions
    if not current_user.is_superuser and current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    response = StoreDetailResponse.from_orm(store)
    
    # Parse settings
    if store.settings:
        try:
            response.settings_parsed = json.loads(store.settings)
        except:
            response.settings_parsed = {}
    
    return response

@router.put("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: int,
    update_data: StoreUpdate,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Update store"""
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    # Check permissions
    if not current_user.is_superuser and current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        if field == "settings":
            value = json.dumps(value) if value else None
        setattr(store, field, value)
    
    await db.commit()
    await db.refresh(store)
    
    # Audit log
    audit_entry = create_audit_log_entry(
        user_id=current_user.id,
        action="store_update",
        resource_type="store",
        resource_id=store.id,
        details=update_data.dict(exclude_unset=True)
    )
    
    return StoreResponse.from_orm(store)

@router.delete("/{store_id}")
async def delete_store(
    store_id: int,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db)
):
    """Delete store (superuser only)"""
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    await db.delete(store)
    await db.commit()
    
    # Audit log
    audit_entry = create_audit_log_entry(
        user_id=current_user.id,
        action="store_delete",
        resource_type="store",
        resource_id=store_id,
        details={"name": store.name, "domain": store.domain}
    )
    
    return {"message": "Store deleted successfully"}

@router.get("/{store_id}/users", response_model=List[UserBasicResponse])
async def get_store_users(
    store_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Get users for a store"""
    # Check permissions
    if not current_user.is_superuser and current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    result = await db.execute(select(User).where(User.store_id == store_id))
    users = result.scalars().all()
    
    return [UserBasicResponse.from_orm(user) for user in users]

@router.post("/{store_id}/users/{user_id}")
async def assign_user_to_store(
    store_id: int,
    user_id: int,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db)
):
    """Assign user to store (superuser only)"""
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get store
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    user.store_id = store_id
    await db.commit()
    
    # Audit log
    audit_entry = create_audit_log_entry(
        user_id=current_user.id,
        action="user_store_assign",
        resource_type="user",
        resource_id=user.id,
        details={"store_id": store_id, "store_name": store.name}
    )
    
    return {"message": "User assigned to store successfully"}

# Import missing
import json