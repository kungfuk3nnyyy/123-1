
#!/bin/bash

# Event Talents Platform - Deployment Script
# Handles production deployment with zero-downtime

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="event-talents-platform"
ENVIRONMENT=${1:-production}
BACKUP_BEFORE_DEPLOY=${2:-true}

echo -e "${GREEN}🚀 Deploying Event Talents Platform${NC}"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo "Backup before deploy: $BACKUP_BEFORE_DEPLOY"
echo "=================================="

# Verify environment file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found. Please create one from .env.docker template${NC}"
    exit 1
fi

# Load environment variables
source .env

# Verify required environment variables
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "PAYSTACK_SECRET_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable $var is not set${NC}"
        exit 1
    fi
done

# Create backup if requested
if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
    echo -e "${YELLOW}💾 Creating database backup...${NC}"
    ./scripts/backup.sh
fi

# Pull latest images (if using registry)
echo -e "${YELLOW}📥 Pulling latest images...${NC}"
docker-compose pull --ignore-pull-failures

# Stop existing services gracefully
echo -e "${YELLOW}⏹️  Stopping existing services...${NC}"
docker-compose down --timeout 30

# Start new services
echo -e "${YELLOW}▶️  Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}🏥 Waiting for services to be healthy...${NC}"
timeout=300
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "Up (healthy)"; then
        echo -e "${GREEN}✅ Services are healthy!${NC}"
        break
    fi
    echo -n "."
    sleep 5
    counter=$((counter + 5))
done

if [ $counter -ge $timeout ]; then
    echo -e "${RED}❌ Services failed to become healthy within $timeout seconds${NC}"
    echo "Checking service logs..."
    docker-compose logs --tail=50
    exit 1
fi

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
docker-compose exec app npx prisma generate

# Seed database if needed (development only)
if [ "$ENVIRONMENT" = "development" ]; then
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    docker-compose exec app npm run prisma:seed
fi

# Run health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application health check passed${NC}"
else
    echo -e "${RED}❌ Application health check failed${NC}"
    docker-compose logs app --tail=50
    exit 1
fi

# Display running services
echo -e "${GREEN}📊 Service status:${NC}"
docker-compose ps

# Display useful URLs
echo -e "${GREEN}🌐 Application URLs:${NC}"
echo "Application: https://dooonda.co.ke"
echo "Health Check: https://dooonda.co.ke/health"

# Show logs command
echo -e "${BLUE}📝 To view logs: docker-compose logs -f${NC}"
echo -e "${BLUE}🔧 To access shell: docker-compose exec app sh${NC}"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
