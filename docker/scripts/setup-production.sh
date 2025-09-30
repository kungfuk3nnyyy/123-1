
#!/bin/bash
# Production setup script for Docker deployment

set -e

echo "Setting up GigSecure for production deployment..."

# Check if required environment variables are set
required_vars=("NEXTAUTH_SECRET" "DATABASE_URL" "PAYSTACK_SECRET_KEY" "SMTP_USER" "SMTP_PASSWORD")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set. Please set all required environment variables."
        exit 1
    fi
done

echo "Environment variables check passed."

# Create production docker-compose override if it doesn't exist
if [ ! -f docker-compose.prod.yml ]; then
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=production
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - DATABASE_URL=${DATABASE_URL}
      - PAYSTACK_SECRET_KEY=${PAYSTACK_SECRET_KEY}
      - PAYSTACK_PUBLIC_KEY=${PAYSTACK_PUBLIC_KEY}

      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    restart: always
    
  postgres:
    restart: always
    
  redis:
    restart: always
EOF
    echo "Created docker-compose.prod.yml with production configuration."
fi

echo "Production setup completed successfully!"
echo "You can now run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
