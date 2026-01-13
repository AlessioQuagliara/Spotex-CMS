# Spotex CMS - Deployment Guide

## 📋 Overview

This guide covers the complete deployment process for Spotex CMS across different environments: development, staging, and production.

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│   Admin     │     │   Render    │
│  (Port 80)  │     │  (Port 3000)│     │ (Port 3001) │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       │                    └────────┬───────────┘
       │                             │
       ▼                             ▼
┌─────────────┐            ┌─────────────┐
│   Backend   │            │  PostgreSQL │
│ (Port 8000) │────────────│ (Port 5432) │
└─────────────┘            └─────────────┘
       │
       ▼
┌─────────────┐
│    Redis    │
│ (Port 6379) │
└─────────────┘
```

## 🔧 Prerequisites

### System Requirements
- Docker 24.0+
- Docker Compose 2.0+
- Node.js 20+
- Python 3.11+
- 4GB RAM minimum
- 20GB disk space

### Required Secrets
```bash
# Database
POSTGRES_DB=spotex
POSTGRES_USER=spotex
POSTGRES_PASSWORD=<secure-password>

# Backend
SECRET_KEY=<random-secret-key>
DATABASE_URL=postgresql://spotex:<password>@postgres:5432/spotex

# Redis
REDIS_URL=redis://redis:6379/0

# CDN (Optional)
CDN_URL=https://cdn.spotex.com

# Monitoring
SENTRY_DSN=<sentry-dsn>
```

## 📦 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/spotex-srl/spotex-cms.git
cd spotex-cms
```

### 2. Create Environment Files

**Backend (.env)**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

**Admin Frontend (.env.local)**
```bash
cp frontend/admin/.env.example frontend/admin/.env.local
# Edit frontend/admin/.env.local with your values
```

**Render Frontend (.env.local)**
```bash
cp frontend/render/.env.example frontend/render/.env.local
# Edit frontend/render/.env.local with your values
```

### 3. Generate SSL Certificates (Production)
```bash
./generate-ssl.sh spotex.com
```

## 🚀 Deployment Options

### Option 1: Development Environment

**Using Docker Compose:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Manual Setup:**
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Admin Frontend
cd frontend/admin
npm install
npm run dev

# Render Frontend
cd frontend/render
npm install
npm run dev
```

**Access Points:**
- Admin: http://localhost:3000
- Render: http://localhost:3001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Production Deployment

**Step 1: Build Images**
```bash
./scripts/build-prod.sh
```

**Step 2: Run Services**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Step 3: Verify Health**
```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Test health endpoints
curl http://localhost/health
curl http://localhost:3000/health.json
curl http://localhost:3001/api/health
```

**Step 4: Run Database Migrations**
```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

**Step 5: Create Admin User**
```bash
docker-compose -f docker-compose.prod.yml exec backend python scripts/create_admin.py
```

### Option 3: CI/CD with GitHub Actions

The repository includes a complete CI/CD pipeline configured in `.github/workflows/deploy.yml`.

**Pipeline Stages:**
1. **Quality** - Linting and unit tests
2. **Build** - Application build and optimization
3. **E2E** - Cypress end-to-end tests
4. **Lighthouse** - Performance audits
5. **Docker** - Container image builds
6. **Preview** - Deploy PR previews
7. **Staging** - Deploy to staging (develop branch)
8. **Production** - Deploy to production (main branch)

**Trigger Deployment:**
```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main

# Create preview deployment
git push origin feature/my-feature
# Open PR to trigger preview
```

## 🔍 Monitoring & Optimization

### Performance Audits

**Lighthouse CI:**
```bash
cd frontend/admin
npm run lighthouse
```

**Bundle Analysis:**
```bash
cd frontend/admin
npm run analyze
```

**Bundle Size Monitoring:**
```bash
cd frontend/admin
npm run bundle-size
```

