# Environment Variables for API Configuration

## Admin Dashboard (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Enable MSW mocks for development (optional)
NEXT_PUBLIC_USE_MOCKS=false

# Development settings
NODE_ENV=development
```

## Render/Storefront (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Tenant ID (optional, for multi-tenant setup)
NEXT_PUBLIC_TENANT_ID=

# Enable MSW mocks for development (optional)
NEXT_PUBLIC_USE_MOCKS=false

# Development settings
NODE_ENV=development
```

## Production Environment

```bash
# Production API URL
NEXT_PUBLIC_API_URL=https://api.spotex.com/api/v1

# Disable mocks in production
NEXT_PUBLIC_USE_MOCKS=false

NODE_ENV=production
```
