/**
 * Validation Helpers
 * 
 * Input validation and data integrity check functions
 * - Format validation (UUID, email, etc.)
 * - Enum validation
 * - Plan eligibility checking
 * - Safe casting with type predicates
 * 
 * All functions return boolean or throw ValidationError
 * 
 * @module helpers/validators
 */

import { createLogger } from '@package/shared-utils';
import { ValidationError } from '@package/shared-types';

const logger = createLogger('validators');

/**
 * Validate UUID format
 * Checks for valid UUID v4 format
 * 
 * @param id - ID to validate
 * @param fieldName - Field name for error messages
 * @returns True if valid UUID
 * @throws {ValidationError} If invalid format
 */
export function validateUUID(id: string, fieldName: string = 'ID'): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!id || typeof id !== 'string') {
    logger.warn({ fieldName, provided: typeof id }, 'Invalid ID type');
    throw new ValidationError(`${fieldName} must be a string`);
  }

  if (!uuidRegex.test(id)) {
    logger.warn({ fieldName, provided: id }, 'Invalid UUID format');
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }

  return true;
}

/**
 * Validate model ID format
 * 
 * @param modelId - Model ID to validate
 * @throws {ValidationError} If invalid
 */
export function validateModelId(modelId: string): boolean {
  return validateUUID(modelId, 'modelId');
}

/**
 * Validate workspace ID format
 * 
 * @param workspaceId - Workspace ID to validate
 * @throws {ValidationError} If invalid
 */
export function validateWorkspaceId(workspaceId: string): boolean {
  return validateUUID(workspaceId, 'workspaceId');
}

/**
 * Validate model provider
 * Checks if provided string is a valid provider enum value
 * 
 * @param provider - Provider to validate
 * @returns Provider if valid
 * @throws {ValidationError} If invalid provider
 */
export function validateProvider(
  provider: string
): provider is 'openai' | 'anthropic' | 'google' | 'ollama' | 'llamacpp' | 'grok' {
  const validProviders = ['openai', 'anthropic', 'google', 'ollama', 'llamacpp', 'grok'];

  if (!provider || typeof provider !== 'string') {
    logger.warn({ provided: provider }, 'Invalid provider type');
    throw new ValidationError('Provider must be a string');
  }

  if (!validProviders.includes(provider)) {
    logger.warn(
      { provided: provider, valid: validProviders },
      'Invalid provider value'
    );
    throw new ValidationError(
      `Provider must be one of: ${validProviders.join(', ')}`
    );
  }

  return true;
}

/**
 * Validate model category
 * Checks if provided string is a valid category enum value
 * 
 * @param category - Category to validate
 * @returns Category if valid
 * @throws {ValidationError} If invalid category
 */
export function validateCategory(
  category: string
): category is 'chat' | 'completion' | 'embedding' | 'image' | 'audio' {
  const validCategories = ['chat', 'completion', 'embedding', 'image', 'audio'];

  if (!category || typeof category !== 'string') {
    logger.warn({ provided: category }, 'Invalid category type');
    throw new ValidationError('Category must be a string');
  }

  if (!validCategories. includes(category)) {
    logger.warn(
      { provided: category, valid: validCategories },
      'Invalid category value'
    );
    throw new ValidationError(
      `Category must be one of: ${validCategories.join(', ')}`
    );
  }

  return true;
}

/**
 * Validate subscription plan
 * Checks if provided string is a valid plan enum value
 * 
 * @param plan - Plan to validate
 * @param fieldName - Field name for error messages (optional)
 * @returns Plan if valid
 * @throws {ValidationError} If invalid plan
 */
export function validatePlan(
  plan: string,
  fieldName: string = 'plan'
): plan is 'free' | 'pro' | 'paygo' {
  const validPlans = ['free', 'pro', 'paygo'];

  if (!plan || typeof plan !== 'string') {
    logger.warn({ fieldName, provided: plan }, 'Invalid plan type');
    throw new ValidationError(`${fieldName} must be a string`);
  }

  if (!validPlans.includes(plan)) {
    logger.warn(
      { fieldName, provided:  plan, valid: validPlans },
      'Invalid plan value'
    );
    throw new ValidationError(
      `${fieldName} must be one of:  ${validPlans.join(', ')}`
    );
  }

  return true;
}

/**
 * Validate local model status
 * 
 * @param status - Status to validate
 * @returns Status if valid
 * @throws {ValidationError} If invalid
 */
export function validateLocalModelStatus(
  status: string
): status is 'notInstalled' | 'installing' | 'installed' | 'failed' {
  const validStatuses = ['notInstalled', 'installing', 'installed', 'failed'];

  if (!status || typeof status !== 'string') {
    logger.warn({ provided: status }, 'Invalid status type');
    throw new ValidationError('Status must be a string');
  }

  if (!validStatuses.includes(status)) {
    logger.warn(
      { provided: status, valid: validStatuses },
      'Invalid status value'
    );
    throw new ValidationError(
      `Status must be one of: ${validStatuses. join(', ')}`
    );
  }

  return true;
}

/**
 * Check if user plan is eligible for model plan
 * Plan hierarchy: free (0) < pro (1) < paygo (2)
 * User must have plan >= model's required plan
 * 
 * @param userPlan - User's subscription plan
 * @param requiredPlan - Model's required plan
 * @returns True if eligible, false otherwise
 */
