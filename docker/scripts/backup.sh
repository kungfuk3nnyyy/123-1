
#!/bin/bash
# Backup script for GigSecure Docker deployment

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting GigSecure backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "Backing up PostgreSQL database..."
docker-compose exec -T postgres pg_dump -U gigsecure_user -d gigsecure | gzip > "$BACKUP_DIR/database_$TIMESTAMP.sql.gz"

# Backup uploads
echo "Backing up uploaded files..."
docker run --rm -v gigsec_1_main_app_uploads:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf "/backup/uploads_$TIMESTAMP.tar.gz" -C /data .

# Backup configuration
echo "Backing up configuration files..."
tar czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" .env docker-compose.yml docker-compose.prod.yml

# Clean up old backups (keep last 7 days)
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup completed successfully!"
echo "Files saved in: $BACKUP_DIR"
ls -la "$BACKUP_DIR"/*$TIMESTAMP*
