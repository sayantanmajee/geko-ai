/**
 * Model Eligibility Checker
 * 
 * Comprehensive logic for determining if a user can use a specific model
 * Checks multiple dimensions: 
 * - Model active status
 * - Plan eligibility (user plan >= model required plan)
 * - Workspace enablement (model enabled in user's workspace)
 * - Local model installation status (for local models)
 * 
 * Provides detailed eligibility reasons for UI/API responses
 * 
 * @module helpers/eligibility
 */

import { createLogger } from '@package/shared-utils';
import type { ModelRecord, EligibilityCheckResult } from '../types/index.js';
import { isPlanEligible } from './validators.js';

const logger = createLogger('eligibility');

/**
 * Plan hierarchy for eligibility comparison
 * Used to determine if user's plan includes access to a model
 */
const PLAN_HIERARCHY:  Record<'free' | 'pro' | 'paygo', number> = {
  free: 0,
  pro: 1,
  paygo: 2,
};

/**
 * Check if user is eligible to use a specific model
 * 
 * Evaluates multiple eligibility criteria:
 * 1. Model must be active (not deprecated)
 * 2. User's plan must be >= model's required plan
 * 3. Model must be enabled in user's workspace
 * 
 * @param model - Model record to check eligibility for
 * @param userPlan - User's subscription plan (free, pro, paygo)
 * @param isEnabledForWorkspace - Whether model is enabled in workspace
 * @returns Object with eligibility result and detailed reasons
 * 
 * @example
 * const result = checkModelEligibility(model, 'pro', true);
 * if (! result.eligible) {
 *   console.log(result.reasons); // ["Model is not enabled for your workspace"]
 * }
 */
export function checkModelEligibility(
  model: ModelRecord,
  userPlan:  'free' | 'pro' | 'paygo',
  isEnabledForWorkspace: boolean
): { eligible: boolean; reasons: string[] } {
  const reasons:  string[] = [];

  logger. debug(
    {
      modelId: model.modelId,
      modelName: model.displayName,
      userPlan,
      isEnabledForWorkspace,
      modelPlan: model.plan,
      isActive: model.isActive,
    },
    'Checking model eligibility'
  );

  // Check 1: Model must be active
  if (!model.isActive) {
    logger.debug(
      { modelId: model.modelId },
      'Model is not active'
    );
    reasons.push('This model is no longer available or has been deprecated');
  }

  // Check 2: Plan eligibility
  // User plan must be >= model's required plan
  if (! isPlanEligible(userPlan, model.plan)) {
    const requiredPlan = model.plan;
    logger.debug(
      { modelId: model.modelId, userPlan, requiredPlan },
      'User plan insufficient'
    );

    // Provide helpful message about which plan is needed
    if (userPlan === 'free' && requiredPlan === 'pro') {
      reasons.push('This model requires a Pro plan or higher.  Upgrade to Pro to use it');
    } else if (userPlan === 'free' && requiredPlan === 'paygo') {
      reasons.push('This model requires a higher tier subscription (Pro or PayGo)');
    } else if (userPlan === 'pro' && requiredPlan === 'paygo') {
      reasons.push('This is a premium model.  Upgrade to PayGo plan for unrestricted access');
    }
  }

  // Check 3: Workspace enablement
  // Model must be enabled in the user's workspace
  if (!isEnabledForWorkspace) {
    logger.debug(
      { modelId: model.modelId },
      'Model not enabled for workspace'
    );
    reasons.push('This model is not enabled for your workspace. Contact your workspace admin');
  }

  const eligible = reasons.length === 0;

  logger.debug(
    {
      modelId: model.modelId,
      eligible,
      reasonCount: reasons.length,
    },
    'Eligibility check completed'
  );

  return { eligible, reasons };
}

/**
 * Get detailed ineligibility reasons for a model
 * 
 * Similar to checkModelEligibility but returns only the reasons array
 * Useful for UI that only needs reasons, not the eligible flag
 * 
 * @param model - Model to check
 * @param userPlan - User's plan
 * @param isEnabledForWorkspace - Workspace enablement status
 * @returns Array of human-readable ineligibility reasons
 */
export function getIneligibilityReasons(
  model:  ModelRecord,
  userPlan: 'free' | 'pro' | 'paygo',
  isEnabledForWorkspace: boolean
): string[] {
  const { reasons } = checkModelEligibility(
    model,
    userPlan,
    isEnabledForWorkspace
  );
  return reasons;
}

/**
 * Suggest a plan upgrade if user would be eligible with higher plan
 * 
 * Checks if upgrading to pro or paygo would make the model available
 * Useful for "upgrade to unlock" prompts in UI
 * 
 * @param currentPlan - User's current plan
 * @param modelRequiredPlan - Model's required plan
 * @returns Suggested plan to upgrade to, or null if already sufficient
 * 
 * @example
 * const suggested = suggestPlanUpgrade('free', 'pro');
 * // Returns 'pro'
 */
