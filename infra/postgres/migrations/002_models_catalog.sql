/**
 * Migration 002: Model Catalog
 * 
 * Defines all available AI models (global)
 * - modelCatalog: What models are available, pricing, requirements
 * - workspaceModels: Which models enabled for each workspace
 * - localModelStatus: Installation status of local models
 * 
 * Model selection flow:
 * 1. Check modelCatalog (exists?)
 * 2. Check workspaceModels (enabled for this workspace?)
 * 3. Check user's plan (eligible?)
 * 4. Return model or error
 */

-- Model Catalog: All available models (global)
CREATE TABLE IF NOT EXISTS model_catalog (
  catalogId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelId VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek', 'ollama')),
  displayName VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing (in USD per 1M tokens)
  costPer1mInputTokens DECIMAL(10, 8) NOT NULL DEFAULT 0,
  costPer1mOutputTokens DECIMAL(10, 8) NOT NULL DEFAULT 0,
  
  -- Access control:  Which plan can use this? 
  minPlan VARCHAR(50) NOT NULL CHECK (minPlan IN ('free', 'pro', 'paygo')),
  
  -- Local vs Cloud
  isLocal BOOLEAN NOT NULL DEFAULT FALSE,
  isFreeTier BOOLEAN NOT NULL DEFAULT FALSE,
  freeTierTokensPerMonth INTEGER,
  freeTierRequestsPerMonth INTEGER,
  
  -- Lifecycle
  releasedAt TIMESTAMP NOT NULL,
  deprecatedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE model_catalog IS 'Global catalog of available models (OpenAI, Anthropic, Ollama, etc)';
COMMENT ON COLUMN model_catalog.minPlan IS 'free=everyone, pro=paid users, paygo=enterprise';
COMMENT ON COLUMN model_catalog.isLocal IS 'true=runs on user device, false=cloud API';
COMMENT ON COLUMN model_catalog.isFreeTier IS 'true=provider offers free tier usage';

-- Workspace Models: Which models enabled for each workspace
CREATE TABLE IF NOT EXISTS workspace_models (
  workspaceModelId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  modelId VARCHAR(255) NOT NULL REFERENCES model_catalog(modelId) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  costOverride DECIMAL(10, 8), -- Allow admin to override pricing
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- One model per workspace
  UNIQUE(workspaceId, modelId)
);

COMMENT ON TABLE workspace_models IS 'Enable/disable models per workspace (allows admin customization)';
COMMENT ON COLUMN workspace_models.enabled IS 'true=team can use, false=hidden from team';
COMMENT ON COLUMN workspace_models.costOverride IS 'NULL=use catalog price, VALUE=override for this workspace';

-- Local Model Status:  Installation tracking for Ollama/LLaMA. cpp models
CREATE TABLE IF NOT EXISTS local_model_status (
  statusId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  modelId VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('notInstalled', 'downloading', 'ready', 'error')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  errorMessage TEXT,
  installedSizeMb DECIMAL(10, 2),
  lastChecked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(workspaceId, modelId)
);

COMMENT ON TABLE local_model_status IS 'Tracks installation progress of local models on user devices';
COMMENT ON COLUMN local_model_status.status IS 'notInstalled=never tried, downloading=in progress, ready=can use, error=failed';

-- Indexes
CREATE INDEX idx_model_catalog_provider ON model_catalog(provider);
CREATE INDEX idx_model_catalog_minPlan ON model_catalog(minPlan);
CREATE INDEX idx_workspace_models_workspaceId ON workspace_models(workspaceId);
CREATE INDEX idx_workspace_models_enabled ON workspace_models(enabled);
CREATE INDEX idx_local_model_status_workspaceId ON local_model_status(workspaceId);
CREATE INDEX idx_local_model_status_status ON local_model_status(status);

-- Triggers
CREATE TRIGGER trigger_update_model_catalog_updated_at
BEFORE UPDATE ON model_catalog
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_workspace_models_updated_at
BEFORE UPDATE ON workspace_models
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();