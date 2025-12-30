/**
 * Workspace Database Queries
 * 
 * All database operations for workspace management
 */

import { query, execute } from '@package/shared-utils';
import type { PoolClient } from 'pg';
import type {
  WorkspaceRecord,
  WorkspaceMemberRecord,
  WorkspaceRoleRecord,
  InviteUserRequest,
} from '../types/index.js';

// ============================================================================
// WORKSPACES
// ============================================================================

export async function getWorkspaceById(
  workspaceId: string,
  tenantId: string
): Promise<WorkspaceRecord | null> {
  const result = await query<WorkspaceRecord>(
    `SELECT workspaceId, tenantId, name, description, plan, status, createdAt, updatedAt
     FROM workspaces 
     WHERE workspaceId = $1 AND tenantId = $2`,
    [workspaceId, tenantId]
  );
  return result[0] || null;
}

export async function getWorkspacesByTenant(
  tenantId: string
): Promise<WorkspaceRecord[]> {
  return query<WorkspaceRecord>(
    `SELECT workspaceId, tenantId, name, description, plan, status, createdAt, updatedAt
     FROM workspaces 
     WHERE tenantId = $1 AND status != 'deleted'
     ORDER BY createdAt DESC`,
    [tenantId]
  );
}

export async function getUserWorkspaces(
  userId:  string,
  tenantId:  string
): Promise<(WorkspaceRecord & { role: string })[]> {
  return query<WorkspaceRecord & { role: string }>(
    `SELECT w.workspaceId, w. tenantId, w.name, w.description, w.plan, 
            w.status, w.createdAt, w.updatedAt, wm.role
     FROM workspaces w
     JOIN workspace_members wm ON w. workspaceId = wm. workspaceId
     WHERE w.tenantId = $1 AND wm.userId = $2 AND w.status != 'deleted'
     ORDER BY w.createdAt DESC`,
    [tenantId, userId]
  );
}

export async function createWorkspace(
  workspaceId: string,
  tenantId: string,
  name: string,
  description?: string,
  plan: 'free' | 'pro' | 'paygo' = 'free'
): Promise<WorkspaceRecord> {
  const result = await query<WorkspaceRecord>(
    `INSERT INTO workspaces (workspaceId, tenantId, name, description, plan, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING *`,
    [workspaceId, tenantId, name, description, plan]
  );
  return result[0];
}

export async function updateWorkspace(
  workspaceId: string,
  tenantId: string,
  updates: { name?: string; description?: string; plan?: string }
): Promise<WorkspaceRecord> {
  const setClauses:  string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.plan !== undefined) {
    setClauses.push(`plan = $${paramCount++}`);
    values.push(updates.plan);
  }
  
  if (setClauses.length === 0) {
    throw new Error('No updates provided');
  }
  
  values.push(workspaceId, tenantId);
  
  const result = await query<WorkspaceRecord>(
    `UPDATE workspaces 
     SET ${setClauses. join(', ')}, updatedAt = CURRENT_TIMESTAMP
     WHERE workspaceId = $${paramCount + 1} AND tenantId = $${paramCount + 2}
     RETURNING *`,
    values
  );
  
  return result[0];
}

export async function deleteWorkspace(
  workspaceId: string,
  tenantId: string
): Promise<void> {
  await execute(
    `UPDATE workspaces 
     SET status = 'deleted', updatedAt = CURRENT_TIMESTAMP
     WHERE workspaceId = $1 AND tenantId = $2`,
    [workspaceId, tenantId]
  );
}

// ============================================================================
// WORKSPACE MEMBERS
// ============================================================================

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<(WorkspaceMemberRecord & { email: string; firstName?:  string; lastName?: string })[]> {
  return query<WorkspaceMemberRecord & { email: string; firstName?: string; lastName?: string }>(
    `SELECT wm.memberId, wm.workspaceId, wm.userId, wm.role, wm.joinedAt,
            u.email, u.firstName, u.lastName
     FROM workspace_members wm
     JOIN users u ON wm.userId = u.userId
     WHERE wm.workspaceId = $1
     ORDER BY wm.joinedAt DESC`,
    [workspaceId]
  );
}

