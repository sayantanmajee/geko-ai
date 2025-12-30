/**
 * Model Service Database Queries
 * 
 * All database operations for model management
 * - Parameterized queries prevent SQL injection
 * - Single responsibility:  execute queries, return data
 * - No business logic - that's in services layer
 * - Comprehensive error logging
 * 
 * @module db/queries
 */

import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '@package/shared-utils';
import { createLogger } from '@package/shared-utils';
import type {
  ModelRecord,
  WorkspaceModelRecord,
  LocalModelStatusRecord,
  ModelPricingRecord,
} from '../types/index.js';

const logger = createLogger('db-queries');

// ============================================================================
// MODEL CATALOG - Read Operations
// ============================================================================

/**
 * Get all models in catalog
 * Optionally filters to active models only
 * 
 * @param activeOnly - Filter to active models only (default: true)
 * @returns Array of model records ordered by name
 * @throws Database error if query fails
 */
export async function getAllModels(
  activeOnly:  boolean = true
): Promise<ModelRecord[]> {
  try {
    const whereClause = activeOnly ? 'WHERE isActive = true' : '';

    const results = await query<ModelRecord>(
      `SELECT modelId, name, displayName, description, provider, modelName,
              category, contextWindow, costPer1kInputTokens, costPer1kOutputTokens,
              plan, isActive, supportsStreaming, supportsFunctions, createdAt, updatedAt
       FROM model_catalog
       ${whereClause}
       ORDER BY name ASC`,
      []
    );

    logger.debug(
      { count: results.length, activeOnly },
      'Retrieved all models from database'
    );

    return results;
  } catch (error) {
    logger.error(
      { error, activeOnly },
      'Failed to retrieve all models from database'
    );
    throw error;
  }
}

/**
 * Get single model by ID
 * 
 * @param modelId - Model UUID
 * @returns Model record or null if not found
 * @throws Database error if query fails
 */
export async function getModelById(modelId: string): Promise<ModelRecord | null> {
  try {
    const results = await query<ModelRecord>(
      `SELECT modelId, name, displayName, description, provider, modelName,
              category, contextWindow, costPer1kInputTokens, costPer1kOutputTokens,
              plan, isActive, supportsStreaming, supportsFunctions, createdAt, updatedAt
       FROM model_catalog
       WHERE modelId = $1`,
      [modelId]
    );

    const found = results.length > 0;
    logger.debug(
      { modelId, found },
      `Retrieved model by ID - ${found ? 'found' :  'not found'}`
    );

    return results[0] || null;
  } catch (error) {
    logger.error(
      { error, modelId },
      'Failed to retrieve model by ID from database'
    );
    throw error;
  }
}

/**
 * Get models by provider
 * Always filters to active models
 * 
 * @param provider - Provider name (openai, anthropic, google, ollama, llamacpp, grok)
 * @returns Array of models from specified provider
 * @throws Database error if query fails
 */
export async function getModelsByProvider(
  provider: string
): Promise<ModelRecord[]> {
  try {
    const results = await query<ModelRecord>(
      `SELECT modelId, name, displayName, description, provider, modelName,
              category, contextWindow, costPer1kInputTokens, costPer1kOutputTokens,
              plan, isActive, supportsStreaming, supportsFunctions, createdAt, updatedAt
       FROM model_catalog
       WHERE provider = $1 AND isActive = true
       ORDER BY name ASC`,
      [provider]
    );

    logger.debug(
      { provider, count: results.length },
      'Retrieved models by provider from database'
    );

    return results;
  } catch (error) {
    logger.error(
      { error, provider },
      'Failed to retrieve models by provider from database'
    );
    throw error;
  }
}

/**
 * Get models by category
 * Always filters to active models
 * 
 * @param category - Category (chat, completion, embedding, image, audio)
 * @returns Array of models in specified category
 * @throws Database error if query fails
 */
export async function getModelsByCategory(
  category: string
): Promise<ModelRecord[]> {
  try {
    const results = await query<ModelRecord>(
      `SELECT modelId, name, displayName, description, provider, modelName,
              category, contextWindow, costPer1kInputTokens, costPer1kOutputTokens,
              plan, isActive, supportsStreaming, supportsFunctions, createdAt, updatedAt
       FROM model_catalog
       WHERE category = $1 AND isActive = true
       ORDER BY name ASC`,
      [category]
    );

    logger.debug(
      { category, count:  results.length },
      'Retrieved models by category from database'
    );

    return results;
  } catch (error) {
    logger.error(
      { error, category },
      'Failed to retrieve models by category from database'
    );
    throw error;
  }
}

