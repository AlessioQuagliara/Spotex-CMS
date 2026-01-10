"""
Shipping tracking endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order
from app.utils.shipping_tracker import ShippingTracker

router = APIRouter()


@router.get("/{order_id}/tracking")
async def track_order_shipment(
    order_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Track order shipment"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify access
    if current_user and order.user_id != current_user.id:
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    if not order.tracking_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tracking number not available for this order"
        )
    
    # Get tracking info
    carrier = order.carrier or 'Unknown'
    tracking_data = await ShippingTracker.track_shipment(
        carrier=carrier,
        tracking_number=order.tracking_number
    )
    
    # Add order context
    tracking_data['order_number'] = order.order_number
    tracking_data['order_status'] = order.status
    tracking_data['shipped_at'] = order.shipped_at.isoformat() if order.shipped_at else None
    
    # Get tracking URL
    tracking_url = ShippingTracker.get_carrier_tracking_url(carrier, order.tracking_number)
    if tracking_url:
        tracking_data['tracking_url'] = tracking_url
    
    return tracking_data


@router.get("/{tracking_number}")
async def track_by_tracking_number(
    tracking_number: str,
    carrier: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Track shipment by tracking number (public endpoint)"""
    # Find order with this tracking number
    result = await db.execute(
        select(Order).where(Order.tracking_number == tracking_number)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        # Still try to track if carrier is provided
        if not carrier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found. Please provide carrier name."
            )
    else:
        carrier = order.carrier or carrier
    
    if not carrier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Carrier name required"
        )
    
    # Get tracking info
    tracking_data = await ShippingTracker.track_shipment(
        carrier=carrier,
        tracking_number=tracking_number
    )
    
    # Add order context if found
    if order:
        tracking_data['order_number'] = order.order_number
        tracking_data['order_status'] = order.status
        tracking_data['customer_email'] = order.customer_email
    
    # Get tracking URL
    tracking_url = ShippingTracker.get_carrier_tracking_url(carrier, tracking_number)
    if tracking_url:
        tracking_data['tracking_url'] = tracking_url
    
    return tracking_data


@router.get("/carriers/list")
async def list_supported_carriers():
    """List supported carriers"""
    return {
        'carriers': ShippingTracker.CARRIERS
    }
