"""
Analytics API endpoints - Google Analytics integration
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import httpx
import json
import os

from app.database.database import get_db
from app.models.post import Post
from app.models.user import User
from app.models.settings import StoreSettings
from app.utils.cache import redis_client

router = APIRouter()


class AnalyticsEvent(BaseModel):
    """Analytics event data"""
    event_name: str
    event_params: Dict[str, Any] = {}
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    page_url: Optional[str] = None
    referrer: Optional[str] = None
    timestamp: Optional[datetime] = None


class AnalyticsConfig(BaseModel):
    """Analytics configuration"""
    google_analytics_id: Optional[str] = None
    google_ads_id: Optional[str] = None
    facebook_pixel_id: Optional[str] = None
    enable_tracking: bool = True
    enable_ecommerce: bool = True
    enable_custom_events: bool = True
    cookie_consent_required: bool = True
    anonymize_ip: bool = True


class AnalyticsReport(BaseModel):
    """Analytics report data"""
    period: str
    total_visitors: int
    total_pageviews: int
    unique_visitors: int
    bounce_rate: float
    avg_session_duration: float
    top_pages: List[Dict[str, Any]]
    top_referrers: List[Dict[str, Any]]
    device_breakdown: Dict[str, int]
    geographic_data: Dict[str, int]


@router.post("/events")
async def track_event(
    event: AnalyticsEvent,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Track analytics event
    Stores locally and optionally sends to external services
    """
    # Store event locally (simplified - in production use proper analytics table)
    event_data = {
        "event_name": event.event_name,
        "event_params": event.event_params,
        "user_id": event.user_id,
        "session_id": event.session_id,
        "user_agent": event.user_agent,
        "ip_address": event.ip_address,
        "page_url": event.page_url,
        "referrer": event.referrer,
        "timestamp": event.timestamp or datetime.utcnow(),
    }

    # Cache event for batch processing
    redis_key = f"analytics:events:{datetime.utcnow().strftime('%Y%m%d%H')}"
    redis_client.lpush(redis_key, json.dumps(event_data))
    redis_client.expire(redis_key, 86400)  # 24 hours

    # Send to Google Analytics in background
    background_tasks.add_task(send_to_google_analytics, event_data)
    
    # Send to Facebook Pixel if configured
    background_tasks.add_task(send_to_facebook_pixel, event_data)

    return {"status": "success"}


