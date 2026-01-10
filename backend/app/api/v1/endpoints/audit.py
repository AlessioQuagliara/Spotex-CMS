"""
Audit log endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.sql import and_, or_

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import AuditLog, User
from app.schemas.audit import *

router = APIRouter()

@router.get("/", response_model=PaginatedAuditLogResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[int] = Query(None),
    ip_address: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List audit logs with filtering"""
    # Build query
    query = select(AuditLog)
    
    # Apply filters
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if action:
        filters.append(AuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        filters.append(AuditLog.resource_type == resource_type)
    if resource_id:
        filters.append(AuditLog.resource_id == resource_id)
    if ip_address:
        filters.append(AuditLog.ip_address.ilike(f"%{ip_address}%"))
    if date_from:
        filters.append(AuditLog.created_at >= date_from)
    if date_to:
        filters.append(AuditLog.created_at <= date_to)
    
    if filters:
        query = query.where(and_(*filters))
    
    # For non-superusers, only show logs for their store
    if not current_user.is_superuser and current_user.store_id:
        # This would require joining with users table to filter by store
        # For now, superusers only
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # Get total count
    count_query = query.with_only_columns([AuditLog.id])
    result = await db.execute(count_query)
    total = len(result.all())
    
    # Apply pagination and ordering
    query = query.order_by(desc(AuditLog.created_at))
    query = query.offset((page - 1) * per_page).limit(per_page)
    
    # Execute query
    result = await db.execute(query)
    audit_logs = result.scalars().all()
    
    # Convert to response
    items = []
    for log in audit_logs:
        item = AuditLogResponse.from_orm(log)
        # Add user info if available
        if log.user:
            item.user_info = UserBasicInfo(
                id=log.user.id,
                username=log.user.username,
                email=log.user.email,
                full_name=log.user.full_name
            )
        items.append(item)
    
    return PaginatedAuditLogResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@router.get("/{log_id}", response_model=AuditLogDetailResponse)
async def get_audit_log(
    log_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed audit log entry"""
    result = await db.execute(select(AuditLog).where(AuditLog.id == log_id))
    audit_log = result.scalar_one_or_none()
    
    if not audit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    response = AuditLogDetailResponse.from_orm(audit_log)
    
    # Add user info
    if audit_log.user:
        response.user_info = UserBasicInfo(
            id=audit_log.user.id,
            username=audit_log.user.username,
            email=audit_log.user.email,
            full_name=audit_log.user.full_name
        )
    
    # Parse details JSON
    if audit_log.details:
        try:
            response.details_parsed = json.loads(audit_log.details)
        except:
            response.details_parsed = None
    
    return response

@router.delete("/{log_id}")
async def delete_audit_log(
    log_id: int,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db)
):
    """Delete audit log entry (superuser only)"""
    result = await db.execute(select(AuditLog).where(AuditLog.id == log_id))
    audit_log = result.scalar_one_or_none()
    
    if not audit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    await db.delete(audit_log)
    await db.commit()
    
    return {"message": "Audit log deleted successfully"}

@router.get("/stats/summary", response_model=AuditStatsResponse)
async def get_audit_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get audit log statistics"""
    from sqlalchemy import func
    from datetime import timedelta
    
    date_from = datetime.utcnow() - timedelta(days=days)
    
    # Get action counts
    action_query = select(
        AuditLog.action,
        func.count(AuditLog.id).label('count')
    ).where(
        AuditLog.created_at >= date_from
    ).group_by(AuditLog.action)
    
    result = await db.execute(action_query)
    actions = {row.action: row.count for row in result.all()}
    
    # Get resource type counts
    resource_query = select(
        AuditLog.resource_type,
        func.count(AuditLog.id).label('count')
    ).where(
        AuditLog.created_at >= date_from
    ).group_by(AuditLog.resource_type)
    
    result = await db.execute(resource_query)
    resources = {row.resource_type: row.count for row in result.all()}
    
    # Get total logs
    total_query = select(func.count(AuditLog.id)).where(AuditLog.created_at >= date_from)
    result = await db.execute(total_query)
    total_logs = result.scalar()
    
    # Get unique users
    users_query = select(func.count(func.distinct(AuditLog.user_id))).where(
        AuditLog.created_at >= date_from,
        AuditLog.user_id.isnot(None)
    )
    result = await db.execute(users_query)
    unique_users = result.scalar()
    
    return AuditStatsResponse(
        total_logs=total_logs,
        unique_users=unique_users,
        actions=actions,
        resources=resources,
        period_days=days
    )

# Import missing
from datetime import datetime
import json