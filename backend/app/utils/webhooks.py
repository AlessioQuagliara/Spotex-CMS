"""
Webhook trigger utility
"""
import httpx
import hashlib
import hmac
import json
from datetime import datetime
from typing import Dict, Any, Optional
from app.core.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def trigger_webhook(
    webhook_url: str,
    event: str,
    data: Dict[str, Any],
    secret: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None
):
    """
    Trigger webhook with event data
    
    Args:
        webhook_url: Webhook URL to call
        event: Event name (e.g., "post.created")
        data: Event data to send
        secret: Optional webhook secret for signature
        headers: Optional custom headers
    """
    payload = {
        "event": event,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Prepare headers
    request_headers = headers or {}
    request_headers["Content-Type"] = "application/json"
    request_headers["User-Agent"] = f"{settings.APP_NAME}/1.0"
    
    # Add signature if secret provided
    if secret:
        payload_str = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            secret.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
        request_headers["X-Webhook-Signature"] = f"sha256={signature}"
    
    # Send webhook
    try:
        async with httpx.AsyncClient(timeout=settings.WEBHOOK_TIMEOUT) as client:
            response = await client.post(
                webhook_url,
                json=payload,
                headers=request_headers
            )
            response.raise_for_status()
            logger.info(f"Webhook triggered successfully: {event} -> {webhook_url}")
            return True
    except Exception as e:
        logger.error(f"Webhook failed: {event} -> {webhook_url}: {str(e)}")
        return False
