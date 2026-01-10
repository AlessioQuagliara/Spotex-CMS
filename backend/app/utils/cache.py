import os
import json
import hashlib
from typing import Optional, Any, Callable
from functools import wraps
from redis import asyncio as aioredis
from fastapi import Request

# Configurazione Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client: Optional[aioredis.Redis] = None

async def get_redis() -> aioredis.Redis:
    """Get Redis connection"""
    global redis_client
    if redis_client is None:
        redis_client = await aioredis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    return redis_client

async def close_redis():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()

def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a cache key from function arguments"""
    key_parts = [prefix]
    
    # Add positional arguments
    for arg in args:
        if isinstance(arg, (str, int, float, bool)):
            key_parts.append(str(arg))
        else:
            # For complex objects, use hash of JSON representation
            try:
                key_parts.append(hashlib.md5(
                    json.dumps(arg, sort_keys=True, default=str).encode()
                ).hexdigest()[:8])
            except:
                pass
    
    # Add keyword arguments
    for key, value in sorted(kwargs.items()):
        if isinstance(value, (str, int, float, bool)):
            key_parts.append(f"{key}:{value}")
        else:
            try:
                hash_value = hashlib.md5(
                    json.dumps(value, sort_keys=True, default=str).encode()
                ).hexdigest()[:8]
                key_parts.append(f"{key}:{hash_value}")
            except:
                pass
    
    return ":".join(key_parts)

def cache_response(
    prefix: str = "api",
    ttl: int = 300,  # 5 minuti di default
    include_query_params: bool = True,
    include_user: bool = False
):
    """
    Decorator per cachare le risposte API con Redis
    
    Args:
        prefix: Prefisso per la chiave cache
        ttl: Time to live in secondi
        include_query_params: Include query parameters nella chiave
        include_user: Include user ID nella chiave (per cache personalizzate)
    
    Esempio:
        @router.get("/stats")
        @cache_response(prefix="stats", ttl=600)
        async def get_stats():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get Redis connection
            redis = await get_redis()
            
            # Build cache key
            cache_key_parts = [prefix, func.__name__]
            
            # Include query parameters if requested
            if include_query_params:
                request = kwargs.get('request')
                if request and isinstance(request, Request):
                    query_params = dict(request.query_params)
                    if query_params:
                        cache_key_parts.append(
                            hashlib.md5(
                                json.dumps(query_params, sort_keys=True).encode()
                            ).hexdigest()[:8]
                        )
            
            # Include user ID if requested
            if include_user:
                current_user = kwargs.get('current_user')
                if current_user and hasattr(current_user, 'id'):
                    cache_key_parts.append(f"user:{current_user.id}")
            
            # Generate final cache key
            cache_key = ":".join(cache_key_parts)
            
            # Try to get from cache
            try:
                cached_data = await redis.get(cache_key)
                if cached_data:
                    # Cache HIT
                    print(f"✅ CACHE HIT: {cache_key}")
                    return json.loads(cached_data)
            except Exception as e:
                print(f"⚠️  Cache read error: {e}")
            
            # Cache MISS - execute function
            print(f"❌ CACHE MISS: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Store in cache
            try:
                await redis.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
                print(f"💾 Cached: {cache_key} (TTL: {ttl}s)")
            except Exception as e:
                print(f"⚠️  Cache write error: {e}")
            
            return result
        
        return wrapper
    return decorator

async def invalidate_cache_pattern(pattern: str):
    """
    Invalida tutte le chiavi cache che matchano il pattern
    
    Args:
        pattern: Pattern Redis (es: "stats:*", "posts:*")
    
    Esempio:
        await invalidate_cache_pattern("posts:*")
    """
    redis = await get_redis()
    try:
        keys = await redis.keys(pattern)
        if keys:
            await redis.delete(*keys)
            print(f"🗑️  Invalidated {len(keys)} cache keys: {pattern}")
            return len(keys)
        return 0
    except Exception as e:
        print(f"⚠️  Cache invalidation error: {e}")
        return 0

async def get_cache_stats() -> dict:
    """Get cache statistics"""
    redis = await get_redis()
    try:
        info = await redis.info('stats')
        return {
            "keyspace_hits": info.get('keyspace_hits', 0),
            "keyspace_misses": info.get('keyspace_misses', 0),
            "hit_rate": (
                info.get('keyspace_hits', 0) / 
                max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 0), 1)
            ) * 100,
            "connected": True
        }
    except Exception as e:
        return {
            "error": str(e),
            "connected": False
        }
