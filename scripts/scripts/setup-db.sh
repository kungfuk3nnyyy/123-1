
#!/bin/bash

# Event Talents Platform - Database Setup Script
# Initializes database with migrations and seeding

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENVIRONMENT=${1:-production}

echo -e "${GREEN}🗄️  Setting up Event Talents Platform Database${NC}"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo "=================================="

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Services not running. Starting them first...${NC}"
    docker-compose up -d
    sleep 30
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose exec postgres pg_isready -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo -e "${RED}❌ PostgreSQL failed to become ready within $timeout seconds${NC}"
    exit 1
fi

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
docker-compose exec app npx prisma generate

# Reset database (development only)
if [ "$ENVIRONMENT" = "development" ]; then
    echo -e "${YELLOW}🔄 Resetting database...${NC}"
    docker-compose exec app npx prisma migrate reset --force
fi

# Deploy migrations
echo -e "${YELLOW}📋 Deploying database migrations...${NC}"
docker-compose exec app npx prisma migrate deploy

# Create performance indexes
echo -e "${YELLOW}📊 Creating performance indexes...${NC}"
docker-compose exec postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-event_talents_platform} -c "SELECT create_performance_indexes();" || true

# Seed database
echo -e "${YELLOW}🌱 Seeding database...${NC}"
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose exec app npm run prisma:seed
else
    # Production seeding (admin user only)
    docker-compose exec app npx tsx scripts/seed.ts
fi

# Verify database setup
echo -e "${YELLOW}✅ Verifying database setup...${NC}"
USER_COUNT=$(docker-compose exec postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-event_talents_platform} -t -c "SELECT COUNT(*) FROM \"User\";" | tr -d ' ')
echo "Total users in database: $USER_COUNT"

if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
    echo ""
    echo "Test accounts created:"
    echo "- Admin: john@doe.com / johndoe123"
    echo "- Talent: sarah.photographer@example.com / password123"  
    echo "- Organizer: contact@eventpro.ke / password123"
else
    echo -e "${RED}❌ Database setup failed - no users found${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Database is ready for use!${NC}"