export function suggestPlanUpgrade(
  currentPlan: 'free' | 'pro' | 'paygo',
  modelRequiredPlan: 'free' | 'pro' | 'paygo'
): 'pro' | 'paygo' | null {
  logger.debug(
    { currentPlan, modelRequiredPlan },
    'Suggesting plan upgrade'
  );

  // If current plan already covers the model, no upgrade needed
  if (isPlanEligible(currentPlan, modelRequiredPlan)) {
    logger.debug({}, 'Current plan sufficient, no upgrade needed');
    return null;
  }

  // Suggest the minimum plan needed
  if (currentPlan === 'free' && modelRequiredPlan === 'pro') {
    logger.debug({}, 'Suggesting Pro upgrade');
    return 'pro';
  }

  if (currentPlan === 'free' && modelRequiredPlan === 'paygo') {
    logger.debug({}, 'Suggesting PayGo upgrade');
    return 'paygo';
  }

  if (currentPlan === 'pro' && modelRequiredPlan === 'paygo') {
    logger.debug({}, 'Suggesting PayGo upgrade');
    return 'paygo';
  }

  return null;
}

/**
 * Filter list of models to only those user can use
 * 
 * Returns only models that user is eligible for
 * Useful for generating eligible model list for chat
 * 
 * @param models - Array of models to filter
 * @param userPlan - User's subscription plan
 * @param enabledModelIds - Set of model IDs enabled in workspace
 * @returns Filtered array of eligible models
 * 
 * @example
 * const eligibleModels = filterEligibleModels(
 *   allModels,
 *   userPlan,
 *   new Set(enabledModelIds)
 * );
 */
export function filterEligibleModels(
  models: ModelRecord[],
  userPlan: 'free' | 'pro' | 'paygo',
  enabledModelIds: Set<string>
): ModelRecord[] {
  const eligible = models.filter(model => {
    const { eligible:  isEligible } = checkModelEligibility(
      model,
      userPlan,
      enabledModelIds. has(model.modelId)
    );
    return isEligible;
  });

  logger.debug(
    { total: models.length, eligible: eligible.length },
    'Filtered eligible models'
  );

  return eligible;
}

/**
 * Check if local model is ready for use
 * 
 * Local model is ready only if:
 * 1. Installation completed successfully
 * 2. Model is enabled in workspace
 * 
 * @param isInstalled - Whether model is installed
 * @param isEnabledForWorkspace - Whether model is enabled in workspace
 * @param installationStatus - Installation status (installed, installing, failed, notInstalled)
 * @returns True if model is ready to use
 */
export function isLocalModelReady(
  isInstalled: boolean,
  isEnabledForWorkspace: boolean,
  installationStatus: string
): boolean {
  const ready = isInstalled && 
                isEnabledForWorkspace && 
                installationStatus === 'installed';

  logger.debug(
    { isInstalled, isEnabledForWorkspace, installationStatus, ready },
    'Checked if local model is ready'
  );

  return ready;
}

/**
 * Get eligibility summary for a model
 * 
 * Comprehensive eligibility information in a single object
 * Used for detailed eligibility reports
 * 
 * @param model - Model to summarize
 * @param userPlan - User's subscription plan
 * @param isEnabledForWorkspace - Workspace enablement status
 * @param isLocalModelInstalled - Whether local model is installed (if applicable)
 * @returns Eligibility summary object
 */
export function getEligibilitySummary(
  model: ModelRecord,
  userPlan: 'free' | 'pro' | 'paygo',
  isEnabledForWorkspace: boolean,
  isLocalModelInstalled?:  boolean
): {
  modelId: string;
  modelName: string;
  eligible: boolean;
  reasons: string[];
  planRequirement: 'free' | 'pro' | 'paygo';
  userPlan: 'free' | 'pro' | 'paygo';
  isPlanSufficient: boolean;
  isEnabledForWorkspace:  boolean;
  suggestedPlan:  'pro' | 'paygo' | null;
  isLocalModel: boolean;
  isLocalModelInstalled?:  boolean;
  isLocalModelReady?:  boolean;
} {
  const { eligible, reasons } = checkModelEligibility(
    model,
    userPlan,
    isEnabledForWorkspace
  );

  const isPlanSufficient = isPlanEligible(userPlan, model.plan);
  const suggestedPlan = suggestPlanUpgrade(userPlan, model.plan);
  const isLocalModel = model.provider === 'ollama' || model.provider === 'llamacpp';
  const isLocalModelReady = isLocalModel && isLocalModelInstalled
    ?  isLocalModelReady(isLocalModelInstalled, isEnabledForWorkspace, 'installed')
    : undefined;

  logger.debug(
    {
      modelId: model.modelId,
      eligible,
      isPlanSufficient,
      isEnabledForWorkspace,
      isLocalModel,
    },
    'Generated eligibility summary'
  );

  return {
    modelId:  model.modelId,
    modelName: model.displayName,
    eligible,
    reasons,
    planRequirement: model.plan,
    userPlan,
    isPlanSufficient,
    isEnabledForWorkspace,
    suggestedPlan,
    isLocalModel,
    isLocalModelInstalled,
    isLocalModelReady,
  };
}

/**
 * Build eligibility response for API
 * 
 * Creates a comprehensive eligibility check result
 * Suitable for returning from API endpoints
 * 
 * @param model - Model to check
 * @param userPlan - User's plan
 * @param isEnabledForWorkspace - Workspace enablement
 * @returns EligibilityCheckResult for API response
 */
export function buildEligibilityCheckResult(
  model: ModelRecord,
  userPlan: 'free' | 'pro' | 'paygo',
  isEnabledForWorkspace:  boolean
): EligibilityCheckResult {
  const { eligible, reasons } = checkModelEligibility(
    model,
    userPlan,
    isEnabledForWorkspace
  );

  const suggestedPlan = suggestPlanUpgrade(userPlan, model.plan);

  return {
    modelId: model.modelId,
    modelName: model.displayName,
    eligible,
    reasons,
    suggestedPlan,
  };
}