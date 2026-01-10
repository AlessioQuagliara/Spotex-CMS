"""
Rate limiter for API endpoints
"""
from typing import Dict, Optional
from datetime import datetime, timedelta
import asyncio

class RateLimiter:
    """Simple in-memory rate limiter (use Redis in production)"""
    
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = {}
        self.lock = asyncio.Lock()
    
    async def is_allowed(self, key: str) -> bool:
        """Check if request is allowed"""
        async with self.lock:
            current_time = datetime.utcnow()
            minute_ago = current_time - timedelta(minutes=1)
            
            # Clean old requests
            if key in self.requests:
                self.requests[key] = [
                    req_time for req_time in self.requests[key]
                    if req_time > minute_ago
                ]
            else:
                self.requests[key] = []
            
            # Check rate limit
            if len(self.requests[key]) >= self.requests_per_minute:
                return False
            
            # Add current request
            self.requests[key].append(current_time)
            return True
    
    async def get_remaining(self, key: str) -> int:
        """Get remaining requests for key"""
        async with self.lock:
            current_time = datetime.utcnow()
            minute_ago = current_time - timedelta(minutes=1)
            
            if key not in self.requests:
                return self.requests_per_minute
            
            # Clean old requests
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if req_time > minute_ago
            ]
            
            return max(0, self.requests_per_minute - len(self.requests[key]))

# Global rate limiters
general_limiter = RateLimiter(requests_per_minute=60)
auth_limiter = RateLimiter(requests_per_minute=5)
api_limiter = RateLimiter(requests_per_minute=100)
