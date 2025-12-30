/**
 * Model Service - Business Logic Layer
 * 
 * Orchestrates model management operations: 
 * - Model catalog queries with caching
 * - Eligibility checking and filtering
 * - Workspace model management (enable/disable)
 * - Local model installation tracking
 * - Statistics and analytics
 * 
 * Implements: 
 * - Input validation
 * - Authorization checks
 * - Comprehensive error handling
 * - Structured logging
 * - Caching for performance
 * 
 * @module services/model
 */

import { createLogger } from '@package/shared-utils';
import { ValidationError, AppError, ErrorCode } from '@package/shared-types';
import type {
  JWTUser,
  ModelWithEligibility,
  EligibilityCheckResult,
  ModelStatistics,
  LocalModelInstallStatus,
} from '../types/index.js';
import * as db from '../db/queries.js';
import {
  validateModelId,
  validateWorkspaceId,
  validateProvider,
  validateCategory,
  validatePlan,
  validateInstallPath,
  validateDiskUsage,
  validateFailureReason,
} from '../helpers/validators.js';
import {
  checkModelEligibility,
  getIneligibilityReasons,
  suggestPlanUpgrade,
  filterEligibleModels,
  buildEligibilityCheckResult,
} from '../helpers/eligibility.js';

const logger = createLogger('model-service');

// ============================================================================
// CACHING
// ============================================================================

/**
 * Simple in-memory cache for models
 * Key: modelId, Value: model record
 */
const modelCache = new Map<string, any>();

/**
 * Cache for eligibility checks
 * Key: "${workspaceId}:${modelId}: ${plan}", Value: eligibility result
 */
const eligibilityCache = new Map<string, any>();

/**
 * Cache TTL from config (default 1 hour)
 * Set dynamically from config
 */
let CACHE_TTL = 3600000;
let ELIGIBILITY_CACHE_TTL = 1800000;

/**
 * Initialize cache TTL from config
 * 
 * @param cacheTTL - Cache TTL in milliseconds
 * @param eligibilityCacheTTL - Eligibility cache TTL in milliseconds
 */
export function initializeCacheTTL(cacheTTL: number, eligibilityCacheTTL: number): void {
  CACHE_TTL = cacheTTL;
  ELIGIBILITY_CACHE_TTL = eligibilityCacheTTL;
  logger.info(
    { CACHE_TTL, ELIGIBILITY_CACHE_TTL },
    'Cache TTL initialized'
  );
}

/**
 * Clear all caches
 * Useful for testing or manual cache invalidation
 */
export function clearAllCaches(): void {
  modelCache.clear();
  eligibilityCache.clear();
  logger.info('All caches cleared');
}

// ============================================================================
// MODEL CATALOG - Read Operations
// ============================================================================

/**
 * Get all available models in catalog
 * 
 * - Returns only active models
 * - Results are cached
 * - Ordered by name
 * 
 * @returns Array of all available models
 * @throws Database error
 */
export async function getAllModels(): Promise<any[]> {
  logger.info('Getting all models');

  try {
    // Check cache first
    const cacheKey = 'all_models';
    if (modelCache.has(cacheKey)) {
      logger.debug('Returning models from cache');
      return modelCache.get(cacheKey);
    }

    // Get from database
    const models = await db.getAllModels(true);

    logger.info(
      { count: models.length },
      'Retrieved all models from database'
    );

    // Cache for later
    modelCache.set(cacheKey, models);
    setTimeout(() => modelCache.delete(cacheKey), CACHE_TTL);

    return models;
  } catch (error) {
    logger.error({ error }, 'Failed to get all models');
    throw error;
  }
}

/**
 * Get specific model by ID
 * 
 * - Validates model ID format
 * - Caches result
 * - Includes pricing information
 * 
 * @param modelId - Model UUID
 * @returns Model record with pricing
 * @throws ValidationError, AppError
 */
