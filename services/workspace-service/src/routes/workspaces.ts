/**
 * Workspace Routes
 * 
 * HTTP endpoints for workspace management
 * All routes require authentication
 * 
 * @module routes/workspaces
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '@package/shared-utils';
import { ValidationError } from '@package/shared-types';
import { authMiddleware } from '../middleware/auth.js';
import * as workspaceService from '../services/workspace.service.js';
import { successResponse } from '../utils/response.js';
import type { 
  CreateWorkspaceRequest, 
  UpdateWorkspaceRequest, 
  InviteUserRequest, 
  UpdateMemberRoleRequest,
  AuthenticatedRequest 
} from '../types/index.js';

const logger = createLogger('workspace-routes');
export const workspaceRouter: Router = Router();

// Apply authentication to all routes
workspaceRouter.use(authMiddleware);

// ============================================================================
// WORKSPACE CRUD
// ============================================================================

/**
 * POST /v1/workspaces
 * Create new workspace
 * 
 * @body {CreateWorkspaceRequest} name, description?, plan? 
 * @returns {WorkspaceRecord} Created workspace
 */
workspaceRouter.post(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, plan } = req.body as CreateWorkspaceRequest;

      logger.debug(
        { userId: req.user?. sub, name },
        'POST /workspaces - Create workspace'
      );

      // Validate required fields
      if (!name) {
        throw new ValidationError('Workspace name is required');
      }

      // Call service
      const workspace = await workspaceService.createWorkspace(req.user!, {
        name,
        description,
        plan,
      });

      logger.info(
        { workspaceId: workspace.workspaceId },
        'Workspace created successfully'
      );

      res.status(201).json(successResponse(workspace));
    } catch (error) {
      logger.error({ error }, 'Create workspace failed');
      next(error);
    }
  }
);

/**
 * GET /v1/workspaces
 * Get all user workspaces
 * 
 * @returns {Array<WorkspaceRecord>} User's workspaces
 */
workspaceRouter.get(
  '/',
  async (req: AuthenticatedRequest, res:  Response, next: NextFunction) => {
    try {
      logger.debug(
        { userId: req.user?.sub },
        'GET /workspaces - Get all user workspaces'
      );

      const workspaces = await workspaceService.getUserWorkspaces(req.user! );

      logger.info(
        { count: workspaces.length },
        'User workspaces retrieved'
      );

      res.json(successResponse(workspaces));
    } catch (error) {
      logger.error({ error }, 'Get user workspaces failed');
      next(error);
    }
  }
);

/**
 * GET /v1/workspaces/:workspaceId
 * Get specific workspace with members
 * 
 * @param {string} workspaceId - Workspace UUID
 * @returns {WorkspaceRecord & {members, roles, userRole}} Workspace details
 */
workspaceRouter.get(
  '/:workspaceId',
  async (req: AuthenticatedRequest, res: Response, next:  NextFunction) => {
    try {
      const { workspaceId } = req.params;

      logger.debug(
        { userId: req.user?.sub, workspaceId },
        'GET /workspaces/:id - Get workspace'
      );

      const workspace = await workspaceService.getWorkspace(
        req.user!,
        workspaceId
      );

      logger.info({ workspaceId }, 'Workspace retrieved');

      res.json(successResponse(workspace));
    } catch (error) {
      logger.error({ error }, 'Get workspace failed');
      next(error);
    }
  }
);

/**
 * PATCH /v1/workspaces/:workspaceId
 * Update workspace (owner/admin only)
 * 
 * @param {string} workspaceId - Workspace UUID
 * @body {UpdateWorkspaceRequest} name?, description?, plan?
 * @returns {WorkspaceRecord} Updated workspace
 */
workspaceRouter.patch(
  '/: workspaceId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = req.params;
      const updates = req.body as UpdateWorkspaceRequest;

      logger.debug(
        { userId: req. user?.sub, workspaceId },
        'PATCH /workspaces/:id - Update workspace'
      );

      const workspace = await workspaceService.updateWorkspace(
        req.user!,
        workspaceId,
        updates
      );

      logger.info({ workspaceId }, 'Workspace updated');

      res.json(successResponse(workspace));
    } catch (error) {
      logger.error({ error }, 'Update workspace failed');
      next(error);
    }
  }
);

/**
 * DELETE /v1/workspaces/:workspaceId
 * Delete workspace (owner only)
 * 
 * @param {string} workspaceId - Workspace UUID
 */
workspaceRouter.delete(
  '/:workspaceId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = req.params;

      logger.debug(
        { userId: req.user?. sub, workspaceId },
        'DELETE /workspaces/: id - Delete workspace'
      );

      await workspaceService. deleteWorkspace(req.user!, workspaceId);

      logger.info({ workspaceId }, 'Workspace deleted');

      res.json(successResponse({ ok: true, message: 'Workspace deleted' }));
    } catch (error) {
      logger.error({ error }, 'Delete workspace failed');
      next(error);
    }
  }
);

// ============================================================================
// MEMBERS
// ============================================================================

/**
 * GET /v1/workspaces/:workspaceId/members
 * Get all workspace members
 * 
 * @param {string} workspaceId - Workspace UUID
 * @returns {Array<WorkspaceMemberWithUser>} Members with user details
 */
