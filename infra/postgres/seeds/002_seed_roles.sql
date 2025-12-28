/**
 * Seed Migration:  Default Roles
 * 
 * Creates default roles for all workspaces
 * These are inserted when a workspace is created
 */

-- Note:  Roles are created per-workspace via application code
-- This file seeds the permissions that roles use

INSERT INTO permissions (permissionName, category, description) VALUES
-- Chat permissions
('chat:create', 'chat', 'Create new conversations'),
('chat:read', 'chat', 'View own conversations'),
('chat:update', 'chat', 'Edit own conversations'),
('chat:delete', 'chat', 'Delete own conversations'),

-- Model permissions
('model:view', 'model', 'See available models'),
('model:useFree', 'model', 'Use free-tier models'),
('model:usePremium', 'model', 'Use premium models'),

-- Workspace permissions
('workspace:read', 'workspace', 'View workspace details'),
('workspace:update', 'workspace', 'Edit workspace settings'),
('workspace:delete', 'workspace', 'Delete workspace'),

-- Member permissions
('member:invite', 'member', 'Invite users to workspace'),
('member:remove', 'member', 'Remove members from workspace'),
('member:roleUpdate', 'member', 'Change member roles'),

-- Billing permissions
('billing:view', 'billing', 'View billing and usage'),
('billing:update', 'billing', 'Update billing settings'),

-- Admin permissions
('admin:access', 'admin', 'Admin panel access')

ON CONFLICT (permissionName) DO NOTHING;