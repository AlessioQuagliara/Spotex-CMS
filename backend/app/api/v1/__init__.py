"""
API v1 router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, posts, categories, pages, media, webhooks, stats

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(posts.router, prefix="/posts", tags=["Posts"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(pages.router, prefix="/pages", tags=["Pages"])
api_router.include_router(media.router, prefix="/media", tags=["Media"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
api_router.include_router(stats.router, prefix="/stats", tags=["Stats"])

# E-commerce endpoints
try:
    from app.api.v1.endpoints import products, cart, checkout, coupons, returns, tracking, analytics, marketing, dashboard, product_management, order_management, customer_management, settings
    api_router.include_router(products.router, prefix="/products", tags=["Products"])
    api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
    api_router.include_router(checkout.router, prefix="/checkout", tags=["Checkout"])
    api_router.include_router(coupons.router, prefix="/coupons", tags=["Coupons"])
    api_router.include_router(returns.router, prefix="/returns", tags=["Returns"])
    api_router.include_router(tracking.router, prefix="/tracking", tags=["Tracking"])
    api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
    api_router.include_router(marketing.router, prefix="/marketing", tags=["Marketing"])
    api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
    api_router.include_router(product_management.router, prefix="/admin/products", tags=["Product Management"])
    api_router.include_router(order_management.router, prefix="/admin/orders", tags=["Order Management"])
    api_router.include_router(customer_management.router, prefix="/admin/customers", tags=["Customer Management"])
    api_router.include_router(settings.router, prefix="/admin/settings", tags=["Settings"])
except ImportError as e:
    print(f"Warning: Could not import e-commerce endpoints: {e}")

# Auth/Security endpoints
try:
    from app.api.v1.endpoints import two_factor, api_keys, audit, stores, sessions
    api_router.include_router(two_factor.router, prefix="/2fa", tags=["Two-Factor"])
    api_router.include_router(api_keys.router, prefix="/api-keys", tags=["API Keys"])
    api_router.include_router(stores.router, prefix="/stores", tags=["Stores"])
    api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
    api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])
except ImportError as e:
    print(f"Warning: Could not import some auth/security endpoints: {e}")
