-- ========================================
-- SPOTEX CMS - Database Initialization
-- ========================================
-- This script initializes the PostgreSQL database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if not exists (already created by Docker)
-- CREATE DATABASE IF NOT EXISTS spotex_cms_db;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE spotex_cms_db TO postgres;

-- Initialize timezone settings
SET timezone = 'UTC';

-- Create indexes for performance (after tables are created by SQLAlchemy)
-- These will be applied after first migration

-- Performance settings
ALTER DATABASE spotex_cms_db SET statement_timeout = '30s';
ALTER DATABASE spotex_cms_db SET idle_in_transaction_session_timeout = '60s';
