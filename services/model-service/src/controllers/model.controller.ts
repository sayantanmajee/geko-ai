/**
 * Model Controller
 * 
 * HTTP request/response handling layer
 * - Parses and validates incoming requests
 * - Calls service layer for business logic
 * - Formats and returns responses
 * - Handles request-level errors
 * 
 * Responsibility separation:
 * - Controller: HTTP handling
 * - Service: Business logic
 * - Database: Data access
 * 
 * @module controllers/model
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@package/shared-utils';
import { ValidationError } from '@package/shared-types';
import * as modelService from '../services/model.service.js';
import { successResponse } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

const logger = createLogger('model-controller');

// ============================================================================
// PUBLIC CONTROLLERS (No authentication required)
// ============================================================================

/**
 * Get all available models
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function getAllModelsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.debug('getAllModelsController - Processing request');

    // Call service layer
    const models = await modelService.getAllModels();

    // Return success response
    res.json(successResponse(models));
  } catch (error) {
    logger.error({ error }, 'getAllModelsController - Error');
    next(error);
  }
}

/**
 * Get specific model by ID
 * 
 * @param req - Express request with modelId param
 * @param res - Express response
 * @param next - Express next function
 */
export async function getModelController(
  req: Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    const { modelId } = req.params;

    logger.debug({ modelId }, 'getModelController - Processing request');

    // Validate input
    if (!modelId) {
      throw new ValidationError('modelId is required');
    }

    // Call service layer
    const model = await modelService.getModel(modelId);

    // Return success response
    res.json(successResponse(model));
  } catch (error) {
    logger.error({ error }, 'getModelController - Error');
    next(error);
  }
}

/**
 * Get models by provider
 * 
 * @param req - Express request with provider param
 * @param res - Express response
 * @param next - Express next function
 */
export async function getModelsByProviderController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { provider } = req.params;

    logger.debug({ provider }, 'getModelsByProviderController - Processing request');

    // Validate input
    if (!provider) {
      throw new ValidationError('provider is required');
    }

    // Call service layer
    const models = await modelService.getModelsByProvider(provider);

    // Return success response
    res.json(successResponse(models));
  } catch (error) {
    logger.error({ error }, 'getModelsByProviderController - Error');
    next(error);
  }
}

/**
 * Get models by category
 * 
 * @param req - Express request with category param
 * @param res - Express response
 * @param next - Express next function
 */
export async function getModelsByCategoryController(
  req:  Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category } = req.params;

    logger. debug({ category }, 'getModelsByCategoryController - Processing request');

    // Validate input
    if (!category) {
      throw new ValidationError('category is required');
    }

    // Call service layer
    const models = await modelService.getModelsByCategory(category);

    // Return success response
    res.json(successResponse(models));
  } catch (error) {
    logger.error({ error }, 'getModelsByCategoryController - Error');
    next(error);
  }
}

/**
 * Get models by plan
 * 
 * @param req - Express request with plan param
 * @param res - Express response
 * @param next - Express next function
 */
export async function getModelsByPlanController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { plan } = req.params;

    logger.debug({ plan }, 'getModelsByPlanController - Processing request');

    // Validate input
    if (!plan) {
      throw new ValidationError('plan is required');
    }

    if (! ['free', 'pro', 'paygo'].includes(plan)) {
      throw new ValidationError('Invalid plan.  Must be:  free, pro, or paygo');
    }

    // Call service layer
    const models = await modelService.getModelsByPlan(plan);

    // Return success response
    res.json(successResponse(models));
  } catch (error) {
    logger.error({ error }, 'getModelsByPlanController - Error');
    next(error);
  }
}

