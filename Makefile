
# Makefile for GigSecure Docker operations
.PHONY: help build up down dev prod logs backup restore clean status health

# Default target
help:
	@echo "GigSecure Docker Operations"
	@echo "=========================="
	@echo "Development:"
	@echo "  dev        - Start development environment with hot reload"
	@echo "  logs       - Show application logs"
	@echo "  shell      - Open shell in app container"
	@echo ""
	@echo "Production:"
	@echo "  prod       - Start production environment"
	@echo "  build      - Build all containers"
	@echo "  up         - Start all services"
	@echo "  down       - Stop all services"
	@echo ""
	@echo "Maintenance:"
	@echo "  backup     - Create full system backup"
	@echo "  restore    - Restore from backup (requires TIMESTAMP=YYYYMMDD_HHMMSS)"
	@echo "  clean      - Clean up Docker resources"
	@echo "  status     - Show container status"
	@echo "  health     - Check application health"
	@echo ""
	@echo "Database:"
	@echo "  migrate    - Run database migrations"
	@echo "  seed       - Seed database with test data"
	@echo "  db-shell   - Open PostgreSQL shell"

# Development
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Production
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

# Logs and debugging
logs:
	docker-compose logs -f app

logs-all:
	docker-compose logs -f

shell:
	docker-compose exec app sh

# Database operations
migrate:
	docker-compose exec app npx prisma migrate deploy

seed:
	docker-compose exec app npx prisma db seed

db-shell:
	docker-compose exec postgres psql -U gigsecure_user -d gigsecure

# Maintenance
backup:
	@chmod +x docker/scripts/backup.sh
	@./docker/scripts/backup.sh

restore:
	@if [ -z "$(TIMESTAMP)" ]; then echo "Usage: make restore TIMESTAMP=YYYYMMDD_HHMMSS"; exit 1; fi
	@chmod +x docker/scripts/restore.sh
	@./docker/scripts/restore.sh $(TIMESTAMP)

clean:
	docker system prune -af
	docker volume prune -f

clean-all: down
	docker-compose down -v --remove-orphans
	docker system prune -af
	docker volume prune -f

# Status and monitoring
status:
	docker-compose ps

health:
	@echo "Checking application health..."
	@curl -f http://localhost:3000/api/health && echo "\n✅ Application is healthy" || echo "\n❌ Application health check failed"

# Quick setup
setup-env:
	@if [ ! -f .env ]; then cp .env.docker .env && echo "✅ Environment file created. Please edit .env with your configuration."; else echo "⚠️  .env file already exists"; fi

init: setup-env
	@echo "🚀 Setting up GigSecure Docker environment..."
	@make build
	@make up
	@echo "⏳ Waiting for services to start..."
	@sleep 30
	@make migrate
	@make health
	@echo "✅ Setup complete! Visit http://localhost:3000"

# Update operations
update:
	git pull origin main
	docker-compose build --no-cache
	docker-compose up -d
	docker-compose exec app npx prisma migrate deploy
	@make health
