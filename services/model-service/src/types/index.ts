/**
 * Model Service Type Definitions
 * 
 * Defines all data models, API request/response types, and domain objects
 * Ensures type safety across the service
 * 
 * @module types
 */

/**
 * Model record from database
 * Represents an AI model in the catalog
 */
export interface ModelRecord {
  modelId: string;
  name: string;
  displayName: string;
  description:  string | null;
  provider: 'openai' | 'anthropic' | 'google' | 'ollama' | 'llamacpp' | 'grok';
  modelName: string; // Provider's actual model identifier (e.g., "gpt-4o")
  category: 'chat' | 'completion' | 'embedding' | 'image' | 'audio';
  contextWindow: number; // Maximum tokens
  costPer1kInputTokens: number; // USD
  costPer1kOutputTokens: number; // USD
  plan: 'free' | 'pro' | 'paygo'; // Minimum plan required
  isActive: boolean;
  supportsStreaming: boolean;
  supportsFunctions: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workspace model eligibility record
 * Tracks which models are enabled for a specific workspace
 */
export interface WorkspaceModelRecord {
  workspaceModelId: string;
  workspaceId: string;
  modelId: string;
  isEnabled: boolean;
  enabledAt: Date;
  disabledAt:  Date | null;
}

/**
 * Local model installation status
 * Tracks installation state of local models (Ollama, LLaMA. cpp)
 */
export interface LocalModelStatusRecord {
  statusId: string;
  workspaceId: string;
  modelId: string;
  status: 'notInstalled' | 'installing' | 'installed' | 'failed';
  installPath: string | null;
  installedAt: Date | null;
  failureReason: string | null;
  diskUsageBytes: number | null;
  versionHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model pricing record
 * Historical pricing data for cost tracking and analytics
 */
export interface ModelPricingRecord {
  pricingId: string;
  modelId: string;
  costPer1kInputTokens:  number;
  costPer1kOutputTokens: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
}

/**
 * Model with eligibility information
 * Used in API responses to include eligibility flags
 */
export interface ModelWithEligibility extends ModelRecord {
  isEnabledForWorkspace: boolean;
  userCanUse: boolean;
  ineligibilityReasons?:  string[];
}

/**
 * Eligibility check result
 * Result of checking if a user can use a specific model
 */
export interface EligibilityCheckResult {
  modelId: string;
  modelName: string;
  eligible: boolean;
  reasons:  string[]; // Why not eligible (empty if eligible)
  suggestedPlan?:  'pro' | 'paygo'; // Suggested plan to upgrade to
}

/**
 * Local model installation status response
 * API response for installation status
 */
export interface LocalModelInstallStatus {
  modelId: string;
  status: 'notInstalled' | 'installing' | 'installed' | 'failed';
  installPath:  string | null;
  diskUsageGB: number | null;
  progress: number; // 0-100 for installing
  errorMessage:  string | null;
  installedAt: Date | null;
}

/**
 * Model statistics
 * Aggregate information about models in catalog
 */
export interface ModelStatistics {
  totalModels:  number;
  byPlan: Record<'free' | 'pro' | 'paygo', number>;
  byProvider: Record<string, number>;
  byCategory:  Record<string, number>;
  activeModels: number;
  localModelsSupported: number;
}

/**
 * JWT user from authentication middleware
 * Extracted from JWT token in request
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
 * Extended Express Request with user attached
 * Used by authenticated routes
 */
export interface AuthenticatedRequest extends Express.Request {
  user?: JWTUser;
}

/**
 * Cost estimate for a model usage
 * Calculated based on estimated token usage
 */
export interface CostEstimate {
  modelId: string;
  modelName:  string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedInputCost: number;
  estimatedOutputCost: number;
  estimatedTotalCost:  number;
  currency: string; // 'USD'
}

/**
 * Model list filter parameters
 * Used for querying models with filters
 */
export interface ModelFilterParams {
  provider?: string;
  category?: string;
  plan?: 'free' | 'pro' | 'paygo';
  activeOnly?: boolean;
  supportsStreaming?: boolean;
  supportsFunctions?: boolean;
}

/**
 * Pagination parameters
 * Used for list endpoints
 */
export interface PaginationParams {
  limit:  number;
  offset: number;
}