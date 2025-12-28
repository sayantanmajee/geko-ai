/**
 * Migration 003: Billing & Subscriptions
 * 
 * Three pricing models: 
 * 1. FREE: No charge, limited tokens
 * 2. PRO: $29/month, unlimited, all models
 * 3. PAYGO: Per-token, ~$0.0002 per 1K tokens
 * 
 * Tables:
 * - subscriptions: Billing plan per workspace
 * - quotas: Usage limits
 * - invoices: Monthly bills
 */

-- Subscriptions: Billing plan for each workspace
CREATE TABLE IF NOT EXISTS subscriptions (
  subscriptionId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE UNIQUE,
  tenantId UUID NOT NULL REFERENCES tenants(tenantId) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'pro', 'paygo')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  
  -- Stripe integration
  stripeCustomerId VARCHAR(255),
  stripeSubscriptionId VARCHAR(255),
  
  -- Current month tracking
  currentMonthCost DECIMAL(10, 2) DEFAULT 0,
  budgetLimit DECIMAL(10, 2), -- For paygo tier
  
  -- Timestamps
  startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  renewedAt TIMESTAMP,
  cancelledAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE subscriptions IS 'Billing plan and status per workspace';
COMMENT ON COLUMN subscriptions.plan IS 'free=$0, pro=$29/mo, paygo=per-token';
COMMENT ON COLUMN subscriptions.currentMonthCost IS 'Reset monthly on renewal_date';

-- Quotas: Usage limits per workspace per month
CREATE TABLE IF NOT EXISTS quotas (
  quotaId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE UNIQUE,
  
  -- Limits (based on plan)
  tokensLimitPerMonth INTEGER NOT NULL,
  requestsLimitPerMonth INTEGER NOT NULL,
  
  -- Current month progress
  tokensUsedThisMonth INTEGER DEFAULT 0,
  requestsUsedThisMonth INTEGER DEFAULT 0,
  
  -- Reset schedule
  resetAt TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE quotas IS 'Usage limits and current month progress per workspace';
COMMENT ON COLUMN quotas.resetAt IS 'When this workspace quota resets (monthly)';

-- Invoices: Monthly billing records
CREATE TABLE IF NOT EXISTS invoices (
  invoiceId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspaceId UUID NOT NULL REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  tenantId UUID NOT NULL REFERENCES tenants(tenantId) ON DELETE CASCADE,
  
  -- Payment tracking
  stripeInvoiceId VARCHAR(255),
  amount INTEGER NOT NULL, -- In cents (e.g., 2900 = $29.00)
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  
  -- Status
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'failed')),
  
  -- Period
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  dueDate DATE NOT NULL,
  paidAt TIMESTAMP,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE invoices IS 'Monthly invoices sent to customers';
COMMENT ON COLUMN invoices.amount IS 'In cents to avoid floating point issues';
COMMENT ON COLUMN invoices.status IS 'draft→sent→paid (or failed)';

-- Model Pricing Matrix: Cost per model (can change over time)
CREATE TABLE IF NOT EXISTS model_pricing (
  pricingId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelId VARCHAR(255) NOT NULL REFERENCES model_catalog(modelId) ON DELETE CASCADE,
  costPer1mInputTokens DECIMAL(10, 8) NOT NULL,
  costPer1mOutputTokens DECIMAL(10, 8) NOT NULL,
  markupPercentage INTEGER NOT NULL DEFAULT 50, -- We charge 1.5x
  effectiveFrom DATE NOT NULL DEFAULT CURRENT_DATE,
  effectiveTo DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(modelId, effectiveFrom)
);

COMMENT ON TABLE model_pricing IS 'Historical pricing for models (tracks changes)';
COMMENT ON COLUMN model_pricing.markupPercentage IS 'Markup on cost (50% = we charge 1.5x what we pay)';

-- Indexes
CREATE INDEX idx_subscriptions_workspaceId ON subscriptions(workspaceId);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_quotas_workspaceId ON quotas(workspaceId);
CREATE INDEX idx_invoices_workspaceId ON invoices(workspaceId);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_periodStart ON invoices(periodStart);
CREATE INDEX idx_model_pricing_modelId ON model_pricing(modelId);
CREATE INDEX idx_model_pricing_effectiveFrom ON model_pricing(effectiveFrom);

-- Triggers
CREATE TRIGGER trigger_update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_quotas_updated_at
BEFORE UPDATE ON quotas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();