@router.get("/reports/overview")
async def get_analytics_overview(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get analytics overview report
    """
    # Get date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Mock data - in production integrate with GA4 API
    report = {
        "period": f"{days} days",
        "total_visitors": 12543,
        "total_pageviews": 45231,
        "unique_visitors": 8921,
        "bounce_rate": 0.34,
        "avg_session_duration": 245.5,  # seconds
        "top_pages": [
            {"page": "/blog", "views": 5432, "bounce_rate": 0.25},
            {"page": "/products", "views": 4321, "bounce_rate": 0.31},
            {"page": "/about", "views": 3210, "bounce_rate": 0.28},
        ],
        "top_referrers": [
            {"referrer": "google.com", "visits": 3456},
            {"referrer": "facebook.com", "visits": 2345},
            {"referrer": "twitter.com", "visits": 1234},
        ],
        "device_breakdown": {
            "desktop": 5678,
            "mobile": 4321,
            "tablet": 1542,
        },
        "geographic_data": {
            "Italy": 6789,
            "Germany": 2345,
            "France": 1234,
            "Spain": 987,
        }
    }

    return report


@router.get("/reports/content")
async def get_content_analytics(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get content performance analytics
    """
    # Get posts with view counts
    posts = db.query(Post).filter(
        Post.is_published == True,
        Post.created_at >= datetime.utcnow() - timedelta(days=days)
    ).order_by(desc(Post.views)).limit(20).all()

    content_data = []
    for post in posts:
        content_data.append({
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "views": post.views,
            "published_at": post.published_at,
            "category": post.category.name if post.category else None,
            "author": post.author.username if post.author else None,
        })

    return {
        "period": f"{days} days",
        "content_performance": content_data,
        "total_posts": len(content_data),
        "avg_views_per_post": sum(p["views"] for p in content_data) / len(content_data) if content_data else 0,
    }


@router.get("/reports/ecommerce")
async def get_ecommerce_analytics(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get ecommerce analytics (placeholder for future implementation)
    """
    return {
        "period": f"{days} days",
        "total_revenue": 0,
        "total_orders": 0,
        "conversion_rate": 0,
        "avg_order_value": 0,
        "top_products": [],
        "sales_by_category": {},
    }


@router.get("/config")
async def get_analytics_config(db: Session = Depends(get_db)):
    """
    Get analytics configuration
    """
    # Get from settings (placeholder)
    config = AnalyticsConfig(
        google_analytics_id=os.getenv("GOOGLE_ANALYTICS_ID"),
        facebook_pixel_id=os.getenv("FACEBOOK_PIXEL_ID"),
        enable_tracking=True,
        enable_ecommerce=False,  # Not implemented yet
        enable_custom_events=True,
        cookie_consent_required=True,
        anonymize_ip=True,
    )

    return config


@router.put("/config")
async def update_analytics_config(
    config: AnalyticsConfig,
    db: Session = Depends(get_db)
):
    """
    Update analytics configuration
    """
    # Store in settings (placeholder)
    return {"status": "updated", "config": config}


@router.post("/pageview")
async def track_pageview(
    page_url: str,
    referrer: Optional[str] = None,
    user_agent: Optional[str] = None,
    session_id: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Track pageview event
    """
    event = AnalyticsEvent(
        event_name="page_view",
        event_params={"page_location": page_url},
        session_id=session_id,
        user_agent=user_agent,
        page_url=page_url,
        referrer=referrer,
    )

    if background_tasks:
        background_tasks.add_task(send_to_google_analytics, event.dict())

    return {"status": "tracked"}


async def send_to_google_analytics(event_data: Dict[str, Any]):
    """
    Send event to Google Analytics 4
    """
    ga_id = os.getenv("GOOGLE_ANALYTICS_ID")
    if not ga_id:
        return

    # GA4 Measurement Protocol
    url = f"https://www.google-analytics.com/mp/collect?measurement_id={ga_id}&api_secret=YOUR_API_SECRET"

    payload = {
        "client_id": event_data.get("session_id", "anonymous"),
        "events": [{
            "name": event_data["event_name"],
            "params": {
                **event_data.get("event_params", {}),
                "page_location": event_data.get("page_url"),
                "page_referrer": event_data.get("referrer"),
                "user_agent": event_data.get("user_agent"),
            }
        }]
    }

    # Anonymize IP if configured
    if event_data.get("anonymize_ip"):
        payload["events"][0]["params"]["anonymize_ip"] = True

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                print(f"GA4 error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"GA4 send error: {e}")


async def send_to_facebook_pixel(event_data: Dict[str, Any]):
    """
    Send event to Facebook Pixel via Conversions API
    """
    pixel_id = os.getenv("FACEBOOK_PIXEL_ID")
    access_token = os.getenv("FACEBOOK_CONVERSIONS_API_TOKEN")
    
    if not pixel_id or not access_token:
        return

    # Facebook Conversions API endpoint
    url = f"https://graph.facebook.com/v18.0/{pixel_id}/events"

    # Map event names
    event_name_mapping = {
        "page_view": "PageView",
        "search": "Search",
        "view_content": "ViewContent",
        "add_to_cart": "AddToCart",
        "add_to_wishlist": "AddToWishlist",
        "initiate_checkout": "InitiateCheckout",
        "purchase": "Purchase",
        "lead": "Lead",
        "complete_registration": "CompleteRegistration",
    }

    fb_event_name = event_name_mapping.get(event_data["event_name"], event_data["event_name"])

    # Build event data
    event = {
        "event_name": fb_event_name,
        "event_time": int(event_data.get("timestamp", datetime.utcnow()).timestamp()),
        "action_source": "website",
        "event_source_url": event_data.get("page_url", ""),
        "user_data": {
            "client_ip_address": event_data.get("ip_address"),
            "client_user_agent": event_data.get("user_agent"),
        },
    }

    # Add custom data if present
    if event_data.get("event_params"):
        custom_data = {}
        params = event_data["event_params"]
        
        # Map common parameters
        if "value" in params:
            custom_data["value"] = params["value"]
        if "currency" in params:
            custom_data["currency"] = params["currency"]
        if "content_ids" in params:
            custom_data["content_ids"] = params["content_ids"]
        if "content_name" in params:
            custom_data["content_name"] = params["content_name"]
        if "content_category" in params:
            custom_data["content_category"] = params["content_category"]
        if "search_string" in params:
            custom_data["search_string"] = params["search_string"]
        if "num_items" in params:
            custom_data["num_items"] = params["num_items"]
        
        if custom_data:
            event["custom_data"] = custom_data

    payload = {
        "data": [event],
        "access_token": access_token,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                print(f"Facebook Pixel error: {response.status_code} - {response.text}")
            else:
                result = response.json()
                print(f"Facebook Pixel success: {result}")
    except Exception as e:
        print(f"Facebook Pixel send error: {e}")


@router.get("/realtime")
async def get_realtime_analytics():
    """
    Get realtime analytics data
    """
    # Mock realtime data
    return {
        "active_users": 127,
        "current_pageviews": [
            {"page": "/blog", "users": 45},
            {"page": "/products", "users": 32},
            {"page": "/about", "users": 23},
        ],
        "top_countries": [
            {"country": "Italy", "users": 67},
            {"country": "Germany", "users": 23},
            {"country": "France", "users": 18},
        ],
        "events_per_minute": 12.5,
    }