/**
 * Get free tier models
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function getFreeTierModelsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger. debug('getFreeTierModelsController - Processing request');

    // Call service layer
    const models = await modelService.getFreeTierModels();

    // Return success response
    res.json(successResponse(models));
  } catch (error) {
    logger.error({ error }, 'getFreeTierModelsController - Error');
    next(error);
  }
}

/**
 * Get model statistics
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function getModelStatisticsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger. debug('getModelStatisticsController - Processing request');

    // Call service layer
    const stats = await modelService.getModelStatistics();

    // Return success response
    res.json(successResponse(stats));
  } catch (error) {
    logger.error({ error }, 'getModelStatisticsController - Error');
    next(error);
  }
}

// ============================================================================
// PROTECTED CONTROLLERS (Authentication required)
// ============================================================================

/**
 * Get eligible models for workspace
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function getEligibleModelsForWorkspaceController(
  req: AuthenticatedRequest,
  res: Response,
  next:  NextFunction
): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const { plan = 'free' } = req. query;

    logger.debug(
      { userId: req.user?.sub, workspaceId, plan },
      'getEligibleModelsForWorkspaceController - Processing request'
    );

    // Validate inputs
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    if (!plan || !['free', 'pro', 'paygo'].includes(plan as string)) {
      throw new ValidationError(
        'Invalid or missing plan parameter. Must be: free, pro, or paygo'
      );
    }

    // Call service layer
    const models = await modelService.getEligibleModelsForWorkspace(
      req.user! ,
      workspaceId,
      plan as 'free' | 'pro' | 'paygo'
    );

    // Return success response
    res.json(successResponse(models));
  } catch (error) {
    logger.error({ error }, 'getEligibleModelsForWorkspaceController - Error');
    next(error);
  }
}

/**
 * Check model eligibility for user
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function checkModelEligibilityController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId, modelId } = req.params;
    const { plan = 'free' } = req.body;

    logger.debug(
      { userId: req.user?. sub, workspaceId, modelId, plan },
      'checkModelEligibilityController - Processing request'
    );

    // Validate inputs
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    if (!modelId) {
      throw new ValidationError('modelId is required');
    }

    if (!plan || !['free', 'pro', 'paygo']. includes(plan)) {
      throw new ValidationError('Invalid plan');
    }

    // Call service layer
    const result = await modelService.checkModelEligibilityForUser(
      req.user!,
      workspaceId,
      modelId,
      plan as 'free' | 'pro' | 'paygo'
    );

    // Return success response
    res.json(successResponse(result));
  } catch (error) {
    logger.error({ error }, 'checkModelEligibilityController - Error');
    next(error);
  }
}

/**
 * Enable model for workspace
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function enableModelForWorkspaceController(
  req: AuthenticatedRequest,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId, modelId } = req.params;

    logger.debug(
      { userId: req.user?.sub, workspaceId, modelId },
      'enableModelForWorkspaceController - Processing request'
    );

    // Validate inputs
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    if (!modelId) {
      throw new ValidationError('modelId is required');
    }

    // Call service layer
    const result = await modelService.enableModelForWorkspace(
      req. user!,
      workspaceId,
      modelId
    );

    // Return success response with 201 Created
    res.status(201).json(successResponse(result));
  } catch (error) {
    logger.error({ error }, 'enableModelForWorkspaceController - Error');
    next(error);
  }
}

/**
 * Disable model for workspace
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function disableModelForWorkspaceController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId, modelId } = req. params;

    logger.debug(
      { userId: req.user?.sub, workspaceId, modelId },
      'disableModelForWorkspaceController - Processing request'
    );

    // Validate inputs
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    if (!modelId) {
      throw new ValidationError('modelId is required');
    }

    // Call service layer
    await modelService.disableModelForWorkspace(req.user!, workspaceId, modelId);

    // Return success response
    res.json(successResponse({ ok: true, message: 'Model disabled' }));
  } catch (error) {
    logger.error({ error }, 'disableModelForWorkspaceController - Error');
    next(error);
  }
}

// ============================================================================
// LOCAL MODEL CONTROLLERS
// ============================================================================

/**
 * Get installed local models for workspace
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function getInstalledLocalModelsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId } = req.params;

    logger.debug(
      { userId: req. user?.sub, workspaceId },
      'getInstalledLocalModelsController - Processing request'
    );

    // Validate input
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    // Call service layer
    const models = await modelService.getInstalledLocalModels(workspaceId);

    // Return success response
    res.json(successResponse(models));
  } catch (error) {
    logger.error({ error }, 'getInstalledLocalModelsController - Error');
    next(error);
  }
}

/**
 * Get local model installation status
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function getLocalModelStatusController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId, modelId } = req.params;

    logger.debug(
      { userId: req. user?.sub, modelId },
      'getLocalModelStatusController - Processing request'
    );

    // Validate inputs
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    if (!modelId) {
      throw new ValidationError('modelId is required');
    }

    // Call service layer
    const status = await modelService. getLocalModelInstallationStatus(
      workspaceId,
      modelId
    );

    // Return success response
    res.json(successResponse(status));
  } catch (error) {
    logger.error({ error }, 'getLocalModelStatusController - Error');
    next(error);
  }
}

/**
 * Start local model installation
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function startLocalModelInstallationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId, modelId } = req.params;

    logger.debug(
      { userId: req. user?.sub, modelId },
      'startLocalModelInstallationController - Processing request'
    );

    // Validate inputs
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    if (!modelId) {
      throw new ValidationError('modelId is required');
    }

    // Call service layer
    const result = await modelService.startLocalModelInstallation(
      workspaceId,
      modelId
    );

    // Return 202 Accepted (installation is asynchronous)
    res.status(202).json(successResponse(result));
  } catch (error) {
    logger.error({ error }, 'startLocalModelInstallationController - Error');
    next(error);
  }
}

/**
 * Complete local model installation
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function completeLocalModelInstallationController(
  req:  AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId, modelId } = req.params;
    const { installPath, diskUsageBytes } = req.body;

    logger.debug(
      { userId: req.user?.sub, modelId, installPath },
      'completeLocalModelInstallationController - Processing request'
    );

    // Validate inputs
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    if (!modelId) {
      throw new ValidationError('modelId is required');
    }

    if (!installPath) {
      throw new ValidationError('installPath is required');
    }

    if (!diskUsageBytes) {
      throw new ValidationError('diskUsageBytes is required');
    }

    if (typeof diskUsageBytes !== 'number' || diskUsageBytes < 0) {
      throw new ValidationError('diskUsageBytes must be a non-negative number');
    }

    // Call service layer
    const result = await modelService.completeLocalModelInstallation(
      workspaceId,
      modelId,
      installPath,
      diskUsageBytes
    );

    // Return success response
    res.json(successResponse(result));
  } catch (error) {
    logger.error({ error }, 'completeLocalModelInstallationController - Error');
    next(error);
  }
}

/**
 * Mark local model installation as failed
 * 
 * @param req - Authenticated request
 * @param res - Express response
 * @param next - Express next function
 */
export async function failLocalModelInstallationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId, modelId } = req.params;
    const { reason } = req.body;

    logger.debug(
      { userId: req.user?.sub, modelId, reason },
      'failLocalModelInstallationController - Processing request'
    );

    // Validate inputs
    if (!workspaceId) {
      throw new ValidationError('workspaceId is required');
    }

    if (!modelId) {
      throw new ValidationError('modelId is required');
    }

    if (!reason) {
      throw new ValidationError('reason is required');
    }

    if (typeof reason !== 'string' || reason.trim().length === 0) {
      throw new ValidationError('reason must be a non-empty string');
    }

    // Call service layer
    const result = await modelService.failLocalModelInstallation(
      workspaceId,
      modelId,
      reason
    );

    // Return success response
    res.json(successResponse(result));
  } catch (error) {
    logger.error({ error }, 'failLocalModelInstallationController - Error');
    next(error);
  }
}