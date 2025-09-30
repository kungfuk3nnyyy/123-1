
#!/bin/bash

# Event Talents Platform - Development Environment Script
# Quick setup for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ACTION=${1:-start}

echo -e "${GREEN}🛠️  Event Talents Platform - Development Mode${NC}"
echo "=================================="
echo "Action: $ACTION"
echo "=================================="

case $ACTION in
    "start")
        echo -e "${YELLOW}🚀 Starting development environment...${NC}"
        
        # Create development environment file if it doesn't exist
        if [ ! -f ".env.dev" ]; then
            echo -e "${YELLOW}📝 Creating development environment file...${NC}"
            cp app/.env.docker .env.dev
            
            # Update with development values
            sed -i 's/your_secure_database_password_here/devpassword123/g' .env.dev
            sed -i 's/your_nextauth_secret_key_here_32_chars_min/dev-secret-key-for-development-only/g' .env.dev
            sed -i 's/https:\/\/dooonda.co.ke/http:\/\/localhost:3000/g' .env.dev
            sed -i 's/your_secure_redis_password_here/devredispass/g' .env.dev
        fi
        
        # Start development services
        docker-compose -f docker-compose.dev.yml up -d
        
        # Wait for services
        echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
        sleep 15
        
        # Run database setup
        echo -e "${YELLOW}🗄️  Setting up development database...${NC}"
        docker-compose -f docker-compose.dev.yml exec app-dev npx prisma migrate dev --name init
        docker-compose -f docker-compose.dev.yml exec app-dev npx prisma db seed
        
        echo -e "${GREEN}✅ Development environment is ready!${NC}"
        echo ""
        echo -e "${BLUE}🌐 Available services:${NC}"
        echo "Application: http://localhost:3000"
        echo "Database: localhost:5433 (postgres/devpassword123)"
        echo "Redis: localhost:6380"
        echo "pgAdmin: http://localhost:5050 (admin@gigsecure.local/admin123)"
        echo "MailHog: http://localhost:8025"
        echo ""
        echo -e "${BLUE}📝 Useful commands:${NC}"
        echo "View logs: docker-compose -f docker-compose.dev.yml logs -f"
        echo "Stop: ./scripts/dev.sh stop"
        echo "Restart: ./scripts/dev.sh restart"
        echo "Shell: ./scripts/dev.sh shell"
        ;;
        
    "stop")
        echo -e "${YELLOW}⏹️  Stopping development environment...${NC}"
        docker-compose -f docker-compose.dev.yml down
        echo -e "${GREEN}✅ Development environment stopped${NC}"
        ;;
        
    "restart")
        echo -e "${YELLOW}🔄 Restarting development environment...${NC}"
        docker-compose -f docker-compose.dev.yml restart
        echo -e "${GREEN}✅ Development environment restarted${NC}"
        ;;
        
    "shell")
        echo -e "${YELLOW}🐍 Opening shell in development container...${NC}"
        docker-compose -f docker-compose.dev.yml exec app-dev sh
        ;;
        
    "logs")
        echo -e "${YELLOW}📋 Showing development logs...${NC}"
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
        
    "clean")
        echo -e "${YELLOW}🧹 Cleaning up development environment...${NC}"
        docker-compose -f docker-compose.dev.yml down -v
        docker system prune -f
        echo -e "${GREEN}✅ Development environment cleaned${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown action: $ACTION${NC}"
        echo ""
        echo "Usage: ./scripts/dev.sh [action]"
        echo ""
        echo "Actions:"
        echo "  start    - Start development environment (default)"
        echo "  stop     - Stop development environment"
        echo "  restart  - Restart development environment"  
        echo "  shell    - Open shell in development container"
        echo "  logs     - Show development logs"
        echo "  clean    - Clean up development environment"
        exit 1
        ;;
esac
