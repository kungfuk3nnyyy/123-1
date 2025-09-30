
#!/bin/bash

# Event Talents Platform - Docker Build Script
# Builds production-ready Docker images

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="event-talents-platform"
REGISTRY="your-registry.com"  # Update with your registry
VERSION=${1:-latest}

echo -e "${GREEN}🚀 Building Event Talents Platform Docker Images${NC}"
echo "=================================="
echo "Project: $PROJECT_NAME"
echo "Version: $VERSION"
echo "Registry: $REGISTRY"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Create logs directory
mkdir -p docker/logs/nginx

# Build production image
echo -e "${YELLOW}📦 Building production image...${NC}"
docker build \
    --target runner \
    --tag ${PROJECT_NAME}:${VERSION} \
    --tag ${PROJECT_NAME}:latest \
    --build-arg NODE_ENV=production \
    .

# Build development image
echo -e "${YELLOW}📦 Building development image...${NC}"
docker build \
    --file Dockerfile.dev \
    --target development \
    --tag ${PROJECT_NAME}-dev:${VERSION} \
    --tag ${PROJECT_NAME}-dev:latest \
    .

# Prune build cache to save space
echo -e "${YELLOW}🧹 Cleaning up build cache...${NC}"
docker builder prune --filter until=24h -f

# Display image sizes
echo -e "${GREEN}📊 Image sizes:${NC}"
docker images | grep ${PROJECT_NAME}

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/deploy.sh to deploy"
echo "2. Run: docker-compose up -d to start services"
echo "3. Run: ./scripts/setup-db.sh to initialize database"
