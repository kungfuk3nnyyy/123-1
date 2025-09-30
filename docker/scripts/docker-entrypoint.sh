
#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U gigsecure_user; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database seeding (only in development)
if [ "$NODE_ENV" = "development" ]; then
  echo "Seeding database..."
  npx prisma db seed || echo "Seeding failed or already done"
fi

# Start the Next.js application
echo "Starting Next.js application..."
exec "$@"
