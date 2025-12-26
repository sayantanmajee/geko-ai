/**
 * Role-Based Access Control (RBAC)
 * 
 * Four roles per workspace:
 * - owner: Full control, can delete workspace
 * - admin: Management, can invite/remove members
 * - editor: Can chat, use models, create conversations
 * - viewer: Read-only access
 * 
 * Permissions:  Granular actions (e.g., 'chat:create')
 * Roles: Bundles of permissions
 * 
 * Rule: Check permissions at API Gateway before forwarding request
 */

import type { UUID, Timestamp } from './common';

/** Granular permission definitions */
export type Permission =
  // Chat & conversations
  | 'chat:create'
  | 'chat:read'
  | 'chat:update'
  | 'chat:delete'
  
  // Model access
  | 'model:view'
  | 'model:useFree'
  | 'model:usePremium'
  
  // Workspace management
  | 'workspace:read'
  | 'workspace:update'
  | 'workspace:delete'
  
  // Team management
  | 'member:invite'
  | 'member:remove'
  | 'member:roleUpdate'
  
  // Billing
  | 'billing:view'
  | 'billing:update'
  
  // Admin
  | 'admin:access';

/**
 * Role definition (workspace-scoped)
 */
export interface Role {
  roleId: string;
  workspaceId: string;
  name: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: Permission[];
  createdAt: Timestamp;
}

/**
 * Default role permissions matrix
 * Used to seed database and validate custom roles
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<
  'owner' | 'admin' | 'editor' | 'viewer',
  Permission[]
> = {
  owner:  [
    'chat:create', 'chat:read', 'chat:update', 'chat:delete',
    'model:view', 'model:useFree', 'model:usePremium',
    'workspace:read', 'workspace:update', 'workspace:delete',
    'member:invite', 'member:remove', 'member:roleUpdate',
    'billing:view', 'billing:update',
    'admin:access',
  ],
  admin: [
    'chat:create', 'chat:read', 'chat:update', 'chat:delete',
    'model:view', 'model:useFree', 'model:usePremium',
    'workspace:read', 'workspace:update',
    'member:invite', 'member:remove', 'member:roleUpdate',
    'billing:view', 'admin:access',
  ],
  editor: [
    'chat:create', 'chat:read', 'chat:update', 'chat:delete',
    'model:view', 'model:useFree', 'model:usePremium',
  ],
  viewer: [
    'chat:read',
    'model:view', 'model:useFree',
  ],
};

/**
 * Permission check result
 */
export interface PermissionCheck {
  userId: string;
  workspaceId: string;
  permission: Permission;
  hasPermission: boolean;
}