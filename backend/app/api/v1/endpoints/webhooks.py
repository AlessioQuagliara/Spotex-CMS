"""Webhooks management endpoints"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.webhook import Webhook
from app.schemas.webhook import WebhookCreate, WebhookUpdate, WebhookResponse
from app.schemas.base import MessageResponse

router = APIRouter()

@router.get("/", response_model=List[WebhookResponse])
async def list_webhooks(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all webhooks (admin only)"""
    result = await db.execute(select(Webhook))
    webhooks = result.scalars().all()
    return webhooks

@router.get("/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(
    webhook_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get webhook by ID"""
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook

@router.post("/", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    webhook_data: WebhookCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create webhook"""
    db_webhook = Webhook(**webhook_data.model_dump())
    db.add(db_webhook)
    await db.commit()
    await db.refresh(db_webhook)
    return db_webhook

@router.put("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: int,
    webhook_data: WebhookUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update webhook"""
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    update_data = webhook_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(webhook, field, value)
    
    await db.commit()
    await db.refresh(webhook)
    return webhook

@router.delete("/{webhook_id}", response_model=MessageResponse)
async def delete_webhook(
    webhook_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete webhook"""
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    await db.delete(webhook)
    await db.commit()
    return {"message": "Webhook deleted successfully"}
