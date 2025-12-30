/**
 * Model Routes
 * 
 * HTTP endpoint definitions using controller functions
 * - Controllers handle request/response
 * - Services handle business logic
 * - Routes wire them together
 * 
 * @module routes/models
 */

import { Router } from 'express';
import { createLogger } from '@package/shared-utils';
import { authMiddleware } from '../middleware/auth.js';
import * as modelController from '../controllers/model.controller.js';

const logger = createLogger('model-routes');
export const modelRouter: Router = Router();

logger.info('Registering model routes');

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * GET /v1/models
 * Get all available models
 */
modelRouter.get('/', modelController.getAllModelsController);

/**
 * GET /v1/models/:modelId
 * Get specific model by ID
 */
modelRouter. get('/:modelId', modelController.getModelController);

/**
 * GET /v1/models/provider/:provider
 * Get models by provider
 */
modelRouter.get('/provider/:provider', modelController.getModelsByProviderController);

/**
 * GET /v1/models/category/:category
 * Get models by category
 */
modelRouter. get('/category/:category', modelController.getModelsByCategoryController);

/**
 * GET /v1/models/plan/:plan
 * Get models by plan
 */
modelRouter.get('/plan/:plan', modelController.getModelsByPlanController);

/**
 * GET /v1/models/free/available
 * Get free tier models
 */
modelRouter.get('/free/available', modelController. getFreeTierModelsController);

/**
 * GET /v1/models/stats/summary
 * Get model statistics
 */
modelRouter.get('/stats/summary', modelController.getModelStatisticsController);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

// Apply authentication to all remaining routes
modelRouter.use(authMiddleware);

/**
 * GET /v1/workspaces/:workspaceId/models
 * Get eligible models for workspace
 */
modelRouter.get(
  '/workspaces/:workspaceId/models',
  modelController. getEligibleModelsForWorkspaceController
);

/**
 * POST /v1/workspaces/:workspaceId/models/: modelId/check
 * Check model eligibility
 */
modelRouter.post(
  '/workspaces/:workspaceId/models/:modelId/check',
  modelController. checkModelEligibilityController
);

/**
 * POST /v1/workspaces/:workspaceId/models/:modelId/enable
 * Enable model for workspace
 */
modelRouter. post(
  '/workspaces/:workspaceId/models/: modelId/enable',
  modelController.enableModelForWorkspaceController
);

/**
 * POST /v1/workspaces/:workspaceId/models/: modelId/disable
 * Disable model for workspace
 */
modelRouter.post(
  '/workspaces/:workspaceId/models/:modelId/disable',
  modelController.disableModelForWorkspaceController
);

// ============================================================================
// LOCAL MODEL ROUTES
// ============================================================================

/**
 * GET /v1/workspaces/:workspaceId/local-models
 * Get installed local models
 */
modelRouter.get(
  '/workspaces/:workspaceId/local-models',
  modelController. getInstalledLocalModelsController
);

/**
 * GET /v1/workspaces/: workspaceId/local-models/:modelId/status
 * Get local model installation status
 */
modelRouter. get(
  '/workspaces/:workspaceId/local-models/:modelId/status',
  modelController.getLocalModelStatusController
);

/**
 * POST /v1/workspaces/:workspaceId/local-models/:modelId/install
 * Start local model installation
 */
modelRouter.post(
  '/workspaces/:workspaceId/local-models/:modelId/install',
  modelController.startLocalModelInstallationController
);

/**
 * POST /v1/workspaces/:workspaceId/local-models/:modelId/complete
 * Complete local model installation
 */
modelRouter. post(
  '/workspaces/:workspaceId/local-models/:modelId/complete',
  modelController.completeLocalModelInstallationController
);

/**
 * POST /v1/workspaces/:workspaceId/local-models/:modelId/fail
 * Mark installation as failed
 */
modelRouter.post(
  '/workspaces/:workspaceId/local-models/:modelId/fail',
  modelController.failLocalModelInstallationController
);

logger.info('✓ All model routes registered');