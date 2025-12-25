# Database Documentation

---

## Overview

**GEKO-AI uses two databases:**

1. **PostgreSQL** - Application data (users, workspaces, quotas)
2. **MongoDB** - Chat data (LibreChat - external)

We control PostgreSQL.  LibreChat manages MongoDB (don't touch it).

---

## PostgreSQL Setup

### Connection

```
Host:      localhost
Port:     5432
Database: saas_platform
User:      postgres
Password: postgres
```

### Connect via CLI

```bash
psql -h localhost -U postgres -d saas_platform
```

### Connect via Code

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'saas_platform',
  user:  'postgres',
  password:  'postgres'
});

const result = await pool.query('SELECT * FROM users');
```

### Verify Connection

```bash
psql -h localhost -U postgres -d saas_platform -c "SELECT NOW();"
```

---

## Tables

### 1. tenants

**Purpose:** Organizations using the platform

```sql
CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',     -- free, pro, enterprise
  status VARCHAR(50) DEFAULT 'active',  -- active, suspended, deleted
  stripe_customer_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

**Example:**
```
tenant_id:  550e8400-e29b-41d4-a716-446655440000
name:       Acme Corp
plan:      pro
status:    active
created_at: 2025-12-22 17:55:00
```

**Queries:**
```sql
-- Get tenant
SELECT * FROM tenants WHERE tenant_id = $1;

-- List active tenants
SELECT * FROM tenants WHERE status = 'active' AND deleted_at IS NULL;

-- Update tenant plan
UPDATE tenants SET plan = 'pro' WHERE tenant_id = $1;
```

---

### 2. users

**Purpose:** Platform users (belong to exactly ONE tenant)

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),      -- scrypt format:  scrypt: salt:key
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',  -- owner, admin, member
  status VARCHAR(50) DEFAULT 'active',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(tenant_id, email)            -- Email unique PER TENANT
);

CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
```

**Example:**
```
user_id:  660e8400-e29b-41d4-a716-446655440000
tenant_id:  550e8400-e29b-41d4-a716-446655440000
email:      alice@acme.com
name:      Alice Smith
role:      member
password_hash: scrypt:cf200880411d45: 1aef3e39fc001... 
```

**Key Points:**
- Email is unique **per tenant**, not globally
- User can only belong to one tenant
- Multiple users can have email alice@acme.com if in different tenants

**Queries:**
```sql
-- Get user by email in tenant
SELECT * FROM users 
WHERE tenant_id = $1 AND email = $2;

-- List users in tenant
SELECT * FROM users 
WHERE tenant_id = $1 AND deleted_at IS NULL;

-- Update last login
UPDATE users SET last_login_at = NOW() WHERE user_id = $1;
```

---

### 3. workspaces

**Purpose:** Teams/Departments within a tenant

```sql
CREATE TABLE workspaces (
  workspace_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  created_by UUID NOT NULL REFERENCES users(user_id),
  status VARCHAR(50) DEFAULT 'active',  -- active, archived, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(tenant_id, name)           -- Name unique PER TENANT
);

CREATE INDEX idx_workspaces_tenant ON workspaces(tenant_id);
```

**Example:**
```
workspace_id: 770e8400-e29b-41d4-a716-446655440000
tenant_id:     550e8400-e29b-41d4-a716-446655440000
name:         Sales Team
description:  Sales department
created_by:   660e8400-e29b-41d4-a716-446655440000
status:       active
```

**Queries:**
```sql
-- Get user's workspaces
SELECT w.* FROM workspaces w
JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
WHERE w.tenant_id = $1 AND wm.user_id = $2 AND w.deleted_at IS NULL;

-- Get workspace
SELECT * FROM workspaces WHERE workspace_id = $1;

