from fastapi import APIRouter
from app.utils.cache import get_cache_stats, invalidate_cache_pattern

router = APIRouter()

@router.get("/cache/stats")
async def cache_stats():
    """Get Redis cache statistics"""
    stats = await get_cache_stats()
    return stats

@router.delete("/cache/invalidate/{pattern}")
async def invalidate_cache(pattern: str):
    """
    Invalida cache per pattern
    
    Esempi:
    - /api/v1/cache/invalidate/stats:* - Invalida tutte le stats
    - /api/v1/cache/invalidate/posts:* - Invalida tutti i posts
    - /api/v1/cache/invalidate/* - Invalida tutta la cache
    """
    count = await invalidate_cache_pattern(pattern)
    return {
        "message": f"Invalidated {count} cache entries",
        "pattern": pattern
    }
