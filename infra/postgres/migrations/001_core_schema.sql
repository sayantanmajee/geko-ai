/**
 * Migration 001: Core Schema
 * 
 * Creates foundational tables: 
 * - tenants (organizations)
 * - users (people in organizations)
 * - workspaces (teams within organizations)
 * - workspace_members (users assigned to workspaces)
 * 
 * Multi-tenant safety: 
 * - Every table has tenantId or foreign key to tenant
 * - All queries must filter by tenantId
 */

-- Tenants:  Organizations using GEKO-AI
CREATE TABLE IF NOT EXISTS tenants (
  tenantId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tenants IS 'Organizations - complete isolation boundary for multi-tenancy';
COMMENT ON COLUMN tenants.tenantId IS 'Primary key (UUID)';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly identifier (unique across system)';
COMMENT ON COLUMN tenants.status IS 'active=can use, suspended=blocked, deleted=soft delete';

-- Users: People in organizations
CREATE TABLE IF NOT EXISTS users (
  userId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES tenants(tenantId) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  emailVerified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint:  one email per tenant
  UNIQUE(tenantId, email)
);

COMMENT ON TABLE users IS 'Users belong to tenants. Identity is (tenantId + userId)';
COMMENT ON COLUMN users.passwordHash IS 'PBKDF2 hash (never store plain password)';
COMMENT ON COLUMN users.emailVerified IS 'FALSE until email confirmation sent';

-- Workspaces:  Teams within organizations
CREATE TABLE IF NOT EXISTS workspaces (
  workspaceId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES tenants(tenantId) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'paygo')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workspaces IS 'Teams within a tenant. Each workspace is independent billing unit';
COMMENT ON COLUMN workspaces.plan IS 'free=limited, pro=$29/mo, paygo=per-token';

-- Workspace Members: Users assigned to workspaces with roles
CREATE TABLE IF NOT EXISTS workspace_members (
  memberId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invitedBy UUID REFERENCES users(userId) ON DELETE SET NULL,
  
  -- One user per workspace (no duplicate members)
  UNIQUE(workspaceId, userId)
);

COMMENT ON TABLE workspace_members IS 'Membership with role-based access control';
COMMENT ON COLUMN workspace_members.role IS 'owner=full control, admin=management, editor=can chat, viewer=read-only';

-- Indexes for fast queries
CREATE INDEX idx_users_tenantId ON users(tenantId);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_workspaces_tenantId ON workspaces(tenantId);
CREATE INDEX idx_workspace_members_workspaceId ON workspace_members(workspaceId);
CREATE INDEX idx_workspace_members_userId ON workspace_members(userId);
CREATE INDEX idx_workspace_members_role ON workspace_members(role);

-- Audit trigger:  Update updatedAt on changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_workspaces_updated_at
BEFORE UPDATE ON workspaces
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();