export function isPlanEligible(
  userPlan: 'free' | 'pro' | 'paygo',
  requiredPlan: 'free' | 'pro' | 'paygo'
): boolean {
  const planHierarchy:  Record<'free' | 'pro' | 'paygo', number> = {
    free: 0,
    pro: 1,
    paygo: 2,
  };

  const eligible = planHierarchy[userPlan] >= planHierarchy[requiredPlan];

  logger.debug(
    { userPlan, requiredPlan, eligible },
    'Checked plan eligibility'
  );

  return eligible;
}

/**
 * Validate cost value
 * Must be non-negative and reasonable (< $1000 per 1k tokens)
 * 
 * @param cost - Cost to validate
 * @throws {ValidationError} If invalid
 */
export function validateCost(cost: number): boolean {
  if (typeof cost !== 'number' || isNaN(cost)) {
    logger.warn({ cost }, 'Invalid cost type');
    throw new ValidationError('Cost must be a number');
  }

  if (cost < 0) {
    logger.warn({ cost }, 'Cost cannot be negative');
    throw new ValidationError('Cost cannot be negative');
  }

  if (cost > 1000) {
    logger.warn({ cost }, 'Cost exceeds maximum');
    throw new ValidationError('Cost cannot exceed $1000 per 1k tokens');
  }

  return true;
}

/**
 * Validate context window (token limit)
 * Must be positive and reasonable (1 to 1,000,000)
 * 
 * @param contextWindow - Context window in tokens
 * @throws {ValidationError} If invalid
 */
export function validateContextWindow(contextWindow: number): boolean {
  if (typeof contextWindow !== 'number' || isNaN(contextWindow)) {
    logger.warn({ contextWindow }, 'Invalid context window type');
    throw new ValidationError('Context window must be a number');
  }

  if (contextWindow < 1) {
    logger.warn({ contextWindow }, 'Context window too small');
    throw new ValidationError('Context window must be at least 1');
  }

  if (contextWindow > 1000000) {
    logger.warn({ contextWindow }, 'Context window too large');
    throw new ValidationError('Context window cannot exceed 1,000,000');
  }

  return true;
}

/**
 * Validate installation path
 * Must be non-empty string, max 500 characters
 * 
 * @param path - Installation path
 * @throws {ValidationError} If invalid
 */
export function validateInstallPath(path: string | null): boolean {
  if (path === null) {
    return true; // Null is allowed
  }

  if (typeof path !== 'string') {
    logger.warn({ path }, 'Invalid path type');
    throw new ValidationError('Installation path must be a string');
  }

  if (path.length === 0) {
    logger.warn({}, 'Installation path is empty');
    throw new ValidationError('Installation path cannot be empty');
  }

  if (path. length > 500) {
    logger.warn({ length: path.length }, 'Installation path too long');
    throw new ValidationError('Installation path cannot exceed 500 characters');
  }

  return true;
}

/**
 * Validate disk usage in bytes
 * Must be non-negative number
 * 
 * @param bytes - Disk usage in bytes
 * @throws {ValidationError} If invalid
 */
export function validateDiskUsage(bytes: number | null): boolean {
  if (bytes === null) {
    return true; // Null is allowed
  }

  if (typeof bytes !== 'number' || isNaN(bytes)) {
    logger.warn({ bytes }, 'Invalid disk usage type');
    throw new ValidationError('Disk usage must be a number');
  }

  if (bytes < 0) {
    logger.warn({ bytes }, 'Disk usage cannot be negative');
    throw new ValidationError('Disk usage cannot be negative');
  }

  return true;
}

/**
 * Validate error message for failure reason
 * 
 * @param reason - Failure reason
 * @throws {ValidationError} If invalid
 */
export function validateFailureReason(reason: string): boolean {
  if (!reason || typeof reason !== 'string') {
    logger.warn({ reason }, 'Invalid failure reason');
    throw new ValidationError('Failure reason must be a non-empty string');
  }

  if (reason.length > 1000) {
    logger.warn({ length: reason.length }, 'Failure reason too long');
    throw new ValidationError('Failure reason cannot exceed 1000 characters');
  }

  return true;
}

/**
 * Validate pagination limit
 * Must be positive, max 100
 * 
 * @param limit - Pagination limit
 * @throws {ValidationError} If invalid
 */
export function validatePaginationLimit(limit: number): boolean {
  if (typeof limit !== 'number' || isNaN(limit)) {
    logger.warn({ limit }, 'Invalid limit type');
    throw new ValidationError('Limit must be a number');
  }

  if (limit < 1) {
    logger.warn({ limit }, 'Limit too small');
    throw new ValidationError('Limit must be at least 1');
  }

  if (limit > 100) {
    logger.warn({ limit }, 'Limit too large');
    throw new ValidationError('Limit cannot exceed 100');
  }

  return true;
}

/**
 * Validate pagination offset
 * Must be non-negative
 * 
 * @param offset - Pagination offset
 * @throws {ValidationError} If invalid
 */
export function validatePaginationOffset(offset: number): boolean {
  if (typeof offset !== 'number' || isNaN(offset)) {
    logger.warn({ offset }, 'Invalid offset type');
    throw new ValidationError('Offset must be a number');
  }

  if (offset < 0) {
    logger.warn({ offset }, 'Offset cannot be negative');
    throw new ValidationError('Offset cannot be negative');
  }

  return true;
}