/**
 * Get models available for a subscription plan
 * Returns models that are available at or below the specified plan
 * Free plan includes only free models
 * Pro plan includes free + pro models
 * Paygo plan includes all models
 * 
 * @param plan - Plan type (free, pro, paygo)
 * @returns Array of models available for plan
 * @throws Database error if query fails
 */
export async function getModelsByPlan(
  plan:  'free' | 'pro' | 'paygo'
): Promise<ModelRecord[]> {
  try {
    // Build CASE statement for plan eligibility
    const planCondition = plan === 'free'
      ? "plan = 'free'"
      : plan === 'pro'
        ? "plan IN ('free', 'pro')"
        : "plan IN ('free', 'pro', 'paygo')"; // paygo

    const results = await query<ModelRecord>(
      `SELECT modelId, name, displayName, description, provider, modelName,
              category, contextWindow, costPer1kInputTokens, costPer1kOutputTokens,
              plan, isActive, supportsStreaming, supportsFunctions, createdAt, updatedAt
       FROM model_catalog
       WHERE ${planCondition} AND isActive = true
       ORDER BY plan ASC, name ASC`,
      []
    );

    logger.debug(
      { plan, count: results.length },
      'Retrieved models by plan from database'
    );

    return results;
  } catch (error) {
    logger.error(
      { error, plan },
      'Failed to retrieve models by plan from database'
    );
    throw error;
  }
}

/**
 * Get free tier models
 * Only returns models with plan = 'free'
 * 
 * @returns Array of free tier models
 * @throws Database error if query fails
 */
export async function getFreeTierModels(): Promise<ModelRecord[]> {
  try {
    const results = await query<ModelRecord>(
      `SELECT modelId, name, displayName, description, provider, modelName,
              category, contextWindow, costPer1kInputTokens, costPer1kOutputTokens,
              plan, isActive, supportsStreaming, supportsFunctions, createdAt, updatedAt
       FROM model_catalog
       WHERE plan = 'free' AND isActive = true
       ORDER BY name ASC`,
      []
    );

    logger.debug(
      { count: results.length },
      'Retrieved free tier models from database'
    );

    return results;
  } catch (error) {
    logger.error({ error }, 'Failed to retrieve free tier models from database');
    throw error;
  }
}

/**
 * Get model pricing history
 * Returns all pricing records for a model, newest first
 * 
 * @param modelId - Model UUID
 * @returns Array of pricing records ordered by effective date descending
 * @throws Database error if query fails
 */
export async function getModelPricingHistory(
  modelId:  string
): Promise<ModelPricingRecord[]> {
  try {
    const results = await query<ModelPricingRecord>(
      `SELECT pricingId, modelId, costPer1kInputTokens, costPer1kOutputTokens,
              effectiveFrom, effectiveTo, createdAt
       FROM model_pricing
       WHERE modelId = $1
       ORDER BY effectiveFrom DESC`,
      [modelId]
    );

    logger.debug(
      { modelId, count: results.length },
      'Retrieved pricing history from database'
    );

    return results;
  } catch (error) {
    logger.error(
      { error, modelId },
      'Failed to retrieve pricing history from database'
    );
    throw error;
  }
}

/**
 * Get current pricing for a model
 * Returns the most recent pricing record that is currently effective
 * 
 * @param modelId - Model UUID
 * @returns Current pricing record or null if not found
 * @throws Database error if query fails
 */
export async function getCurrentModelPricing(
  modelId: string
): Promise<ModelPricingRecord | null> {
  try {
    const results = await query<ModelPricingRecord>(
      `SELECT pricingId, modelId, costPer1kInputTokens, costPer1kOutputTokens,
              effectiveFrom, effectiveTo, createdAt
       FROM model_pricing
       WHERE modelId = $1 AND (effectiveTo IS NULL OR effectiveTo > CURRENT_TIMESTAMP)
       ORDER BY effectiveFrom DESC
       LIMIT 1`,
      [modelId]
    );

    const found = results.length > 0;
    logger.debug(
      { modelId, found },
      'Retrieved current pricing from database'
    );

    return results[0] || null;
  } catch (error) {
    logger.error(
      { error, modelId },
      'Failed to retrieve current pricing from database'
    );
    throw error;
  }
}