workspaceRouter.get(
  '/:workspaceId/members',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = req.params;

      logger.debug(
        { userId: req.user?.sub, workspaceId },
        'GET /members - Get workspace members'
      );

      const members = await workspaceService.getWorkspaceMembers(
        req. user!,
        workspaceId
      );

      logger.info({ count: members.length }, 'Members retrieved');

      res.json(successResponse(members));
    } catch (error) {
      logger.error({ error }, 'Get members failed');
      next(error);
    }
  }
);

/**
 * PATCH /v1/workspaces/:workspaceId/members/: userId/role
 * Update member role (admin/owner only)
 * 
 * @param {string} workspaceId - Workspace UUID
 * @param {string} userId - User UUID
 * @body {UpdateMemberRoleRequest} role
 * @returns {WorkspaceMemberRecord} Updated member
 */
workspaceRouter.patch(
  '/:workspaceId/members/:userId/role',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, userId } = req.params;
      const { role } = req.body as UpdateMemberRoleRequest;

      logger.debug(
        { userId: req.user?.sub, workspaceId, targetUserId: userId, role },
        'PATCH /members/:userId/role - Update member role'
      );

      if (!role) {
        throw new ValidationError('Role is required');
      }

      const member = await workspaceService.updateMemberRole(
        req.user! ,
        workspaceId,
        userId,
        role
      );

      logger.info({ userId }, 'Member role updated');

      res.json(successResponse(member));
    } catch (error) {
      logger.error({ error }, 'Update member role failed');
      next(error);
    }
  }
);

/**
 * DELETE /v1/workspaces/:workspaceId/members/:userId
 * Remove member from workspace (admin/owner only)
 * 
 * @param {string} workspaceId - Workspace UUID
 * @param {string} userId - User to remove
 */
workspaceRouter.delete(
  '/: workspaceId/members/:userId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, userId } = req.params;

      logger.debug(
        { userId: req. user?.sub, workspaceId, targetUserId: userId },
        'DELETE /members/:userId - Remove member'
      );

      await workspaceService.removeMemberFromWorkspace(
        req. user!,
        workspaceId,
        userId
      );

      logger.info({ userId }, 'Member removed');

      res.json(successResponse({ ok: true, message: 'Member removed' }));
    } catch (error) {
      logger.error({ error }, 'Remove member failed');
      next(error);
    }
  }
);

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * POST /v1/workspaces/: workspaceId/invites
 * Invite user to workspace (admin/owner only)
 * 
 * @param {string} workspaceId - Workspace UUID
 * @body {InviteUserRequest} email, role? 
 * @returns {WorkspaceInviteRecord} Created invite
 */
workspaceRouter.post(
  '/: workspaceId/invites',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = req.params;
      const { email, role } = req.body as InviteUserRequest;

      logger.debug(
        { userId: req. user?.sub, workspaceId, email },
        'POST /invites - Invite user'
      );

      if (!email) {
        throw new ValidationError('Email is required');
      }

      const invite = await workspaceService.inviteUserToWorkspace(
        req. user!,
        workspaceId,
        email,
        role || 'editor'
      );

      logger.info({ inviteId: invite.inviteId }, 'Invite created');

      res.status(201).json(successResponse(invite));
    } catch (error) {
      logger.error({ error }, 'Create invite failed');
      next(error);
    }
  }
);

/**
 * GET /v1/workspaces/:workspaceId/invites/pending
 * Get pending invites (admin/owner only)
 * 
 * @param {string} workspaceId - Workspace UUID
 * @returns {Array<WorkspaceInviteRecord>} Pending invites
 */
workspaceRouter.get(
  '/:workspaceId/invites/pending',
  async (req: AuthenticatedRequest, res: Response, next:  NextFunction) => {
    try {
      const { workspaceId } = req.params;

      logger.debug(
        { userId: req.user?.sub, workspaceId },
        'GET /invites/pending - Get pending invites'
      );

      const invites = await workspaceService.getPendingInvites(
        req.user! ,
        workspaceId
      );

      logger.info({ count: invites.length }, 'Pending invites retrieved');

      res.json(successResponse(invites));
    } catch (error) {
      logger.error({ error }, 'Get pending invites failed');
      next(error);
    }
  }
);

/**
 * POST /v1/invites/accept/: token
 * Accept workspace invitation
 * 
 * @param {string} token - Invite token from email
 * @returns {WorkspaceRecord} Joined workspace
 */
workspaceRouter.post(
  '/accept/:token',
  async (req: AuthenticatedRequest, res:  Response, next: NextFunction) => {
    try {
      const { token } = req.params;

      logger.debug(
        { userId: req.user?.sub, token },
        'POST /accept/:token - Accept invitation'
      );

      const workspace = await workspaceService.acceptInvitation(
        req.user!,
        token
      );

      logger.info({ workspaceId: workspace.workspaceId }, 'Invite accepted');

      res.json(successResponse(workspace));
    } catch (error) {
      logger.error({ error }, 'Accept invite failed');
      next(error);
    }
  }
);