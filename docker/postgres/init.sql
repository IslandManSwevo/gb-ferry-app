-- PostgreSQL initialization script
-- Creates additional schemas and extensions for GB Ferry

-- Create a dedicated database for Keycloak so Prisma can manage gbferry_db
-- without trying to drop Keycloak's tables.
SELECT format('CREATE DATABASE %I', 'keycloak_db')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak_db')\gexec

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create audit schema for separation
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO gbferry;
GRANT ALL PRIVILEGES ON SCHEMA audit TO gbferry;

-- Create audit trigger function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: Prisma will handle table creation via migrations
-- This script is for extensions and initial setup only