export async function getWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMemberRecord | null> {
  const result = await query<WorkspaceMemberRecord>(
    `SELECT memberId, workspaceId, userId, role, joinedAt
     FROM workspace_members 
     WHERE workspaceId = $1 AND userId = $2`,
    [workspaceId, userId]
  );
  return result[0] || null;
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer',
  invitedBy?:  string
): Promise<WorkspaceMemberRecord> {
  const result = await query<WorkspaceMemberRecord>(
    `INSERT INTO workspace_members (workspaceId, userId, role, invitedBy, joinedAt)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     RETURNING *`,
    [workspaceId, userId, role, invitedBy]
  );
  return result[0];
}

export async function updateMemberRole(
  workspaceId: string,
  userId:  string,
  newRole: string
): Promise<WorkspaceMemberRecord> {
  const result = await query<WorkspaceMemberRecord>(
    `UPDATE workspace_members 
     SET role = $1
     WHERE workspaceId = $2 AND userId = $3
     RETURNING *`,
    [newRole, workspaceId, userId]
  );
  return result[0];
}

export async function removeMember(
  workspaceId:  string,
  userId: string
): Promise<void> {
  await execute(
    `DELETE FROM workspace_members 
     WHERE workspaceId = $1 AND userId = $2`,
    [workspaceId, userId]
  );
}

// ============================================================================
// WORKSPACE ROLES
// ============================================================================

export async function getWorkspaceRoles(
  workspaceId: string
): Promise<WorkspaceRoleRecord[]> {
  return query<WorkspaceRoleRecord>(
    `SELECT roleId, workspaceId, roleName, description, createdAt
     FROM workspace_roles 
     WHERE workspaceId = $1
     ORDER BY roleName`,
    [workspaceId]
  );
}

export async function createDefaultRoles(
  workspaceId: string,
  client?:  PoolClient
): Promise<void> {
  const roles = ['owner', 'admin', 'editor', 'viewer'];
  const descriptions = {
    owner: 'Full control over workspace',
    admin: 'Can manage team members and settings',
    editor: 'Can create and manage content',
    viewer:  'Read-only access',
  };
  
  const insertQuery = (role: string) =>
    `INSERT INTO workspace_roles (workspaceId, roleName, description)
     VALUES ('${workspaceId}', '${role}', '${descriptions[role as keyof typeof descriptions]}')
     ON CONFLICT DO NOTHING`;
  
  if (client) {
    for (const role of roles) {
      await client.query(insertQuery(role));
    }
  } else {
    for (const role of roles) {
      await execute(insertQuery(role), []);
    }
  }
}

// ============================================================================
// INVITATIONS
// ============================================================================

export async function createInvite(
  workspaceId:  string,
  email: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer',
  token: string,
  expiresAt:  Date
): Promise<InviteUserRequest> {
  const result = await query<InviteUserRequest>(
    `INSERT INTO workspace_invites (workspaceId, email, role, token, expiresAt)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [workspaceId, email, role, token, expiresAt]
  );
  return result[0];
}

export async function getInviteByToken(token: string): Promise<InviteUserRequest | null> {
  const result = await query<InviteUserRequest>(
    `SELECT * FROM workspace_invites 
     WHERE token = $1 AND expiresAt > CURRENT_TIMESTAMP AND acceptedAt IS NULL`,
    [token]
  );
  return result[0] || null;
}

export async function acceptInvite(
  inviteId: string,
): Promise<void> {
  await execute(
    `UPDATE workspace_invites 
     SET acceptedAt = CURRENT_TIMESTAMP 
     WHERE inviteId = $1`,
    [inviteId]
  );
}

export async function getPendingInvites(
  workspaceId: string
): Promise<InviteUserRequest[]> {
  return query<InviteUserRequest>(
    `SELECT * FROM workspace_invites 
     WHERE workspaceId = $1 AND expiresAt > CURRENT_TIMESTAMP AND acceptedAt IS NULL
     ORDER BY createdAt DESC`,
    [workspaceId]
  );
}