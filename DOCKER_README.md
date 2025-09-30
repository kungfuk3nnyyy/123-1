
# 🐳 GigSecure Docker Deployment

Complete Docker containerization for the GigSecure event talent booking platform.

## 📋 Overview

This Docker configuration provides a production-ready deployment of GigSecure with:

- **Next.js 14 Application** - Main web application with SSR/SSG
- **PostgreSQL 15** - Primary database with automatic migrations
- **Redis 7** - Caching and session storage
- **File Storage** - Persistent volumes for uploads (KYC, profiles, EPKs)
- **Health Monitoring** - Built-in health checks and monitoring
- **Security** - Production-hardened container configuration

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Clone and navigate to project
cd gigsec_1-main

# Copy environment template
cp .env.docker .env

# Edit environment variables (required)
nano .env
```

### 2. Development Mode

```bash
# Using Make (recommended)
make init

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 3. Production Mode

```bash
# Using Make
make prod

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Access Application

- **Web Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Database**: localhost:5432
- **Redis**: localhost:6379

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | NextAuth.js encryption key | `your-secure-random-key` |
| `PAYSTACK_SECRET_KEY` | Paystack payment processor | `sk_test_...` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_test_...` |

| `SMTP_USER` | Email service username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Email app password | `app-specific-password` |

### Database Configuration

- **Engine**: PostgreSQL 15
- **Database**: gigsecure
- **User**: gigsecure_user
- **Auto-migrations**: ✅
- **Health checks**: ✅
- **Backup ready**: ✅

### File Storage

All uploads are stored in persistent Docker volumes:

```
/app/uploads/
├── kyc/          # KYC verification documents
├── profile/      # User profile images
└── epk/          # Electronic press kits
```

## 🛠️ Common Operations

### Using Make Commands (Recommended)

```bash
# Development
make dev          # Start development environment
make logs         # View application logs
make shell        # Open app container shell

# Production
make prod         # Start production environment
make status       # Check container status
make health       # Check application health

# Database
make migrate      # Run migrations
make seed         # Seed test data
make db-shell     # Open PostgreSQL shell

# Maintenance
make backup       # Create full backup
make restore TIMESTAMP=20240101_120000  # Restore backup
make clean        # Clean Docker resources
```

### Manual Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Execute commands
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed

# Scale application
docker-compose up -d --scale app=3

# Stop services
docker-compose down
```

## 🔧 Development Features

### Hot Reloading

Development mode includes:
- Source code hot reloading
- Database persistence
- Real-time log streaming
- Volume mounts for instant updates

### Debugging

```bash
# View detailed logs
make logs

# Access application shell
make shell

# Database debugging
make db-shell

# Check service health
make health
```

## 🏗️ Production Features

### Performance Optimizations

- Multi-stage Docker builds
- Optimized Next.js production build
- Resource limits and reservations
- Database connection pooling
- Redis caching layer

### Security Hardening

- Non-root container execution
- Minimal attack surface
- Security headers configuration
- Environment variable isolation
- Network isolation between services

### Monitoring & Health Checks

- Application health endpoint: `/api/health`
- Database connectivity monitoring
- Service dependency validation
- Automatic container restart policies

## 📦 Backup & Recovery

### Automated Backups

```bash
# Create full system backup
make backup

# Backup files saved to:
# ./backups/database_TIMESTAMP.sql.gz
# ./backups/uploads_TIMESTAMP.tar.gz
# ./backups/config_TIMESTAMP.tar.gz
```

### Recovery Process

```bash
# Restore from specific backup
make restore TIMESTAMP=20240101_120000

# Manual database restore
gunzip -c backups/database_20240101_120000.sql.gz | \
  docker-compose exec -T postgres psql -U gigsecure_user -d gigsecure
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tuln | grep :3000
   
   # Change port in docker-compose.yml
   ports:
     - "3001:3000"
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   docker-compose exec postgres pg_isready -U gigsecure_user
   
   # View database logs
   docker-compose logs postgres
   ```

3. **File Upload Permissions**
   ```bash
   # Fix upload permissions
   docker-compose exec app chown -R nextjs:nodejs /app/uploads
   ```

4. **Memory Issues**
   ```bash
   # Check container resource usage
   docker stats
   
   # Increase Docker memory limits in Docker Desktop
   ```

### Log Analysis

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f

# Filter logs by timestamp
docker-compose logs --since="2024-01-01T00:00:00"
```

### Health Check Debugging

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready -U gigsecure_user -d gigsecure

# Redis health  
docker-compose exec redis redis-cli ping
```

## 🚀 Deployment Strategies

### Single Server Deployment

```bash
# Clone repository on server
git clone <repository-url>
cd gigsec_1-main

# Set up environment
cp .env.docker .env
# Edit .env with production values

# Deploy
make prod
make health
```

### Load Balanced Deployment

```bash
# Scale application instances
docker-compose up -d --scale app=3

# Use nginx load balancer
docker-compose -f docker-compose.yml -f docker/nginx/docker-compose.nginx.yml up -d
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Deploy to production
  run: |
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    docker-compose exec app npx prisma migrate deploy
```

## 📈 Scaling Considerations

### Vertical Scaling (Single Server)

Edit `docker-compose.prod.yml` resource limits:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

### Horizontal Scaling (Multiple Servers)

- Use Docker Swarm or Kubernetes
- External PostgreSQL database
- Shared file storage (NFS, S3)
- Load balancer configuration

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to version control
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Network Security**
   - Use internal Docker networks
   - Limit exposed ports
   - Configure firewall rules

3. **Container Security**
   - Regular base image updates
   - Vulnerability scanning
   - Non-root execution

4. **Data Security**
   - Regular backups
   - Encrypted storage
   - Access logging

## 📞 Support

For Docker-specific issues:
1. Check logs: `make logs`
2. Verify health: `make health`
3. Review configuration: `docker-compose config`
4. Check resources: `docker stats`

For application issues, refer to the main project documentation.

---

**🎉 Happy Deploying!**

This Docker configuration is production-ready and includes all necessary components for a complete GigSecure deployment.
