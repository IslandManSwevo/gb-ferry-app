-- PostgreSQL initialization script
-- Creates additional schemas and extensions for GB Ferry

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
