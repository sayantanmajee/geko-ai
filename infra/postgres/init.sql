/**
 * PostgreSQL Database Initialization
 * 
 * Creates databases and enables required extensions
 * Run ONCE at first startup
 * 
 * This file is NOT a migration - it's run by Docker init
 */

-- Create main database
CREATE DATABASE geko_ai
  WITH ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

-- Create test database
CREATE DATABASE geko_ai_test
  WITH ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

-- Connect to geko_ai to enable extensions
\c geko_ai;

-- UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full-text search (optional, for later)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- JSON operations (optional)
CREATE EXTENSION IF NOT EXISTS "jsonb_set_lax";

-- Grant permissions to geko user
GRANT ALL PRIVILEGES ON DATABASE geko_ai TO geko;
GRANT ALL PRIVILEGES ON DATABASE geko_ai_test TO geko;

-- Connect to test database and enable extensions
\c geko_ai_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Done
GRANT ALL PRIVILEGES ON DATABASE geko_ai_test TO geko;