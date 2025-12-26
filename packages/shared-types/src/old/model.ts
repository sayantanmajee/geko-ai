import { PlanType } from "./billing";

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'ollama';
// export type PlanType = 'free' | 'pro' | 'paygo';

export interface ModelPrice {
  costPer1mInputTokens: number;
  costPer1mOutputTokens: number;
}

export interface ModelCatalog {
  catalogId: string;
  modelId: string;
  provider: ModelProvider;
  displayName: string;
  description?:  string;
  pricing: ModelPrice;
  minPlan: PlanType;
  isLocal: boolean;
  isFreeTier: boolean;
  freeTierTokensPerMonth?:  number;
  freeTierRequestsPerMonth?: number;
  releasedAt:  Date;
  deprecatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceModel {
  workspaceModelId: string;
  workspaceId: string;
  modelId: string;
  enabled: boolean;
  customCostOverride?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalModelStatus {
  modelId: string;
  status: 'not_installed' | 'downloading' | 'ready' | 'error';
  progress?:  number;
  errorMessage?: string;
  installedSizeMb?: number;
  lastChecked:  Date;
}