// ============================================================================
// WORKSPACE MODELS - Eligibility Management
// ============================================================================

/**
 * Get all models enabled for a specific workspace
 * Joins with model_catalog to include full model details
 * 
 * @param workspaceId - Workspace UUID
 * @returns Array of enabled models with full details
 * @throws Database error if query fails
 */
export async function getWorkspaceModels(
  workspaceId: string
): Promise<(ModelRecord & { enabledAt: Date })[]> {
  try {
    const results = await query<ModelRecord & { enabledAt: Date }>(
      `SELECT mc.modelId, mc.name, mc.displayName, mc.description, mc.provider,
              mc.modelName, mc.category, mc.contextWindow, mc.costPer1kInputTokens,
              mc.costPer1kOutputTokens, mc.plan, mc.isActive, mc.supportsStreaming,
              mc.supportsFunctions, mc.createdAt, mc. updatedAt, wm.enabledAt
       FROM workspace_models wm
       INNER JOIN model_catalog mc ON wm.modelId = mc.modelId
       WHERE wm.workspaceId = $1 AND wm.isEnabled = true
       ORDER BY mc. name ASC`,
      [workspaceId]
    );

    logger.debug(
      { workspaceId, count: results. length },
      'Retrieved enabled models for workspace from database'
    );

    return results;
  } catch (error) {
    logger.error(
      { error, workspaceId },
      'Failed to retrieve workspace models from database'
    );
    throw error;
  }
}

/**
 * Check if a specific model is enabled for a workspace
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @returns True if model is enabled, false otherwise
 * @throws Database error if query fails
 */
export async function isModelEnabledForWorkspace(
  workspaceId: string,
  modelId: string
): Promise<boolean> {
  try {
    const results = await query<{ enabled: boolean }>(
      `SELECT isEnabled as enabled
       FROM workspace_models
       WHERE workspaceId = $1 AND modelId = $2`,
      [workspaceId, modelId]
    );

    const enabled = results[0]?.enabled ?? false;

    logger.debug(
      { workspaceId, modelId, enabled },
      'Checked if model is enabled for workspace'
    );

    return enabled;
  } catch (error) {
    logger.error(
      { error, workspaceId, modelId },
      'Failed to check model eligibility in database'
    );
    throw error;
  }
}

/**
 * Enable a model for a workspace
 * Creates a new workspace_models record or updates existing one
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @returns Created/updated workspace model record
 * @throws Database error if query fails
 */
export async function enableModelForWorkspace(
  workspaceId: string,
  modelId: string
): Promise<WorkspaceModelRecord> {
  const workspaceModelId = uuidv4();

  try {
    const results = await query<WorkspaceModelRecord>(
      `INSERT INTO workspace_models (workspaceModelId, workspaceId, modelId, isEnabled, enabledAt)
       VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
       ON CONFLICT (workspaceId, modelId)
       DO UPDATE SET isEnabled = true, enabledAt = CURRENT_TIMESTAMP, disabledAt = NULL
       RETURNING workspaceModelId, workspaceId, modelId, isEnabled, enabledAt, disabledAt`,
      [workspaceModelId, workspaceId, modelId]
    );

    logger.info(
      { workspaceId, modelId, workspaceModelId:  results[0]?.workspaceModelId },
      'Model enabled for workspace in database'
    );

    return results[0];
  } catch (error) {
    logger.error(
      { error, workspaceId, modelId },
      'Failed to enable model for workspace in database'
    );
    throw error;
  }
}

/**
 * Disable a model for a workspace
 * Sets isEnabled to false and records disablement time
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @throws Database error if query fails
 */
export async function disableModelForWorkspace(
  workspaceId: string,
  modelId: string
): Promise<void> {
  try {
    await execute(
      `UPDATE workspace_models
       SET isEnabled = false, disabledAt = CURRENT_TIMESTAMP
       WHERE workspaceId = $1 AND modelId = $2`,
      [workspaceId, modelId]
    );

    logger.info(
      { workspaceId, modelId },
      'Model disabled for workspace in database'
    );
  } catch (error) {
    logger.error(
      { error, workspaceId, modelId },
      'Failed to disable model for workspace in database'
    );
    throw error;
  }
}