-- Create workspace
INSERT INTO workspaces (tenant_id, name, created_by, status)
VALUES ($1, $2, $3, 'active') RETURNING *;
```

---

### 4. workspace_members

**Purpose:** User membership in workspaces (many-to-many)

```sql
CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  role VARCHAR(50) DEFAULT 'member',  -- owner, admin, member, viewer
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
```

**Example:**
```
workspace_id: 770e8400-e29b-41d4-a716-446655440000
user_id:       660e8400-e29b-41d4-a716-446655440000
role:         owner
joined_at:    2025-12-22 17:55:00
```

**Roles:**
- `owner` - Full control, can delete workspace
- `admin` - Manage members and config
- `member` - Full access to chat
- `viewer` - Read-only access

**Queries:**
```sql
-- Add user to workspace
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ($1, $2, 'member');

-- Remove user from workspace
DELETE FROM workspace_members
WHERE workspace_id = $1 AND user_id = $2;

-- List workspace members
SELECT u.*, wm.role FROM users u
JOIN workspace_members wm ON u.user_id = wm.user_id
WHERE wm.workspace_id = $1;

-- Check if user is member
SELECT * FROM workspace_members
WHERE workspace_id = $1 AND user_id = $2;
```

---

### 5. workspace_config

**Purpose:** Configuration per workspace

```sql
CREATE TABLE workspace_config (
  config_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(workspace_id),
  enabled_models JSONB DEFAULT '[]',     -- ["gpt-4", "claude-3"]
  enabled_mcps JSONB DEFAULT '[]',       -- ["google_search", "github"]
  custom_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Example:**
```json
{
  "enabled_models": [
    "gpt-4",
    "gpt-3.5-turbo",
    "claude-3-sonnet"
  ],
  "enabled_mcps": [
    "google_search",
    "web_browsing"
  ],
  "custom_settings": {
    "temperature": 0.7,
    "maxTokens": 2000,
    "topP": 0.9
  }
}
```

**Queries:**
```sql
-- Get workspace config
SELECT * FROM workspace_config WHERE workspace_id = $1;

-- Update config
UPDATE workspace_config 
SET enabled_models = $1, updated_at = NOW()
WHERE workspace_id = $2;

-- Check if model is enabled
SELECT enabled_models FROM workspace_config 
WHERE workspace_id = $1 
AND enabled_models @> $2:: jsonb;  -- Contains check
```

---

### 6. workspace_quotas

**Purpose:** Usage quotas per workspace

```sql
CREATE TABLE workspace_quotas (
  quota_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(workspace_id),
  tokens_limit INTEGER DEFAULT 100000,
  tokens_used INTEGER DEFAULT 0,
  requests_limit INTEGER DEFAULT 1000,
  requests_used INTEGER DEFAULT 0,
  files_limit INTEGER DEFAULT 100,      -- MB
  files_used INTEGER DEFAULT 0,
  reset_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotas_workspace ON workspace_quotas(workspace_id);
```

**Example:**
```
quota_id:        880e8400-e29b-41d4-a716-446655440000
workspace_id:    770e8400-e29b-41d4-a716-446655440000
tokens_limit:   1000000
tokens_used:    45000          -- 4.5% used
requests_limit: 1000
requests_used:  120            -- 12% used
reset_at:       2024-01-31 23:59:59
```

**Queries:**
```sql
-- Check quota
SELECT tokens_limit, tokens_used FROM workspace_quotas
WHERE workspace_id = $1;

-- Check if quota exceeded
SELECT 
  (tokens_used + $1) <= tokens_limit as can_use
FROM workspace_quotas
WHERE workspace_id = $2;

-- Update tokens used
UPDATE workspace_quotas 
SET tokens_used = tokens_used + $1
WHERE workspace_id = $2;

-- Reset quota
UPDATE workspace_quotas 
SET tokens_used = 0, requests_used = 0, reset_at = NOW() + INTERVAL '1 month'
WHERE workspace_id = $1;
```

---

### 7. audit_logs

**Purpose:** Audit trail for compliance

```sql
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  workspace_id UUID REFERENCES workspaces(workspace_id),
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(255) NOT NULL,      -- 'chat_sent', 'user_added', etc.
  resource VARCHAR(255),             -- 'conversation', 'workspace', etc.
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',  -- 'success', 'failed'
  error_message TEXT,
  