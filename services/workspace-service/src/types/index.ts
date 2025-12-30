/**
 * Type Definitions for Workspace Service
 * 
 * Defines all data models and request/response types
 * 
 * @module types
 */

/**
 * Workspace record from database
 */
export interface WorkspaceRecord {
  workspaceId: string;
  tenantId: string;
  name: string;
  description: string | null;
  plan: 'free' | 'pro' | 'paygo';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workspace member record from database
 */
export interface WorkspaceMemberRecord {
  memberId: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  invitedBy: string | null;
}

/**
 * Workspace member with user details
 * Used in API responses
 */
export interface WorkspaceMemberWithUser extends WorkspaceMemberRecord {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Workspace role record from database
 */
export interface WorkspaceRoleRecord {
  roleId: string;
  workspaceId: string;
  roleName: string;
  description: string | null;
  createdAt: Date;
}

/**
 * Workspace invitation record from database
 */
export interface WorkspaceInviteRecord {
  inviteId: string;
  workspaceId: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

/**
 * Request body for creating a workspace
 */
export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  plan?:  'free' | 'pro' | 'paygo';
}

/**
 * Request body for updating a workspace
 */
export interface UpdateWorkspaceRequest {
  name?: string;
  description?:  string;
  plan?: 'free' | 'pro' | 'paygo';
}

/**
 * Request body for inviting a user
 */
export interface InviteUserRequest {
  email: string;
  role?:  'owner' | 'admin' | 'editor' | 'viewer';
}

/**
 * Request body for updating member role
 */
export interface UpdateMemberRoleRequest {
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

/**
 * JWT payload structure (from shared-utils)
 */
export interface JWTUser {
  sub: string; // userId
  tenantId: string;
  role?:  string;
  type:  'access' | 'refresh';
  iat?:  number;
  exp?: number;
}

/**
 * Enhanced Express Request with user data
 */
export interface AuthenticatedRequest extends Express.Request {
  user?:  JWTUser;
}