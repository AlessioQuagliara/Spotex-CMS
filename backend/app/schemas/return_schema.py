"""
Return and refund schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal
from app.models.return_model import ReturnStatus, ReturnReason


class ReturnItemRequest(BaseModel):
    """Return item request"""
    order_item_id: int
    quantity: int = Field(..., ge=1)
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class CreateReturnRequest(BaseModel):
    """Create return request"""
    reason: ReturnReason
    reason_detail: Optional[str] = Field(None, max_length=1000)
    items: List[ReturnItemRequest] = Field(..., min_items=1)
    images: Optional[List[str]] = None  # Image URLs

    class Config:
        from_attributes = True


class UpdateReturnStatusRequest(BaseModel):
    """Update return status"""
    status: ReturnStatus
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    return_tracking_number: Optional[str] = None
    return_shipping_carrier: Optional[str] = None

    class Config:
        from_attributes = True


class ReturnResponse(BaseModel):
    """Return response"""
    id: int
    return_number: str
    order_id: int
    order_number: Optional[str] = None
    status: ReturnStatus
    reason: ReturnReason
    reason_detail: Optional[str] = None
    items: List[Dict[str, Any]]
    refund_amount: Decimal
    return_shipping_carrier: Optional[str] = None
    return_tracking_number: Optional[str] = None
    images: Optional[List[str]] = None
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReturnListResponse(BaseModel):
    """Return list item"""
    id: int
    return_number: str
    order_id: int
    order_number: str
    status: ReturnStatus
    reason: ReturnReason
    refund_amount: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedReturnResponse(BaseModel):
    """Paginated return response"""
    items: List[ReturnListResponse]
    total: int
    page: int
    per_page: int
    pages: int


class ProcessRefundRequest(BaseModel):
    """Process refund request"""
    amount: Optional[Decimal] = None  # If None, refund full amount
    reason: Optional[str] = None

    class Config:
        from_attributes = True
