/**
 * Migration 005: Role-Based Access Control (RBAC)
 * 
 * Four default roles per workspace:
 * - owner: Full control, can delete workspace
 * - admin:  Manage team, invite/remove members
 * - editor: Can chat, use models
 * - viewer: Read-only access
 * 
 * Permissions:  Granular actions (e.g., 'chat:create')
 * 
 * Design: Table-driven (easy to extend roles/permissions)
 */

-- Roles: Default roles per workspace
CREATE TABLE IF NOT EXISTS workspace_roles (
  roleId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  roleName VARCHAR(50) NOT NULL CHECK (roleName IN ('owner', 'admin', 'editor', 'viewer')),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(workspaceId, roleName)
);

COMMENT ON TABLE workspace_roles IS 'Role definitions per workspace (supports custom roles in future)';

-- Permissions: Granular actions
CREATE TABLE IF NOT EXISTS permissions (
  permissionId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permissionName VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- chat, model, workspace, member, billing, admin
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE permissions IS 'All available permissions (global, not per-workspace)';

-- Role Permissions: Which permissions each role has
CREATE TABLE IF NOT EXISTS role_permissions (
  rolePermissionId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roleId UUID NOT NULL REFERENCES workspace_roles(roleId) ON DELETE CASCADE,
  permissionId UUID NOT NULL REFERENCES permissions(permissionId) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(roleId, permissionId)
);

COMMENT ON TABLE role_permissions IS 'Join table:  which permissions each role has';

-- Indexes
CREATE INDEX idx_workspace_roles_workspaceId ON workspace_roles(workspaceId);
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_role_permissions_roleId ON role_permissions(roleId);
CREATE INDEX idx_role_permissions_permissionId ON role_permissions(permissionId);

-- Trigger
CREATE TRIGGER trigger_update_workspace_roles_updated_at
BEFORE UPDATE ON workspace_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();