// ============================================================================
// LOCAL MODEL STATUS - Installation Tracking
// ============================================================================

/**
 * Get installation status of a local model
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @returns Status record or null if not installed
 * @throws Database error if query fails
 */
export async function getLocalModelStatus(
  workspaceId:  string,
  modelId: string
): Promise<LocalModelStatusRecord | null> {
  try {
    const results = await query<LocalModelStatusRecord>(
      `SELECT statusId, workspaceId, modelId, status, installPath, installedAt,
              failureReason, diskUsageBytes, versionHash, createdAt, updatedAt
       FROM local_model_status
       WHERE workspaceId = $1 AND modelId = $2`,
      [workspaceId, modelId]
    );

    const found = results.length > 0;
    logger.debug(
      { workspaceId, modelId, found, status: results[0]?.status },
      'Retrieved local model status from database'
    );

    return results[0] || null;
  } catch (error) {
    logger.error(
      { error, workspaceId, modelId },
      'Failed to retrieve local model status from database'
    );
    throw error;
  }
}

/**
 * Get all installed local models for a workspace
 * Only returns models with status = 'installed'
 * 
 * @param workspaceId - Workspace UUID
 * @returns Array of installed model status records
 * @throws Database error if query fails
 */
export async function getInstalledLocalModels(
  workspaceId: string
): Promise<LocalModelStatusRecord[]> {
  try {
    const results = await query<LocalModelStatusRecord>(
      `SELECT statusId, workspaceId, modelId, status, installPath, installedAt,
              failureReason, diskUsageBytes, versionHash, createdAt, updatedAt
       FROM local_model_status
       WHERE workspaceId = $1 AND status = 'installed'
       ORDER BY installedAt DESC`,
      [workspaceId]
    );

    logger.debug(
      { workspaceId, count: results.length },
      'Retrieved installed local models from database'
    );

    return results;
  } catch (error) {
    logger.error(
      { error, workspaceId },
      'Failed to retrieve installed models from database'
    );
    throw error;
  }
}

/**
 * Create or update local model installation status
 * Upserts to handle both initial creation and updates
 * 
 * @param workspaceId - Workspace UUID
 * @param modelId - Model UUID
 * @param status - Installation status
 * @param installPath - Where model is installed (if installed)
 * @param diskUsageBytes - Disk space used (if installed)
 * @param failureReason - Error message (if failed)
 * @returns Updated status record
 * @throws Database error if query fails
 */
export async function upsertLocalModelStatus(
  workspaceId: string,
  modelId: string,
  status: 'notInstalled' | 'installing' | 'installed' | 'failed',
  installPath:  string | null = null,
  diskUsageBytes: number | null = null,
  failureReason:  string | null = null
): Promise<LocalModelStatusRecord> {
  const statusId = uuidv4();

  try {
    const results = await query<LocalModelStatusRecord>(
      `INSERT INTO local_model_status
       (statusId, workspaceId, modelId, status, installPath, diskUsageBytes, failureReason, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (workspaceId, modelId)
       DO UPDATE SET
         status = $4,
         installPath = CASE WHEN $4 != 'failed' THEN $5 ELSE installPath END,
         diskUsageBytes = CASE WHEN $4 = 'installed' THEN $6 ELSE diskUsageBytes END,
         failureReason = CASE WHEN $4 = 'failed' THEN $7 ELSE NULL END,
         installedAt = CASE WHEN $4 = 'installed' THEN CURRENT_TIMESTAMP ELSE installedAt END,
         updatedAt = CURRENT_TIMESTAMP
       RETURNING statusId, workspaceId, modelId, status, installPath, installedAt,
                 failureReason, diskUsageBytes, versionHash, createdAt, updatedAt`,
      [statusId, workspaceId, modelId, status, installPath, diskUsageBytes, failureReason]
    );

    logger.info(
      { workspaceId, modelId, status, statusId: results[0]?.statusId },
      'Upserted local model status in database'
    );

    return results[0];
  } catch (error) {
    logger.error(
      { error, workspaceId, modelId, status },
      'Failed to upsert local model status in database'
    );
    throw error;
  }
}