export async function getModel(modelId: string): Promise<any> {
  logger.debug({ modelId }, 'Getting model details');

  try {
    // Validate input
    validateModelId(modelId);

    // Check cache first
    if (modelCache.has(modelId)) {
      logger.debug({ modelId }, 'Model from cache');
      return modelCache. get(modelId);
    }

    // Get from database
    const model = await db.getModelById(modelId);
    if (!model) {
      logger.warn({ modelId }, 'Model not found');
      throw new AppError(ErrorCode.NOT_FOUND, 'Model not found', 404);
    }

    // Get current pricing
    const pricing = await db.getCurrentModelPricing(modelId);

    const result = { ...model, currentPricing: pricing };

    // Cache it
    modelCache.set(modelId, result);
    setTimeout(() => modelCache.delete(modelId), CACHE_TTL);

    logger.info({ modelId }, 'Model retrieved successfully');

    return result;
  } catch (error) {
    logger.error({ error, modelId }, 'Failed to get model');
    throw error;
  }
}

/**
 * Get models by provider
 * 
 * @param provider - Provider name (openai, anthropic, google, ollama, llamacpp, grok)
 * @returns Array of models from provider
 * @throws ValidationError, Database error
 */
export async function getModelsByProvider(provider: string): Promise<any[]> {
  logger.debug({ provider }, 'Getting models by provider');

  try {
    // Validate provider
    validateProvider(provider);

    // Check cache
    const cacheKey = `provider: ${provider}`;
    if (modelCache.has(cacheKey)) {
      logger.debug({ provider }, 'Provider models from cache');
      return modelCache.get(cacheKey);
    }

    // Get from database
    const models = await db. getModelsByProvider(provider);

    logger.info(
      { provider, count: models.length },
      'Provider models retrieved'
    );

    // Cache it
    modelCache.set(cacheKey, models);
    setTimeout(() => modelCache.delete(cacheKey), CACHE_TTL);

    return models;
  } catch (error) {
    logger.error({ error, provider }, 'Failed to get provider models');
    throw error;
  }
}

/**
 * Get models by category
 * 
 * @param category - Category (chat, completion, embedding, image, audio)
 * @returns Array of models in category
 * @throws ValidationError, Database error
 */
export async function getModelsByCategory(category: string): Promise<any[]> {
  logger.debug({ category }, 'Getting models by category');

  try {
    // Validate category
    validateCategory(category);

    // Check cache
    const cacheKey = `category:${category}`;
    if (modelCache.has(cacheKey)) {
      logger.debug({ category }, 'Category models from cache');
      return modelCache.get(cacheKey);
    }

    // Get from database
    const models = await db.getModelsByCategory(category);

    logger.info(
      { category, count: models.length },
      'Category models retrieved'
    );

    // Cache it
    modelCache.set(cacheKey, models);
    setTimeout(() => modelCache.delete(cacheKey), CACHE_TTL);

    return models;
  } catch (error) {
    logger.error({ error, category }, 'Failed to get category models');
    throw error;
  }
}

/**
 * Get free tier models
 * 
 * @returns Array of models available on free plan
 * @throws Database error
 */
export async function getFreeTierModels(): Promise<any[]> {
  logger. debug('Getting free tier models');

  try {
    // Check cache
    const cacheKey = 'plan:free';
    if (modelCache.has(cacheKey)) {
      logger.debug('Free tier models from cache');
      return modelCache.get(cacheKey);
    }

    // Get from database
    const models = await db.getFreeTierModels();

    logger.info(
      { count: models.length },
      'Free tier models retrieved'
    );

    // Cache it
    modelCache.set(cacheKey, models);
    setTimeout(() => modelCache.delete(cacheKey), CACHE_TTL);

    return models;
  } catch (error) {
    logger.error({ error }, 'Failed to get free tier models');
    throw error;
  }
}

/**
 * Get models available for a plan
 * 
 * @param plan - Plan (free, pro, paygo)
 * @returns Models available for plan
 * @throws ValidationError, Database error
 */
export async function getModelsByPlan(plan: string): Promise<any[]> {
  logger.debug({ plan }, 'Getting models by plan');

  try {
    // Validate plan
    validatePlan(plan);

    // Check cache
    const cacheKey = `plan:${plan}`;
    if (modelCache.has(cacheKey)) {
      logger.debug({ plan }, 'Plan models from cache');
      return modelCache.get(cacheKey);
    }

    // Get from database
    const models = await db.getModelsByPlan(plan as 'free' | 'pro' | 'paygo');

    logger.info(
      { plan, count: models.length },
      'Plan models retrieved'
    );

    // Cache it
    modelCache.set(cacheKey, models);
    setTimeout(() => modelCache.delete(cacheKey), CACHE_TTL);

    return models;
  } catch (error) {
    logger.error({ error, plan }, 'Failed to get plan models');
    throw error;
  }
}

