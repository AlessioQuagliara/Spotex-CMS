"""
API keys management endpoints
"""
from datetime import datetime, timedelta
from typing import List, Optional
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.dependencies import get_current_verified_user, check_store_management
from app.core.security import generate_api_key, hash_api_key, create_audit_log_entry
from app.models.user import APIKey, Store
from app.schemas.api_key import *

router = APIRouter()

@router.post("/", response_model=APIKeyResponse)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new API key"""
    # Check permissions
    if key_data.store_id:
        await check_store_management(key_data.store_id, current_user)
    elif not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Store ID required for non-superusers"
        )
    
    # Generate key
    api_key = generate_api_key()
    key_hash = hash_api_key(api_key)
    
    # Set permissions
    if not key_data.permissions:
        # Default permissions based on user role
        from app.core.security import get_user_permissions
        key_data.permissions = get_user_permissions(current_user.role.value)
    
    permissions_json = json.dumps(key_data.permissions)
    
    # Calculate expiry
    expires_at = None
    if key_data.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=key_data.expires_in_days)
    
    # Create API key
    db_key = APIKey(
        store_id=key_data.store_id,
        name=key_data.name,
        key_hash=key_hash,
        permissions=permissions_json,
        expires_at=expires_at,
        created_by=current_user.id
    )
    
    db.add(db_key)
    await db.commit()
    await db.refresh(db_key)
    
    # Audit log
    audit_entry = create_audit_log_entry(
        user_id=current_user.id,
        action="api_key_create",
        resource_type="api_key",
        resource_id=db_key.id,
        details={"name": key_data.name, "store_id": key_data.store_id}
    )
    
    return APIKeyResponse(
        **APIKeyResponse.from_orm(db_key).dict(),
        key=api_key  # Only show on creation
    )

@router.get("/", response_model=List[APIKeyResponse])
async def list_api_keys(
    store_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """List API keys"""
    query = select(APIKey)
    
    # Filter by store if specified
    if store_id:
        if not current_user.can_access_store(store_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this store"
            )
        query = query.where(APIKey.store_id == store_id)
    else:
        # Superusers see all, others see only their store's keys
        if not current_user.is_superuser:
            query = query.where(APIKey.store_id == current_user.store_id)
    
    result = await db.execute(query)
    api_keys = result.scalars().all()
    
    return [APIKeyResponse.from_orm(key) for key in api_keys]

@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(
    key_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Get API key details"""
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check permissions
    if api_key.store_id and not current_user.can_access_store(api_key.store_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if not api_key.store_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return APIKeyResponse.from_orm(api_key)

@router.put("/{key_id}", response_model=APIKeyResponse)
async def update_api_key(
    key_id: int,
    update_data: APIKeyUpdate,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Update API key"""
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check permissions
    if api_key.store_id:
        await check_store_management(api_key.store_id, current_user)
    elif not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        if field == "permissions":
            value = json.dumps(value)
        setattr(api_key, field, value)
    
    await db.commit()
    await db.refresh(api_key)
    
    # Audit log
    audit_entry = create_audit_log_entry(
        user_id=current_user.id,
        action="api_key_update",
        resource_type="api_key",
        resource_id=api_key.id,
        details=update_data.dict(exclude_unset=True)
    )
    
    return APIKeyResponse.from_orm(api_key)

@router.delete("/{key_id}")
async def delete_api_key(
    key_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete API key"""
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check permissions
    if api_key.store_id:
        await check_store_management(api_key.store_id, current_user)
    elif not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await db.delete(api_key)
    await db.commit()
    
    # Audit log
    audit_entry = create_audit_log_entry(
        user_id=current_user.id,
        action="api_key_delete",
        resource_type="api_key",
        resource_id=key_id
    )
    
    return {"message": "API key deleted successfully"}

@router.post("/{key_id}/regenerate", response_model=APIKeyResponse)
async def regenerate_api_key(
    key_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Regenerate API key"""
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check permissions
    if api_key.store_id:
        await check_store_management(api_key.store_id, current_user)
    elif not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Generate new key
    new_api_key = generate_api_key()
    api_key.key_hash = hash_api_key(new_api_key)
    api_key.last_used_at = None  # Reset last used
    
    await db.commit()
    
    # Audit log
    audit_entry = create_audit_log_entry(
        user_id=current_user.id,
        action="api_key_regenerate",
        resource_type="api_key",
        resource_id=api_key.id
    )
    
    return APIKeyResponse(
        **APIKeyResponse.from_orm(api_key).dict(),
        key=new_api_key  # Show new key
    )