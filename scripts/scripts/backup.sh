
#!/bin/bash

# Event Talents Platform - Database Backup Script
# Creates compressed PostgreSQL backups with rotation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="event_talents_backup_${TIMESTAMP}.sql.gz"
KEEP_DAYS=${1:-7}

echo -e "${GREEN}💾 Creating Event Talents Platform Backup${NC}"
echo "=================================="
echo "Backup file: $BACKUP_FILE"
echo "Retention: $KEEP_DAYS days"
echo "=================================="

# Create backup directory
mkdir -p $BACKUP_DIR

# Load environment variables
source .env

# Create database backup
echo -e "${YELLOW}📦 Creating database backup...${NC}"
docker-compose exec -T postgres pg_dump -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-event_talents_platform} --verbose --no-owner --no-privileges | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Verify backup was created
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}❌ Failed to create backup${NC}"
    exit 1
fi

# Create uploads backup
echo -e "${YELLOW}📁 Creating uploads backup...${NC}"
UPLOADS_BACKUP="uploads_backup_${TIMESTAMP}.tar.gz"
if [ -d "./docker/uploads" ]; then
    tar -czf "${BACKUP_DIR}/${UPLOADS_BACKUP}" -C ./docker uploads/
    echo -e "${GREEN}✅ Uploads backup created: ${UPLOADS_BACKUP}${NC}"
fi

# Clean up old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (older than $KEEP_DAYS days)...${NC}"
find $BACKUP_DIR -name "event_talents_backup_*.sql.gz" -mtime +$KEEP_DAYS -delete
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +$KEEP_DAYS -delete

# List current backups
echo -e "${GREEN}📋 Current backups:${NC}"
ls -lh $BACKUP_DIR/

echo -e "${GREEN}✅ Backup process completed successfully!${NC}"
echo ""
echo "To restore this backup:"
echo "1. Stop the application: docker-compose down"
echo "2. Start only database: docker-compose up postgres -d"
echo "3. Restore: gunzip < ${BACKUP_DIR}/${BACKUP_FILE} | docker-compose exec -T postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-event_talents_platform}"
echo "4. Start application: docker-compose up -d"