### Build Optimization
```bash
cd frontend/admin
npm run optimize
```

This checks for:
- Large dependencies (>1MB)
- Source maps in production
- Bundle size thresholds (5MB limit)
- Optimization recommendations

### Container Resource Usage
```bash
# View resource usage
docker stats

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Inspect container
docker inspect spotex-admin-prod
```

## 🔄 Scaling

### Horizontal Scaling

**Scale render frontend:**
```bash
docker-compose -f docker-compose.prod.yml up -d --scale render=3
```

**Load Balancing Configuration:**
Update `nginx/conf.d/tenant.spotex.com.conf`:
```nginx
upstream render_backend {
    least_conn;
    server render:3001 max_fails=3 fail_timeout=30s;
    server render_2:3001 max_fails=3 fail_timeout=30s;
    server render_3:3001 max_fails=3 fail_timeout=30s;
}
```

### Vertical Scaling

**Increase resources in docker-compose.prod.yml:**
```yaml
services:
  render:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G
```

## 🛠️ Troubleshooting

### Common Issues

**1. Port Conflicts**
```bash
# Check what's using port
lsof -i :3000

# Change port in docker-compose
ports:
  - "3002:3000"
```

**2. Database Connection Issues**
```bash
# Verify database is running
docker-compose -f docker-compose.prod.yml exec postgres psql -U spotex -d spotex

# Check connection from backend
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.core.database import engine; print(engine.execute('SELECT 1').scalar())"
```

**3. Build Failures**
```bash
# Clear Docker cache
docker system prune -a --volumes

# Rebuild without cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

**4. Memory Issues**
```bash
# Increase Docker memory
# Docker Desktop → Settings → Resources → Memory: 8GB

# Check container memory
docker stats --no-stream
```

### Logs

**View all logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**View specific service:**
```bash
docker-compose -f docker-compose.prod.yml logs -f admin
```

**View last 100 lines:**
```bash
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

## 🔐 Security Best Practices

### 1. Secrets Management
- Never commit `.env` files
- Use Docker secrets or environment variable injection
- Rotate credentials regularly

### 2. SSL/TLS
- Always use HTTPS in production
- Enable HSTS headers
- Use strong cipher suites

### 3. Container Security
- Run as non-root user (already configured)
- Keep base images updated
- Scan images for vulnerabilities:
```bash
docker scan spotex-admin-prod
```

### 4. Network Security
- Use internal networks for service communication
- Expose only necessary ports
- Configure firewall rules

## 📊 Performance Benchmarks

### Expected Performance
- **Admin Frontend:**
  - First Contentful Paint: < 1.5s
  - Time to Interactive: < 3.5s
  - Lighthouse Performance: > 90

- **Render Frontend:**
  - First Contentful Paint: < 1.0s
  - Time to Interactive: < 2.5s
  - Lighthouse Performance: > 95

- **Backend API:**
  - Response time (p50): < 100ms
  - Response time (p95): < 500ms
  - Throughput: > 1000 req/s

### Load Testing
```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test.js
```

## 🔄 Rollback Procedure

### Docker Rollback
```bash
# List previous images
docker images | grep spotex

# Tag previous version as latest
docker tag spotex-admin:v1.0.0 spotex-admin:latest

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### Database Rollback
```bash
# List migrations
docker-compose -f docker-compose.prod.yml exec backend alembic history

# Rollback to specific version
docker-compose -f docker-compose.prod.yml exec backend alembic downgrade <revision>
```

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/spotex-srl/spotex-cms/issues
- Email: support@spotex.com
- Slack: #spotex-cms

## 📚 Additional Resources

- [API Documentation](./API.md)
- [I18N Guide](./I18N_GUIDE.txt)
- [Frontend API Implementation](./FRONTEND_API_IMPLEMENTATION.txt)
- [Quick Start](./QUICKSTART.txt)

---

**Last Updated:** 2024
**Version:** 1.0.0
