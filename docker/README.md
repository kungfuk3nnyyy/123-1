
# GigSecure Docker Deployment Guide

This guide provides comprehensive instructions for deploying the GigSecure application using Docker containers.

## Overview

The GigSecure Docker setup includes:
- **Next.js Application**: Main web application running on Node.js 18
- **PostgreSQL Database**: Primary data storage with automatic migrations
- **Redis Cache**: Session storage and real-time messaging support
- **File Storage**: Persistent volume for user uploads and KYC documents
- **Health Monitoring**: Built-in health checks for all services

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2
- At least 2GB RAM available
- 10GB free disk space

## Quick Start

### 1. Environment Setup

First, copy the Docker environment template:

```bash
cp .env.docker .env
```

Edit the `.env` file with your configuration:

```bash
# Required: Update these values
NEXTAUTH_SECRET=your-secure-nextauth-secret-here
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=your-paystack-public-key

SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

### 2. Development Deployment

For development with hot reloading:

```bash
# Start all services in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f app
```

### 3. Production Deployment

For production deployment:

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
```

## Detailed Configuration

### Database Configuration

The PostgreSQL service is configured with:
- **Database**: gigsecure
- **User**: gigsecure_user
- **Password**: gigsecure_password (change in production)
- **Port**: 5432
- **Volume**: Persistent data storage

### File Upload Configuration

File uploads are handled through Docker volumes:
- **KYC Documents**: `/app/uploads/kyc`
- **Profile Images**: `/app/uploads/profile`
- **EPK Files**: `/app/uploads/epk`

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `your-random-secret-key` |
| `DATABASE_URL` | PostgreSQL connection string | Auto-configured for Docker |
| `PAYSTACK_SECRET_KEY` | Paystack payment gateway secret | `sk_test_...` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_test_...` |

| `SMTP_USER` | Email service username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Email service password | `app-specific-password` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `UPLOAD_MAX_SIZE` | Maximum file upload size | `10485760` (10MB) |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |

### Custom Docker Commands

#### Database Operations

```bash
# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Reset database (development only)
docker-compose exec app npx prisma migrate reset

# Seed database with test data
docker-compose exec app npx prisma db seed

# View database logs
docker-compose logs -f postgres
```

#### Application Operations

```bash
# Execute commands in app container
docker-compose exec app sh

# View application logs
docker-compose logs -f app

# Restart just the application
docker-compose restart app

# Rebuild application without cache
docker-compose build --no-cache app
```

#### File Operations

```bash
# Access uploaded files
docker-compose exec app ls -la /app/uploads

# Backup uploads directory
docker run --rm -v gigsec_app_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore uploads directory
docker run --rm -v gigsec_app_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Production Optimization

### 1. Security Hardening

```bash
# Use production setup script
chmod +x docker/scripts/setup-production.sh
./docker/scripts/setup-production.sh

# Start with production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. Performance Tuning

Edit `docker-compose.yml` for production:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
  
  postgres:
    command: postgres -c max_connections=200 -c shared_buffers=256MB -c effective_cache_size=1GB
```

### 3. Backup Strategy

```bash
# Database backup
docker-compose exec postgres pg_dump -U gigsecure_user gigsecure > backup_$(date +%Y%m%d_%H%M%S).sql

# Full system backup
docker-compose exec postgres pg_dump -U gigsecure_user gigsecure | gzip > db_backup.sql.gz
docker run --rm -v gigsec_app_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .
```

### 4. Monitoring and Logging

```bash
# Set up log rotation
docker-compose -f docker-compose.yml -f docker-compose.prod.yml config > docker-compose.final.yml

# Monitor resource usage
docker stats

# Health check status
curl http://localhost:3000/api/health
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change ports in docker-compose.yml
   ports:
     - "3001:3000"  # Use different host port
   ```

2. **Database Connection Fails**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   
   # Verify database is ready
   docker-compose exec postgres pg_isready -U gigsecure_user
   ```

3. **File Upload Permissions**
   ```bash
   # Fix upload directory permissions
   docker-compose exec app chown -R nextjs:nodejs /app/uploads
   docker-compose exec app chmod -R 755 /app/uploads
   ```

4. **Memory Issues**
   ```bash
   # Increase Docker memory limits
   # Edit Docker Desktop settings or add swap space on Linux
   ```

### Logs and Debugging

```bash
# View all service logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs app
docker-compose logs postgres

# Debug application issues
docker-compose exec app node --inspect=0.0.0.0:9229 server.js
```

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:3000/api/health

# Database health check
docker-compose exec postgres pg_isready -U gigsecure_user -d gigsecure
```

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Run new migrations
docker-compose exec app npx prisma migrate deploy

# Check health after update
curl http://localhost:3000/api/health
```

## Scaling and Load Balancing

For high-traffic deployments:

```bash
# Scale the application
docker-compose up -d --scale app=3

# Use nginx load balancer
# Create nginx.conf with upstream configuration
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Test database connectivity: `docker-compose exec app npx prisma db push`
4. Check file permissions: `docker-compose exec app ls -la /app/uploads`

For additional support, refer to the main application documentation or contact the development team.
