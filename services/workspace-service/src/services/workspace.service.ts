/**
 * Workspace Service - Business Logic
 * 
 * Orchestrates database operations with: 
 * - Input validation
 * - Authorization checks
 * - Error handling
 * - Logging
 * 
 * @module services/workspace
 */

import { createLogger, hashString } from '@package/shared-utils';
import {
  ValidationError,
  AuthorizationError,
  AppError,
  ErrorCode,
} from '@package/shared-types';
import type { JWTUser } from '../types/index.js';
import * as db from '../db/queries.js';
import {
  validateWorkspaceName,
  validateEmail,
  isValidRole,
} from '../helpers/validators.js';

const logger = createLogger('workspace-service');

// ============================================================================
// WORKSPACE CRUD Operations
// ============================================================================

/**
 * Create a new workspace
 * 
 * Validates input, creates workspace, adds creator as owner
 * 
 * @param user - Authenticated user
 * @param input - Workspace creation data
 * @returns Created workspace
 * @throws ValidationError, AuthorizationError
 */
export async function createWorkspace(
  user: JWTUser,
  input: {
    name: string;
    description?: string;
    plan?:  'free' | 'pro' | 'paygo';
  }
): Promise<any> {
  logger.info({ userId: user.sub, name: input.name }, 'Creating workspace');

  // Validate input
  if (!validateWorkspaceName(input. name)) {
    logger.warn({ name: input.name }, 'Invalid workspace name');
    throw new ValidationError('Workspace name must be 1-255 characters');
  }

  // Create workspace with owner
  try {
    const workspace = await db.createWorkspaceWithOwner(
      user.tenantId,
      user.sub,
      input.name,
      input.description || null,
      input.plan || 'free'
    );

    logger.info(
      { workspaceId:  workspace.workspaceId, tenantId: user.tenantId },
      '✓ Workspace created successfully'
    );

    return workspace;
  } catch (error) {
    logger.error({ error, userId: user.sub }, 'Failed to create workspace');
    throw error;
  }
}

/**
 * Get workspace details with members
 * 
 * Checks authorization before returning
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @returns Workspace with members and user role
 * @throws AuthorizationError, AppError
 */
export async function getWorkspace(
  user: JWTUser,
  workspaceId: string
): Promise<any> {
  logger.debug({ userId: user.sub, workspaceId }, 'Getting workspace');

  // Get workspace
  const workspace = await db.getWorkspaceById(workspaceId, user.tenantId);
  if (!workspace) {
    logger.warn({ workspaceId }, 'Workspace not found');
    throw new AppError(ErrorCode.NOT_FOUND, 'Workspace not found', 404);
  }

  // Check authorization:  user must be member
  const membership = await db.getWorkspaceMember(workspaceId, user. sub);
  if (!membership) {
    logger.warn({ userId: user.sub, workspaceId }, 'User not workspace member');
    throw new AuthorizationError('You are not a member of this workspace');
  }

  // Get members
  const members = await db. getWorkspaceMembers(workspaceId);
  const roles = await db.getWorkspaceRoles(workspaceId);

  logger.info({ workspaceId }, 'Workspace retrieved successfully');

  return {
    ... workspace,
    members,
    roles,
    userRole: membership.role,
    memberCount: members.length,
  };
}

/**
 * Get all workspaces for authenticated user
 * 
 * @param user - Authenticated user
 * @returns Array of workspaces with user roles
 */
export async function getUserWorkspaces(user: JWTUser): Promise<any[]> {
  logger.debug({ userId: user.sub }, 'Getting user workspaces');

  try {
    const workspaces = await db.getUserWorkspaces(user.sub, user.tenantId);
    logger.info({ userId: user.sub, count: workspaces.length }, 'User workspaces retrieved');
    return workspaces;
  } catch (error) {
    logger.error({ error, userId: user.sub }, 'Failed to get user workspaces');
    throw error;
  }
}

/**
 * Update workspace details
 * 
 * Only owner/admin can update
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @param updates - Fields to update
 * @returns Updated workspace
 * @throws AuthorizationError, AppError
 */
