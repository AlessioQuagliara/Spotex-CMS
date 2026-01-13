#!/bin/bash

###############################################################################
# Production Build Script
# Builds and optimizes all services for production deployment
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD)
VERSION=${VERSION:-$(git describe --tags --always)}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Spotex CMS - Production Build Script               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Build Information:${NC}"
echo "  Date: $BUILD_DATE"
echo "  Version: $VERSION"
echo "  Commit: $VCS_REF"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Build Backend
echo -e "${YELLOW}Building Backend...${NC}"
cd backend

if [ -f "requirements.txt" ]; then
    echo "  Installing Python dependencies..."
    pip install -r requirements.txt --quiet
fi

echo "  Running tests..."
pytest --quiet || {
    echo -e "${RED}❌ Backend tests failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Backend build complete${NC}"
cd ..
echo ""

# Build Admin Frontend
echo -e "${YELLOW}Building Admin Frontend...${NC}"
cd frontend/admin

echo "  Installing dependencies..."
npm ci --quiet

echo "  Running linter..."
npm run lint || {
    echo -e "${RED}❌ Admin linting failed${NC}"
    exit 1
}

echo "  Running tests..."
npm run test:ci || {
    echo -e "${RED}❌ Admin tests failed${NC}"
    exit 1
}

echo "  Building application..."
npm run build

echo "  Optimizing build..."
node ../../scripts/build-optimization.js frontend/admin

echo "  Checking bundle size..."
node ../../scripts/bundle-size-monitor.js frontend/admin

echo -e "${GREEN}✅ Admin frontend build complete${NC}"
cd ../..
echo ""

# Build Render Frontend
echo -e "${YELLOW}Building Render Frontend...${NC}"
cd frontend/render

echo "  Installing dependencies..."
npm ci --quiet

echo "  Running linter..."
npm run lint || {
    echo -e "${RED}❌ Render linting failed${NC}"
    exit 1
}

echo "  Building application..."
npm run build

echo "  Optimizing build..."
node ../../scripts/build-optimization.js frontend/render

echo -e "${GREEN}✅ Render frontend build complete${NC}"
cd ../..
echo ""

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"

export BUILD_DATE
export VCS_REF
export VERSION

docker-compose -f docker-compose.prod.yml build \
    --build-arg BUILD_DATE="$BUILD_DATE" \
    --build-arg VCS_REF="$VCS_REF" \
    --build-arg VERSION="$VERSION" || {
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Docker images built${NC}"
echo ""

# Generate build report
echo -e "${YELLOW}Generating build report...${NC}"

cat > build-report.json <<EOF
{
  "timestamp": "$BUILD_DATE",
  "version": "$VERSION",
  "commit": "$VCS_REF",
  "services": {
    "backend": {
      "status": "success",
      "image": "spotex-backend:$VERSION"
    },
    "admin": {
      "status": "success",
      "image": "spotex-admin:$VERSION"
    },
    "render": {
      "status": "success",
      "image": "spotex-render:$VERSION"
    }
  }
}
EOF

echo -e "${GREEN}✅ Build report generated${NC}"
echo ""

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Build Summary                            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ All services built successfully!${NC}"
echo ""
echo "Docker images:"
echo "  - spotex-backend:$VERSION"
echo "  - spotex-admin:$VERSION"
echo "  - spotex-render:$VERSION"
echo ""
echo "Next steps:"
echo "  1. Review build report: cat build-report.json"
echo "  2. Run integration tests: ./scripts/integration-tests.sh"
echo "  3. Deploy to staging: docker-compose -f docker-compose.prod.yml up -d"
echo "  4. Run smoke tests: ./scripts/smoke-tests.sh"
echo ""
echo -e "${YELLOW}Ready to deploy! 🚀${NC}"
echo ""