// ============================================================================
// WORKSPACE MODELS - Eligibility & Management
// ============================================================================

/**
 * Get eligible models for workspace
 * 
 * Returns all models with eligibility status
 * Includes flags for:
 * - isEnabledForWorkspace
 * - userCanUse (based on plan + enablement)
 * - ineligibilityReasons (why not eligible)
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @param userPlan - User's subscription plan
 * @returns Array of models with eligibility info
 * @throws ValidationError, Database error
 */
export async function getEligibleModelsForWorkspace(
  user:  JWTUser,
  workspaceId: string,
  userPlan: 'free' | 'pro' | 'paygo'
): Promise<ModelWithEligibility[]> {
  logger.info(
    { userId: user.sub, workspaceId, userPlan },
    'Getting eligible models for workspace'
  );

  try {
    // Validate inputs
    validateWorkspaceId(workspaceId);
    validatePlan(userPlan);

    // Get all active models
    const allModels = await getAllModels();

    // Get enabled models for workspace
    const workspaceModels = await db.getWorkspaceModels(workspaceId);
    const enabledModelIds = new Set(workspaceModels. map(m => m.modelId));

    // Check eligibility for each model
    const eligibleModels:  ModelWithEligibility[] = allModels.map(model => {
      const { eligible, reasons } = checkModelEligibility(
        model,
        userPlan,
        enabledModelIds. has(model.modelId)
      );

      return {
        ...model,
        isEnabledForWorkspace: enabledModelIds.has(model. modelId),
        userCanUse: eligible,
        ineligibilityReasons: reasons,
      };
    });

    const eligibleCount = eligibleModels.filter(m => m.userCanUse).length;

    logger.info(
      { workspaceId, total: allModels.length, eligible: eligibleCount },
      'Eligible models determined'
    );

    return eligibleModels;
  } catch (error) {
    logger.error({ error, workspaceId }, 'Failed to get eligible models');
    throw error;
  }
}

/**
 * Check if user can use specific model
 * 
 * Comprehensive eligibility check with reasons
 * Includes suggestion for plan upgrade if applicable
 * 
 * @param user - Authenticated user
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @param userPlan - User's subscription plan
 * @returns Eligibility check result
 * @throws ValidationError, AppError
 */
export async function checkModelEligibilityForUser(
  user: JWTUser,
  workspaceId: string,
  modelId:  string,
  userPlan:  'free' | 'pro' | 'paygo'
): Promise<EligibilityCheckResult> {
  logger.info(
    { userId: user. sub, workspaceId, modelId, userPlan },
    'Checking model eligibility'
  );

  try {
    // Validate inputs
    validateModelId(modelId);
    validateWorkspaceId(workspaceId);
    validatePlan(userPlan);

    // Check cache first
    const cacheKey = `${workspaceId}:${modelId}:${userPlan}`;
    if (eligibilityCache.has(cacheKey)) {
      logger.debug({ modelId }, 'Eligibility from cache');
      return eligibilityCache.get(cacheKey);
    }

    // Get model
    const model = await db.getModelById(modelId);
    if (!model) {
      logger.warn({ modelId }, 'Model not found');
      throw new AppError(ErrorCode.NOT_FOUND, 'Model not found', 404);
    }

    // Check if enabled for workspace
    const isEnabled = await db.isModelEnabledForWorkspace(workspaceId, modelId);

    // Build eligibility result
    const result = buildEligibilityCheckResult(model, userPlan, isEnabled);

    logger.info(
      { modelId, eligible: result.eligible },
      'Model eligibility determined'
    );

    // Cache result
    eligibilityCache. set(cacheKey, result);
    setTimeout(() => eligibilityCache.delete(cacheKey), ELIGIBILITY_CACHE_TTL);

    return result;
  } catch (error) {
    logger.error({ error, modelId }, 'Failed to check eligibility');
    throw error;
  }
}

/**
 * Enable model for workspace
 * 
 * Makes model available to workspace members
 * Authorization check should be done by caller (admin/owner only)
 * 
 * @param user - Authenticated user (should be admin/owner)
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @returns Created workspace model record
 * @throws ValidationError, AppError
 */
