"""
Sessions management endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.dependencies import get_current_verified_user
from app.models.user import UserSession
from app.schemas.session import *

router = APIRouter()

@router.get("/", response_model=List[SessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """List user sessions"""
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == current_user.id)
        .order_by(desc(UserSession.created_at))
    )
    sessions = result.scalars().all()
    
    return [SessionResponse.from_orm(session) for session in sessions]

@router.delete("/{session_token}")
async def revoke_session(
    session_token: str,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke specific session"""
    result = await db.execute(
        select(UserSession).where(
            UserSession.session_token == session_token,
            UserSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    await db.delete(session)
    await db.commit()
    
    return {"message": "Session revoked successfully"}

@router.delete("/")
async def revoke_all_sessions(
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke all user sessions except current"""
    # Get current session token from request context
    # This would need to be passed or extracted from headers
    # For now, revoke all sessions
    
    result = await db.execute(
        select(UserSession).where(UserSession.user_id == current_user.id)
    )
    sessions = result.scalars().all()
    
    for session in sessions:
        await db.delete(session)
    
    await db.commit()
    
    return {"message": "All sessions revoked successfully"}