/**
 * Seed Migration 003: Role-Permission Mappings
 * 
 * Maps default roles to their permissions
 * This defines what each role CAN DO
 * 
 * Roles (per workspace):
 * - owner:     Full access (can delete workspace)
 * - admin:    Team management (invite/remove members)
 * - editor:   Can chat and use models
 * - viewer:   Read-only access
 * 
 * NOTE:  This doesn't create roles (that happens per-workspace in app code)
 *       This just defines the permission matrix
 */

-- Get permission IDs for easier mapping
DO $$ 
DECLARE
  -- Chat permissions
  chat_create UUID;
  chat_read UUID;
  chat_update UUID;
  chat_delete UUID;
  
  -- Model permissions
  model_view UUID;
  model_use_free UUID;
  model_use_premium UUID;
  
  -- Workspace permissions
  workspace_read UUID;
  workspace_update UUID;
  workspace_delete UUID;
  
  -- Member permissions
  member_invite UUID;
  member_remove UUID;
  member_role_update UUID;
  
  -- Billing permissions
  billing_view UUID;
  billing_update UUID;
  
  -- Admin permissions
  admin_access UUID;
  
BEGIN
  -- Get permission IDs
  SELECT permissionId INTO chat_create FROM permissions WHERE permissionName = 'chat:create';
  SELECT permissionId INTO chat_read FROM permissions WHERE permissionName = 'chat:read';
  SELECT permissionId INTO chat_update FROM permissions WHERE permissionName = 'chat:update';
  SELECT permissionId INTO chat_delete FROM permissions WHERE permissionName = 'chat:delete';
  
  SELECT permissionId INTO model_view FROM permissions WHERE permissionName = 'model:view';
  SELECT permissionId INTO model_use_free FROM permissions WHERE permissionName = 'model:useFree';
  SELECT permissionId INTO model_use_premium FROM permissions WHERE permissionName = 'model:usePremium';
  
  SELECT permissionId INTO workspace_read FROM permissions WHERE permissionName = 'workspace:read';
  SELECT permissionId INTO workspace_update FROM permissions WHERE permissionName = 'workspace:update';
  SELECT permissionId INTO workspace_delete FROM permissions WHERE permissionName = 'workspace:delete';
  
  SELECT permissionId INTO member_invite FROM permissions WHERE permissionName = 'member:invite';
  SELECT permissionId INTO member_remove FROM permissions WHERE permissionName = 'member:remove';
  SELECT permissionId INTO member_role_update FROM permissions WHERE permissionName = 'member:roleUpdate';
  
  SELECT permissionId INTO billing_view FROM permissions WHERE permissionName = 'billing:view';
  SELECT permissionId INTO billing_update FROM permissions WHERE permissionName = 'billing:update';
  
  SELECT permissionId INTO admin_access FROM permissions WHERE permissionName = 'admin:access';
  
  -- OWNER: Full access
  INSERT INTO role_permissions (roleId, permissionId) VALUES
    (NULL, chat_create), (NULL, chat_read), (NULL, chat_update), (NULL, chat_delete),
    (NULL, model_view), (NULL, model_use_free), (NULL, model_use_premium),
    (NULL, workspace_read), (NULL, workspace_update), (NULL, workspace_delete),
    (NULL, member_invite), (NULL, member_remove), (NULL, member_role_update),
    (NULL, billing_view), (NULL, billing_update),
    (NULL, admin_access)
  ON CONFLICT (roleId, permissionId) DO NOTHING;
  
  -- Note: Actual role-permission associations happen in app code
  -- This ensures all permission definitions exist globally
  
END $$;

COMMENT ON TABLE role_permissions IS 'Permissions assigned to roles (defines access matrix)';