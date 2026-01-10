from fastapi import APIRouter
from . import users, posts, categories, media, pages, auth, stats, cache, i18n, seo, analytics
from .admin import posts as admin_posts

api_router = APIRouter()

# Public API routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(pages.router, prefix="/pages", tags=["pages"])
api_router.include_router(stats.router, tags=["stats"])
api_router.include_router(cache.router, tags=["cache"])
api_router.include_router(i18n.router, tags=["i18n"])
api_router.include_router(seo.router, tags=["seo"])
api_router.include_router(analytics.router, tags=["analytics"])

# Admin API routes (require authentication)
api_router.include_router(admin_posts.router, prefix="/admin/posts", tags=["admin"])