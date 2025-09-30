
#!/bin/bash
# Restore script for GigSecure Docker deployment

set -e

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <backup_timestamp>"
    echo "Example: $0 20240101_120000"
    exit 1
fi

BACKUP_DIR="./backups"
TIMESTAMP="$1"

echo "Starting GigSecure restore process for timestamp: $TIMESTAMP"

# Check if backup files exist
if [ ! -f "$BACKUP_DIR/database_$TIMESTAMP.sql.gz" ]; then
    echo "Error: Database backup file not found: $BACKUP_DIR/database_$TIMESTAMP.sql.gz"
    exit 1
fi

if [ ! -f "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" ]; then
    echo "Error: Uploads backup file not found: $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
    exit 1
fi

# Stop services
echo "Stopping Docker services..."
docker-compose down

# Restore database
echo "Restoring PostgreSQL database..."
docker-compose up -d postgres
sleep 10  # Wait for PostgreSQL to start

# Drop and recreate database
docker-compose exec postgres psql -U gigsecure_user -d postgres -c "DROP DATABASE IF EXISTS gigsecure;"
docker-compose exec postgres psql -U gigsecure_user -d postgres -c "CREATE DATABASE gigsecure;"

# Restore database data
gunzip -c "$BACKUP_DIR/database_$TIMESTAMP.sql.gz" | docker-compose exec -T postgres psql -U gigsecure_user -d gigsecure

# Restore uploads
echo "Restoring uploaded files..."
docker run --rm -v gigsec_1_main_app_uploads:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine sh -c "cd /data && rm -rf * && tar xzf /backup/uploads_$TIMESTAMP.tar.gz"

# Restore configuration (optional - be careful not to overwrite current config)
if [ -f "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" ]; then
    echo "Configuration backup found. Extract manually if needed: $BACKUP_DIR/config_$TIMESTAMP.tar.gz"
fi

# Start all services
echo "Starting all services..."
docker-compose up -d

# Wait and check health
sleep 30
echo "Checking application health..."
curl -f http://localhost:3000/api/health || echo "Warning: Health check failed"

echo "Restore completed successfully!"
echo "Database and uploads restored from timestamp: $TIMESTAMP"
