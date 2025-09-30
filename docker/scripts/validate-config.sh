
#!/bin/bash
# Configuration validation script for GigSecure Docker setup

set -e

echo "🔍 Validating GigSecure Docker Configuration..."
echo "=============================================="

# Check if required files exist
required_files=(
    "Dockerfile"
    "docker-compose.yml"
    ".dockerignore"
    "next.config.docker.js"
    "healthcheck.js"
    "app/api/health/route.ts"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    else
        echo "✅ $file exists"
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo "❌ Missing required files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

# Check if .env file exists
if [[ -f ".env" ]]; then
    echo "✅ Environment file (.env) exists"
    
    # Check for required environment variables
    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            missing_vars+=("$var")
        else
            echo "✅ $var is configured"
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "⚠️  Missing environment variables in .env:"
        printf '%s\n' "${missing_vars[@]}"
        echo "Consider copying from .env.docker template"
    fi
else
    echo "⚠️  No .env file found"
    echo "💡 Copy .env.docker to .env and configure your settings"
fi

# Check Docker Compose configuration
if command -v docker-compose >/dev/null 2>&1; then
    echo "✅ docker-compose is available"
    
    # Validate compose file syntax
    if docker-compose config >/dev/null 2>&1; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ docker-compose.yml has syntax errors"
        exit 1
    fi
else
    echo "⚠️  docker-compose not found - install Docker to test configuration"
fi

# Check script permissions
scripts_dir="docker/scripts"
if [[ -d "$scripts_dir" ]]; then
    for script in "$scripts_dir"/*.sh; do
        if [[ -x "$script" ]]; then
            echo "✅ $(basename "$script") is executable"
        else
            echo "⚠️  $(basename "$script") is not executable - run: chmod +x $script"
        fi
    done
fi

# Check upload directories in repo (they should exist for development)
upload_dirs=("uploads/kyc" "uploads/profile" "uploads/epk")
for dir in "${upload_dirs[@]}"; do
    if [[ -d "$dir" ]]; then
        echo "✅ $dir directory exists"
    else
        echo "ℹ️  $dir will be created by Docker (this is normal)"
    fi
done

# Check Prisma configuration
if [[ -f "prisma/schema.prisma" ]]; then
    echo "✅ Prisma schema exists"
    
    if grep -q "binaryTargets.*linux-musl" prisma/schema.prisma; then
        echo "✅ Prisma binary targets include linux-musl (Docker compatible)"
    else
        echo "⚠️  Consider adding linux-musl-arm64-openssl-3.0.x to Prisma binaryTargets for Docker"
    fi
else
    echo "❌ Prisma schema not found"
fi

# Check package.json scripts
if [[ -f "package.json" ]]; then
    echo "✅ package.json exists"
    
    if grep -q '"prisma".*"seed"' package.json; then
        echo "✅ Prisma seed script is configured"
    else
        echo "⚠️  Prisma seed script not found in package.json"
    fi
fi

echo ""
echo "🎉 Configuration validation completed!"
echo ""
echo "Next steps:"
echo "1. Copy .env.docker to .env and configure your settings"
echo "2. Run: make init (or docker-compose up)"
echo "3. Access application at http://localhost:3000"
echo "4. Check health at http://localhost:3000/api/health"