export async function updateWorkspace(
  user: JWTUser,
  workspaceId:  string,
  updates: {
    name?: string;
    description?: string;
    plan?:  string;
  }
): Promise<any> {
  logger.info({ userId: user.sub, workspaceId }, 'Updating workspace');

  // Check authorization
  const membership = await db.getWorkspaceMember(workspaceId, user.sub);
  if (!membership || ! ['owner', 'admin'].includes(membership.role)) {
    logger.warn({ userId: user.sub, workspaceId }, 'Unauthorized workspace update');
    throw new AuthorizationError('Only owner/admin can update workspace');
  }

  // Validate updates
  if (updates.name && !validateWorkspaceName(updates.name)) {
    throw new ValidationError('Invalid workspace name');
  }

  try {
    const workspace = await db.updateWorkspace(workspaceId, user.tenantId, updates);
    logger.info({ workspaceId }, '✓ Workspace updated');
    return workspace;
  } catch (error) {
    logger.error({ error, workspaceId }, 'Failed to update workspace');
    throw error;
  }
}

/**
 * Delete workspace (soft delete)
 * 
 * Only owner can delete
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @throws AuthorizationError
 */
export async function deleteWorkspace(
  user: JWTUser,
  workspaceId: string
): Promise<void> {
  logger.info({ userId: user.sub, workspaceId }, 'Deleting workspace');

  // Check authorization:  must be owner
  const membership = await db.getWorkspaceMember(workspaceId, user.sub);
  if (!membership || membership.role !== 'owner') {
    logger.warn({ userId: user.sub, workspaceId }, 'Only owner can delete');
    throw new AuthorizationError('Only workspace owner can delete it');
  }

  try {
    await db.deleteWorkspace(workspaceId, user. tenantId);
    logger.info({ workspaceId }, '✓ Workspace deleted');
  } catch (error) {
    logger.error({ error, workspaceId }, 'Failed to delete workspace');
    throw error;
  }
}

// ============================================================================
// MEMBER Management
// ============================================================================

/**
 * Invite user to workspace via email
 * 
 * Only admin/owner can invite
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @param inviteEmail - Email to invite
 * @param role - Role for invitee
 * @returns Created invite record
 * @throws AuthorizationError, ValidationError
 */