export async function enableModelForWorkspace(
  user: JWTUser,
  workspaceId: string,
  modelId: string
): Promise<any> {
  logger.info(
    { userId: user.sub, workspaceId, modelId },
    'Enabling model for workspace'
  );

  try {
    // Validate inputs
    validateModelId(modelId);
    validateWorkspaceId(workspaceId);

    // Verify model exists
    const model = await db. getModelById(modelId);
    if (!model) {
      logger.warn({ modelId }, 'Model not found');
      throw new AppError(ErrorCode.NOT_FOUND, 'Model not found', 404);
    }

    // Enable model
    const result = await db.enableModelForWorkspace(workspaceId, modelId);

    // Invalidate eligibility cache for this workspace
    eligibilityCache. forEach((value, key) => {
      if (key.startsWith(workspaceId)) {
        eligibilityCache.delete(key);
      }
    });

    logger.info(
      { workspaceId, modelId },
      'Model enabled successfully'
    );

    return result;
  } catch (error) {
    logger.error({ error, modelId }, 'Failed to enable model');
    throw error;
  }
}

/**
 * Disable model for workspace
 * 
 * Removes model from workspace availability
 * Authorization check should be done by caller (admin/owner only)
 * 
 * @param user - Authenticated user (should be admin/owner)
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @throws ValidationError, AppError
 */
export async function disableModelForWorkspace(
  user: JWTUser,
  workspaceId: string,
  modelId: string
): Promise<void> {
  logger.info(
    { userId: user.sub, workspaceId, modelId },
    'Disabling model for workspace'
  );

  try {
    // Validate inputs
    validateModelId(modelId);
    validateWorkspaceId(workspaceId);

    // Disable model
    await db.disableModelForWorkspace(workspaceId, modelId);

    // Invalidate eligibility cache for this workspace
    eligibilityCache.forEach((value, key) => {
      if (key.startsWith(workspaceId)) {
        eligibilityCache.delete(key);
      }
    });

    logger.info(
      { workspaceId, modelId },
      'Model disabled successfully'
    );
  } catch (error) {
    logger.error({ error, modelId }, 'Failed to disable model');
    throw error;
  }
}

// ============================================================================
// LOCAL MODELS - Installation & Status
// ============================================================================

/**
 * Get installed local models for workspace
 * 
 * @param workspaceId - Workspace UUID
 * @returns Array of installed models
 * @throws ValidationError, Database error
 */
export async function getInstalledLocalModels(
  workspaceId: string
): Promise<any[]> {
  logger.debug({ workspaceId }, 'Getting installed local models');

  try {
    // Validate input
    validateWorkspaceId(workspaceId);

    // Get from database
    const models = await db.getInstalledLocalModels(workspaceId);

    logger.info(
      { workspaceId, count: models.length },
      'Installed models retrieved'
    );

    return models;
  } catch (error) {
    logger.error({ error, workspaceId }, 'Failed to get installed models');
    throw error;
  }
}

/**
 * Get local model installation status
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @returns Installation status info
 * @throws ValidationError, Database error
 */
export async function getLocalModelInstallationStatus(
  workspaceId:  string,
  modelId: string
): Promise<LocalModelInstallStatus> {
  logger.debug(
    { workspaceId, modelId },
    'Getting installation status'
  );

  try {
    // Validate inputs
    validateWorkspaceId(workspaceId);
    validateModelId(modelId);

    // Get status from database
    const status = await db.getLocalModelStatus(workspaceId, modelId);

    if (!status) {
      logger.debug({ modelId }, 'Model not installed');
      return {
        modelId,
        status: 'notInstalled',
        installPath: null,
        diskUsageGB: null,
        progress: 0,
        errorMessage: null,
        installedAt: null,
      };
    }

    // Convert bytes to GB
    const diskUsageGB = status.diskUsageBytes
      ? parseFloat((status.diskUsageBytes / 1024 / 1024 / 1024).toFixed(2))
      : null;

    const result: LocalModelInstallStatus = {
      modelId,
      status: status.status,
      installPath: status.installPath,
      diskUsageGB,
      progress:  status.status === 'installing' ? 50 : (status.status === 'installed' ? 100 : 0),
      errorMessage: status.failureReason,
      installedAt:  status.installedAt,
    };

    logger.info(
      { modelId, status: status.status },
      'Status retrieved'
    );

    return result;
  } catch (error) {
    logger.error({ error, modelId }, 'Failed to get installation status');
    throw error;
  }
}

