/**
 * Workspace Management
 * 
 * Workspaces are teams within a Tenant.
 * Each workspace has: 
 * - Members (with roles)
 * - Settings (enabled models, quotas)
 * - Billing plan
 * 
 * Example:
 * Tenant "Acme Corp" has Workspaces:
 * - "Engineering" (Pro plan, 5 members)
 * - "Marketing" (Free plan, 2 members)
 */

import type { UUID, Timestamp, PlanType } from './common';

/**
 * Workspace entity
 */
export interface Workspace {
  workspaceId: string;
  tenantId: string;
  name: string;
  description?: string;
  plan: PlanType;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Workspace member with role
 */
export interface WorkspaceMember {
  memberId: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Timestamp;
  invitedBy?: string;
}

/**
 * Create workspace request
 */
export interface CreateWorkspaceInput {
  name:  string;
  description?: string;
  plan?:  PlanType;
}

/**
 * Invite member to workspace
 * Invitation token sent via email
 */
export interface InviteMemberInput {
  email:  string;
  role: 'admin' | 'editor' | 'viewer';
}

/**
 * Pending invitation (before acceptance)
 */
export interface WorkspaceInvite {
  inviteId: string;
  workspaceId: string;
  email: string;
  role:  'admin' | 'editor' | 'viewer';
  token: string;           // Used in invitation link
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  createdAt: Timestamp;
}