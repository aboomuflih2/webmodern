-- Database initialization script for Pottur School Connect
-- This script sets up the database, user, and basic configuration

-- Create database user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pottur_user') THEN
        CREATE ROLE pottur_user WITH LOGIN PASSWORD 'your-secure-password';
    END IF;
END
$$;

-- Grant necessary privileges to the user
GRANT ALL PRIVILEGES ON DATABASE pottur_school_connect TO pottur_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO pottur_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pottur_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pottur_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO pottur_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pottur_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pottur_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO pottur_user;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create anon and authenticated roles for RLS compatibility
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
END
$$;

-- Grant basic permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Set up default privileges for anon and authenticated roles
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- Create a function to get current user ID (for RLS policies)
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid;
$$;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant permissions on auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated, pottur_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, pottur_user;

-- Set timezone
SET timezone = 'UTC';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END
$$;