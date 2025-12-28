/**
 * Migration 004: Usage Tracking
 * 
 * Records every AI model call for: 
 * - Billing (know what to charge)
 * - Analytics (what models are used)
 * - Quota enforcement (when to block)
 * 
 * Critical:  This table will grow quickly
 * Strategy: Partition by month or archive old data
 */

-- Token Usage:  Every AI call
CREATE TABLE IF NOT EXISTS token_usage (
  usageId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
  modelId VARCHAR(255) NOT NULL REFERENCES model_catalog(modelId) ON DELETE CASCADE,
  conversationId VARCHAR(255), -- From LibreChat
  
  -- Tokens from AI provider
  inputTokens INTEGER NOT NULL DEFAULT 0,
  outputTokens INTEGER NOT NULL DEFAULT 0,
  
  -- Cost calculation
  costToUs DECIMAL(10, 8) NOT NULL DEFAULT 0, -- What we paid provider
  chargeToUser DECIMAL(10, 8) NOT NULL DEFAULT 0, -- What we charge (with markup)
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE token_usage IS 'Every AI API call recorded for billing and analytics';
COMMENT ON COLUMN token_usage.costToUs IS 'Provider cost (OpenAI, Anthropic, etc)';
COMMENT ON COLUMN token_usage.chargeToUser IS 'What user is charged (may include markup)';

-- Monthly Usage Rollup: Faster querying than aggregating token_usage
CREATE TABLE IF NOT EXISTS monthly_usage (
  monthlyUsageId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- "2024-01" format
  
  totalTokensUsed INTEGER NOT NULL DEFAULT 0,
  totalCostToUs DECIMAL(10, 2) NOT NULL DEFAULT 0,
  totalChargeToUser DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(workspaceId, month)
);

COMMENT ON TABLE monthly_usage IS 'Pre-aggregated monthly usage (faster queries than rolling up token_usage)';

-- Model-specific usage breakdown
CREATE TABLE IF NOT EXISTS model_usage (
  modelUsageId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  modelId VARCHAR(255) NOT NULL REFERENCES model_catalog(modelId) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  
  tokensUsed INTEGER NOT NULL DEFAULT 0,
  costToUs DECIMAL(10, 2) NOT NULL DEFAULT 0,
  chargeToUser DECIMAL(10, 2) NOT NULL DEFAULT 0,
  callCount INTEGER NOT NULL DEFAULT 0,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(workspaceId, modelId, month)
);

COMMENT ON TABLE model_usage IS 'Breakdown by model per month (for analytics dashboard)';

-- Indexes for fast querying
CREATE INDEX idx_token_usage_workspaceId ON token_usage(workspaceId);
CREATE INDEX idx_token_usage_userId ON token_usage(userId);
CREATE INDEX idx_token_usage_modelId ON token_usage(modelId);
CREATE INDEX idx_token_usage_createdAt ON token_usage(createdAt);
CREATE INDEX idx_token_usage_workspace_created ON token_usage(workspaceId, createdAt);

CREATE INDEX idx_monthly_usage_workspaceId ON monthly_usage(workspaceId);
CREATE INDEX idx_monthly_usage_month ON monthly_usage(month);

CREATE INDEX idx_model_usage_workspaceId ON model_usage(workspaceId);
CREATE INDEX idx_model_usage_modelId ON model_usage(modelId);
CREATE INDEX idx_model_usage_month ON model_usage(month);

-- Trigger
CREATE TRIGGER trigger_update_monthly_usage_updated_at
BEFORE UPDATE ON monthly_usage
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();