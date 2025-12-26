export interface Role {
  roleId: string;
  workspaceId: string;
  name: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  permissionId: string;
  roleId: string;
  permission: Permission;
  createdAt: Date;
}

export type Permission =
  | 'chat:create'
  | 'chat:read'
  | 'chat:delete'
  | 'model:view'
  | 'model:use_free'
  | 'model:use_premium'
  | 'workspace:read'
  | 'workspace:update'
  | 'workspace:delete'
  | 'member:invite'
  | 'member:remove'
  | 'member:role_update'
  | 'billing:view'
  | 'billing:update'
  | 'admin:access';

export interface PermissionCheck {
  userId: string;
  workspaceId: string;
  permission: Permission;
  hasPermission: boolean;
}

export const ROLE_PERMISSIONS: Record<Role['name'], Permission[]> = {
  owner: [
    'chat:create',
    'chat:read',
    'chat:delete',
    'model:view',
    'model:use_free',
    'model:use_premium',
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'member:invite',
    'member:remove',
    'member:role_update',
    'billing:view',
    'billing:update',
    'admin:access',
  ],
  admin: [
    'chat:create',
    'chat:read',
    'chat:delete',
    'model:view',
    'model:use_free',
    'model:use_premium',
    'workspace:read',
    'workspace:update',
    'member:invite',
    'member:remove',
    'member:role_update',
    'billing:view',
    'admin:access',
  ],
  editor: [
    'chat:create',
    'chat:read',
    'chat:delete',
    'model:view',
    'model:use_free',
    'model:use_premium',
  ],
  viewer: ['chat:read', 'model:view', 'model:use_free'],
};