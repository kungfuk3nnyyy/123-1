
#!/bin/bash

# Event Talents Platform - Health Check Script
# Comprehensive health monitoring for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DETAILED=${1:-false}

echo -e "${GREEN}🏥 Event Talents Platform Health Check${NC}"
echo "=================================="
date
echo "=================================="

# Overall status
OVERALL_STATUS="healthy"

# Check Docker services
echo -e "${BLUE}🐳 Docker Services Status:${NC}"
SERVICES=$(docker-compose ps --services)
for service in $SERVICES; do
    STATUS=$(docker-compose ps $service | tail -n +3 | awk '{print $4}')
    if echo "$STATUS" | grep -q "Up"; then
        echo -e "  ✅ $service: $STATUS"
    else
        echo -e "  ❌ $service: $STATUS"
        OVERALL_STATUS="unhealthy"
    fi
done

# Check application health endpoint
echo -e "\n${BLUE}🌐 Application Health:${NC}"
if curl -f -s http://localhost/health > /dev/null 2>&1; then
    echo -e "  ✅ Application endpoint: healthy"
else
    echo -e "  ❌ Application endpoint: unhealthy"
    OVERALL_STATUS="unhealthy"
fi

# Check database connectivity
echo -e "\n${BLUE}🗄️  Database Health:${NC}"
if docker-compose exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; then
    echo -e "  ✅ PostgreSQL: ready"
    
    # Check database tables
    TABLE_COUNT=$(docker-compose exec -T postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-event_talents_platform} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    echo -e "  📊 Tables: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" -gt 10 ]; then
        echo -e "  ✅ Database schema: complete"
    else
        echo -e "  ⚠️  Database schema: incomplete"
    fi
else
    echo -e "  ❌ PostgreSQL: not ready"
    OVERALL_STATUS="unhealthy"
fi

# Check Redis connectivity
echo -e "\n${BLUE}🔴 Redis Health:${NC}"
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "  ✅ Redis: responding"
else
    echo -e "  ❌ Redis: not responding"
    OVERALL_STATUS="unhealthy"
fi

# Check disk space
echo -e "\n${BLUE}💽 Disk Space:${NC}"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
echo -e "  📊 Root partition: ${DISK_USAGE}% used"

if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "  ✅ Disk space: adequate"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "  ⚠️  Disk space: getting full"
else
    echo -e "  ❌ Disk space: critically low"
    OVERALL_STATUS="unhealthy"
fi

# Check memory usage
echo -e "\n${BLUE}🧠 Memory Usage:${NC}"
if command -v free > /dev/null; then
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", ($3/$2) * 100.0}')
    echo -e "  📊 Memory: ${MEMORY_USAGE}% used"
    
    if [ "$MEMORY_USAGE" -lt 80 ]; then
        echo -e "  ✅ Memory: adequate"
    elif [ "$MEMORY_USAGE" -lt 90 ]; then
        echo -e "  ⚠️  Memory: high usage"
    else
        echo -e "  ❌ Memory: critically high"
    fi
fi

# Detailed checks if requested
if [ "$DETAILED" = "true" ]; then
    echo -e "\n${BLUE}🔍 Detailed Health Checks:${NC}"
    
    # Check SSL certificate (if HTTPS)
    if command -v openssl > /dev/null; then
        CERT_DAYS=$(echo | timeout 5 openssl s_client -servername dooonda.co.ke -connect dooonda.co.ke:443 2>/dev/null | openssl x509 -noout -dates | grep 'notAfter' | cut -d= -f2 | xargs -I {} date -d "{}" +%s)
        CURRENT_DATE=$(date +%s)
        DAYS_LEFT=$(( ($CERT_DAYS - $CURRENT_DATE) / 86400 ))
        
        if [ "$DAYS_LEFT" -gt 30 ]; then
            echo -e "  ✅ SSL Certificate: ${DAYS_LEFT} days remaining"
        elif [ "$DAYS_LEFT" -gt 7 ]; then
            echo -e "  ⚠️  SSL Certificate: ${DAYS_LEFT} days remaining"
        else
            echo -e "  ❌ SSL Certificate: ${DAYS_LEFT} days remaining"
        fi 2>/dev/null || echo -e "  ❓ SSL Certificate: unable to check"
    fi
    
    # Check recent logs for errors
    echo -e "\n${BLUE}📋 Recent Error Logs:${NC}"
    ERROR_COUNT=$(docker-compose logs --since=1h 2>/dev/null | grep -i error | wc -l || echo "0")
    echo -e "  📊 Errors in last hour: $ERROR_COUNT"
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        echo -e "  ✅ No recent errors"
    elif [ "$ERROR_COUNT" -lt 10 ]; then
        echo -e "  ⚠️  Some errors detected"
    else
        echo -e "  ❌ High error rate"
    fi
fi

# Overall status summary
echo -e "\n=================================="
if [ "$OVERALL_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ OVERALL STATUS: HEALTHY${NC}"
    exit 0
else
    echo -e "${RED}❌ OVERALL STATUS: UNHEALTHY${NC}"
    echo -e "${YELLOW}💡 Run with 'true' parameter for detailed checks${NC}"
    exit 1
fi