// ============================================================================
// STATISTICS & AGGREGATIONS
// ============================================================================

/**
 * Get model count by plan
 * Counts active models grouped by plan
 * 
 * @returns Object with counts per plan
 * @throws Database error if query fails
 */
export async function getModelCountByPlan(): Promise<Record<string, number>> {
  try {
    const results = await query<{ plan: string; count: number }>(
      `SELECT plan, COUNT(*) as count
       FROM model_catalog
       WHERE isActive = true
       GROUP BY plan`,
      []
    );

    const counts:  Record<string, number> = {};
    results.forEach(r => {
      counts[r. plan] = r.count;
    });

    logger.debug({ counts }, 'Retrieved model counts by plan from database');

    return counts;
  } catch (error) {
    logger.error(
      { error },
      'Failed to retrieve model counts by plan from database'
    );
    throw error;
  }
}

/**
 * Get model count by provider
 * Counts active models grouped by provider
 * 
 * @returns Object with counts per provider
 * @throws Database error if query fails
 */
export async function getModelCountByProvider(): Promise<Record<string, number>> {
  try {
    const results = await query<{ provider: string; count: number }>(
      `SELECT provider, COUNT(*) as count
       FROM model_catalog
       WHERE isActive = true
       GROUP BY provider`,
      []
    );

    const counts: Record<string, number> = {};
    results.forEach(r => {
      counts[r.provider] = r.count;
    });

    logger.debug({ counts }, 'Retrieved model counts by provider from database');

    return counts;
  } catch (error) {
    logger.error(
      { error },
      'Failed to retrieve model counts by provider from database'
    );
    throw error;
  }
}

/**
 * Get model count by category
 * Counts active models grouped by category
 * 
 * @returns Object with counts per category
 * @throws Database error if query fails
 */
export async function getModelCountByCategory(): Promise<Record<string, number>> {
  try {
    const results = await query<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count
       FROM model_catalog
       WHERE isActive = true
       GROUP BY category`,
      []
    );

    const counts: Record<string, number> = {};
    results.forEach(r => {
      counts[r.category] = r.count;
    });

    logger.debug({ counts }, 'Retrieved model counts by category from database');

    return counts;
  } catch (error) {
    logger.error(
      { error },
      'Failed to retrieve model counts by category from database'
    );
    throw error;
  }
}

/**
 * Get total active model count
 * 
 * @returns Total number of active models
 * @throws Database error if query fails
 */
export async function getTotalActiveModelCount(): Promise<number> {
  try {
    const results = await query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM model_catalog
       WHERE isActive = true`,
      []
    );

    const count = results[0]?.count ?? 0;

    logger. debug({ count }, 'Retrieved total active model count from database');

    return count;
  } catch (error) {
    logger.error(
      { error },
      'Failed to retrieve total model count from database'
    );
    throw error;
  }
}

/**
 * Get count of models that support streaming
 * 
 * @returns Number of models that support streaming
 * @throws Database error if query fails
 */
export async function getStreamingModelCount(): Promise<number> {
  try {
    const results = await query<{ count:  number }>(
      `SELECT COUNT(*) as count
       FROM model_catalog
       WHERE isActive = true AND supportsStreaming = true`,
      []
    );

    const count = results[0]?.count ??  0;

    logger.debug({ count }, 'Retrieved streaming model count from database');

    return count;
  } catch (error) {
    logger.error(
      { error },
      'Failed to retrieve streaming model count from database'
    );
    throw error;
  }
}

/**
 * Get count of models that support function calling
 * 
 * @returns Number of models that support functions
 * @throws Database error if query fails
 */
export async function getFunctionCallingModelCount(): Promise<number> {
  try {
    const results = await query<{ count:  number }>(
      `SELECT COUNT(*) as count
       FROM model_catalog
       WHERE isActive = true AND supportsFunctions = true`,
      []
    );

    const count = results[0]?.count ?? 0;

    logger.debug({ count }, 'Retrieved function calling model count from database');

    return count;
  } catch (error) {
    logger.error(
      { error },
      'Failed to retrieve function calling model count from database'
    );
    throw error;
  }
}