/**
 * Start local model installation
 * 
 * Marks model as "installing" in database
 * Installation happens asynchronously elsewhere
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @returns Updated status record
 * @throws ValidationError, Database error
 */
export async function startLocalModelInstallation(
  workspaceId: string,
  modelId: string
): Promise<any> {
  logger.info(
    { workspaceId, modelId },
    'Starting local model installation'
  );

  try {
    // Validate inputs
    validateWorkspaceId(workspaceId);
    validateModelId(modelId);

    // Update status to installing
    const status = await db.upsertLocalModelStatus(
      workspaceId,
      modelId,
      'installing',
      null,
      null,
      null
    );

    logger.info({ modelId }, 'Installation started');

    return status;
  } catch (error) {
    logger.error({ error, modelId }, 'Failed to start installation');
    throw error;
  }
}

/**
 * Complete local model installation
 * 
 * Marks model as successfully installed
 * Records installation path and disk usage
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @param installPath - Installation path
 * @param diskUsageBytes - Disk space used
 * @returns Updated status record
 * @throws ValidationError, Database error
 */
export async function completeLocalModelInstallation(
  workspaceId: string,
  modelId:  string,
  installPath: string,
  diskUsageBytes:  number
): Promise<any> {
  logger.info(
    { workspaceId, modelId, installPath, diskUsageGB: (diskUsageBytes / 1024 / 1024 / 1024).toFixed(2) },
    'Completing local model installation'
  );

  try {
    // Validate inputs
    validateWorkspaceId(workspaceId);
    validateModelId(modelId);
    validateInstallPath(installPath);
    validateDiskUsage(diskUsageBytes);

    // Update status to installed
    const status = await db.upsertLocalModelStatus(
      workspaceId,
      modelId,
      'installed',
      installPath,
      diskUsageBytes,
      null
    );

    logger.info({ modelId }, 'Installation completed');

    return status;
  } catch (error) {
    logger.error({ error, modelId }, 'Failed to complete installation');
    throw error;
  }
}

/**
 * Mark local model installation as failed
 * 
 * Records failure reason for troubleshooting
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @param reason - Error/failure reason
 * @returns Updated status record
 * @throws ValidationError, Database error
 */
export async function failLocalModelInstallation(
  workspaceId: string,
  modelId: string,
  reason: string
): Promise<any> {
  logger.warn(
    { workspaceId, modelId, reason },
    'Recording local model installation failure'
  );

  try {
    // Validate inputs
    validateWorkspaceId(workspaceId);
    validateModelId(modelId);
    validateFailureReason(reason);

    // Update status to failed
    const status = await db.upsertLocalModelStatus(
      workspaceId,
      modelId,
      'failed',
      null,
      null,
      reason
    );

    logger.info({ modelId }, 'Installation failure recorded');

    return status;
  } catch (error) {
    logger.error({ error, modelId }, 'Failed to record installation failure');
    throw error;
  }
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get model statistics
 * 
 * Returns aggregate information about models
 * Useful for dashboards and analytics
 * 
 * @returns Model statistics object
 * @throws Database error
 */
export async function getModelStatistics(): Promise<ModelStatistics> {
  logger. debug('Getting model statistics');

  try {
    // Check cache first
    const cacheKey = 'statistics';
    if (modelCache.has(cacheKey)) {
      logger.debug('Statistics from cache');
      return modelCache.get(cacheKey);
    }

    // Get counts from database
    const byPlan = await db.getModelCountByPlan();
    const byProvider = await db.getModelCountByProvider();
    const byCategory = await db.getModelCountByCategory();
    const activeModels = await db.getTotalActiveModelCount();
    const streamingModels = await db.getStreamingModelCount();

    const stats: ModelStatistics = {
      totalModels: activeModels,
      byPlan:  (byPlan as unknown) as Record<'free' | 'pro' | 'paygo', number>,
      byProvider,
      byCategory,
      activeModels,
      localModelsSupported: byProvider['ollama'] || 0 + byProvider['llamacpp'] || 0,
    };

    logger.info(stats, 'Statistics retrieved');

    // Cache it
    modelCache.set(cacheKey, stats);
    setTimeout(() => modelCache.delete(cacheKey), CACHE_TTL);

    return stats;
  } catch (error) {
    logger.error({ error }, 'Failed to get statistics');
    throw error;
  }
}