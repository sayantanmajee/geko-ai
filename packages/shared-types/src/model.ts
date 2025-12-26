/**
 * Model Catalog & Management
 * 
 * Model Catalog:  All available AI models (global)
 * Workspace Model: Which models are enabled for a workspace
 * 
 * Model selection logic:
 * 1. Check ModelCatalog for availability
 * 2. Check WorkspaceModel for enablement
 * 3. Check Workspace. plan for eligibility
 * 4. Return model or "upgrade required" error
 */

import type { UUID, Timestamp, PlanType } from './common';

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'ollama';

/**
 * Model catalog entry (read-only, updated by admin)
 */
export interface ModelCatalog {
  catalogId: string;
  modelId: string;
  provider: ModelProvider;
  displayName: string;
  description?:  string;
  
  // Pricing (all in USD per 1M tokens)
  costPerMInputTokens:  number;
  costPerMOutputTokens: number;
  
  // Access control
  minPlan: PlanType;       // 'free' models available to all
  isLocal: boolean;        // true = runs on user device
  isFreeTier: boolean;     // true = provider offers free tier
  freeTierTokensPerMonth?:  number;
  
  // Lifecycle
  releasedAt: Timestamp;
  deprecatedAt?: Timestamp;
  createdAt: Timestamp;
}

/**
 * Workspace-specific model config
 * Allows per-workspace customization (e.g., disable GPT-4)
 */
export interface WorkspaceModel {
  workspaceModelId: string;
  workspaceId: string;
  modelId: string;
  enabled: boolean;
  costOverride?: number;   // Custom pricing for this workspace
  createdAt: Timestamp;
}

/**
 * Local model installation status
 */
export interface LocalModelStatus {
  modelId: string;
  status: 'notInstalled' | 'downloading' | 'ready' | 'error';
  progress?:  number;       // 0-100%
  errorMessage?: string;
  installedSizeMb?: number;
  lastChecked: Timestamp;
}

/**
 * Model eligibility check result
 * Used to determine if user can use a model
 */
export interface ModelEligibility {
  modelId: string;
  canUse: boolean;
  reason?: 'quotaExceeded' | 'planUpgradeRequired' | 'disabledByAdmin';
  upgradeRequired?: boolean;
}