
-- PostgreSQL initialization script for Docker
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database (if not already created by environment variables)
-- SELECT 'CREATE DATABASE gigsecure' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gigsecure')\gexec

-- Create additional extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set up basic database configurations
ALTER DATABASE gigsecure SET timezone = 'UTC';

-- Create a user for read-only operations (useful for monitoring)
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gigsecure_readonly') THEN
      CREATE ROLE gigsecure_readonly;
   END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE gigsecure TO gigsecure_readonly;
GRANT USAGE ON SCHEMA public TO gigsecure_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gigsecure_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO gigsecure_readonly;

-- Create indexes that might be beneficial (will be applied after Prisma migrations)
-- These are general performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'GigSecure PostgreSQL database initialization completed successfully';
END $$;