export async function inviteUserToWorkspace(
  user: JWTUser,
  workspaceId: string,
  inviteEmail: string,
  role: string = 'editor'
): Promise<any> {
  logger.info(
    { userId: user.sub, workspaceId, inviteEmail },
    'Inviting user to workspace'
  );

  // Validate inputs
  if (!validateEmail(inviteEmail)) {
    throw new ValidationError('Invalid email address');
  }

  if (!isValidRole(role)) {
    throw new ValidationError('Invalid role');
  }

  // Check authorization
  const membership = await db.getWorkspaceMember(workspaceId, user.sub);
  if (!membership || ! ['owner', 'admin'].includes(membership.role)) {
    logger.warn({ userId: user.sub, workspaceId }, 'Unauthorized to invite');
    throw new AuthorizationError('Only admin/owner can invite users');
  }

  // Create invite token and record
  const token = `invite_${hashString(JSON.stringify({ workspaceId, email: inviteEmail, timestamp: Date.now() })).substring(0, 32)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    const invite = await db.createInvite(
      workspaceId,
      inviteEmail,
      role as any,
      token,
      expiresAt
    );

    logger.info({ inviteId: invite.inviteId }, '✓ Invite created');

    // TODO: Send email with invite link containing token
    return invite;
  } catch (error) {
    logger.error({ error, inviteEmail }, 'Failed to create invite');
    throw error;
  }
}

/**
 * Accept workspace invitation
 * 
 * @param user - Authenticated user
 * @param inviteToken - Invite token from email
 * @returns Joined workspace
 * @throws AppError, AuthorizationError
 */
export async function acceptInvitation(
  user: JWTUser,
  inviteToken: string
): Promise<any> {
  logger.info({ userId: user.sub }, 'Accepting invitation');

  // Get valid invite
  const invite = await db.getInviteByToken(inviteToken);
  if (!invite) {
    logger.warn({ token: inviteToken }, 'Invite not found or expired');
    throw new AppError(
      ErrorCode.NOT_FOUND,
      'Invite not found or has expired',
      404
    );
  }

  // Check if user already member
  const existingMember = await db.getWorkspaceMember(
    invite.workspaceId,
    user.sub
  );
  if (existingMember) {
    logger.warn({ userId: user.sub, workspaceId: invite.workspaceId }, 'Already member');
    throw new ValidationError('You are already a member of this workspace');
  }

  try {
    // Add user as member
    await db.addWorkspaceMember(
      invite.workspaceId,
      user.sub,
      invite.role,
      undefined
    );

    // Mark invite as accepted
    await db.acceptInvite(invite.inviteId);

    logger.info(
      { userId: user.sub, workspaceId: invite. workspaceId },
      '✓ Invitation accepted'
    );

    // Return workspace details
    const workspace = await db.getWorkspaceById(
      invite.workspaceId,
      user.tenantId
    );
    return workspace;
  } catch (error) {
    logger.error({ error, workspaceId: invite.workspaceId }, 'Failed to accept invite');
    throw error;
  }
}

/**
 * Update member role in workspace
 * 
 * Only admin/owner can change roles
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @param targetUserId - User to update
 * @param newRole - New role
 * @returns Updated member
 * @throws AuthorizationError, ValidationError
 */
export async function updateMemberRole(
  user: JWTUser,
  workspaceId: string,
  targetUserId: string,
  newRole: string
): Promise<any> {
  logger.info(
    { userId: user.sub, targetUserId, newRole },
    'Updating member role'
  );

  // Validate role
  if (!isValidRole(newRole)) {
    throw new ValidationError('Invalid role');
  }

  // Check authorization
  const updaterMembership = await db.getWorkspaceMember(workspaceId, user.sub);
  if (!updaterMembership || !['owner', 'admin'].includes(updaterMembership.role)) {
    logger.warn({ userId: user.sub }, 'Unauthorized to update role');
    throw new AuthorizationError('Only admin/owner can change member roles');
  }

  try {
    const member = await db.updateMemberRole(
      workspaceId,
      targetUserId,
      newRole as any
    );
    logger.info({ memberId: member.memberId }, '✓ Role updated');
    return member;
  } catch (error) {
    logger.error({ error }, 'Failed to update member role');
    throw error;
  }
}

/**
 * Remove member from workspace
 * 
 * Only admin/owner can remove (but not last owner)
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @param targetUserId - User to remove
 * @throws AuthorizationError, ValidationError
 */
export async function removeMemberFromWorkspace(
  user:  JWTUser,
  workspaceId: string,
  targetUserId: string
): Promise<void> {
  logger.info({ userId: user.sub, targetUserId }, 'Removing member');

  // Check authorization
  const membership = await db.getWorkspaceMember(workspaceId, user.sub);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    logger.warn({ userId: user.sub }, 'Unauthorized to remove member');
    throw new AuthorizationError('Only admin/owner can remove members');
  }

  // Check target is not last owner
  const targetMembership = await db.getWorkspaceMember(workspaceId, targetUserId);
  if (targetMembership?.role === 'owner') {
    const roleCounts = await db.countMembersByRole(workspaceId);
    if ((roleCounts['owner'] || 0) <= 1) {
      logger.warn({ targetUserId }, 'Cannot remove last owner');
      throw new ValidationError(
        'Cannot remove the last owner from workspace'
      );
    }
  }

  try {
    await db.removeMember(workspaceId, targetUserId);
    logger.info({ workspaceId, targetUserId }, '✓ Member removed');
  } catch (error) {
    logger.error({ error }, 'Failed to remove member');
    throw error;
  }
}

/**
 * Get workspace members
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @returns Array of members with user details
 * @throws AuthorizationError
 */
export async function getWorkspaceMembers(
  user:  JWTUser,
  workspaceId: string
): Promise<any[]> {
  logger.debug({ userId: user.sub, workspaceId }, 'Getting workspace members');

  // Check authorization:  must be member
  const membership = await db.getWorkspaceMember(workspaceId, user.sub);
  if (!membership) {
    throw new AuthorizationError('You are not a member of this workspace');
  }

  try {
    const members = await db.getWorkspaceMembers(workspaceId);
    logger.info({ count: members.length }, 'Members retrieved');
    return members;
  } catch (error) {
    logger.error({ error }, 'Failed to get members');
    throw error;
  }
}

/**
 * Get pending invites for workspace
 * 
 * Only admin/owner can view
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @returns Array of pending invites
 * @throws AuthorizationError
 */
export async function getPendingInvites(
  user: JWTUser,
  workspaceId: string
): Promise<any[]> {
  logger. debug({ userId: user.sub, workspaceId }, 'Getting pending invites');

  // Check authorization
  const membership = await db.getWorkspaceMember(workspaceId, user.sub);
  if (!membership || !['owner', 'admin'].includes(membership. role)) {
    throw new AuthorizationError('Only admin/owner can view pending invites');
  }

  try {
    const invites = await db.getPendingInvites(workspaceId);
    logger.info({ count: invites.length }, 'Pending invites retrieved');
    return invites;
  } catch (error) {
    logger.error({ error }, 'Failed to get invites');
    throw error;
  }
}