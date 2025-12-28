/**
 * Migration 008: Indexes & Constraints (Performance)
 * 
 * Adds additional indexes and constraints for: 
 * - Query performance optimization
 * - Data integrity
 * - Preventing invalid states
 */

-- Full-text search indexes (for future:  search conversations)
CREATE INDEX idx_audit_logs_action_tsearch ON audit_logs USING gin(
  to_tsvector('english', action || ' ' || COALESCE(resourceType, ''))
);

-- Composite indexes for common query patterns
CREATE INDEX idx_users_tenantId_status ON users(tenantId, status);
CREATE INDEX idx_workspaces_tenantId_plan ON workspaces(tenantId, plan);
CREATE INDEX idx_workspace_members_workspaceId_role ON workspace_members(workspaceId, role);

-- Constraints to prevent invalid states
ALTER TABLE subscriptions ADD CONSTRAINT chk_subscription_budget
  CHECK (budgetLimit IS NULL OR budgetLimit > 0);

ALTER TABLE quotas ADD CONSTRAINT chk_quota_limits
  CHECK (tokensLimitPerMonth > 0 AND requestsLimitPerMonth > 0);

ALTER TABLE token_usage ADD CONSTRAINT chk_token_usage_positive
  CHECK (inputTokens >= 0 AND outputTokens >= 0);

-- View for common queries:  Current month usage per workspace
CREATE OR REPLACE VIEW v_current_month_usage AS
SELECT
  w.workspaceId,
  w.tenantId,
  w.name AS workspaceName,
  s.plan,
  q.tokensLimitPerMonth,
  q.tokensUsedThisMonth,
  q.tokensLimitPerMonth - q.tokensUsedThisMonth AS tokensRemaining,
  ROUND(100.0 * q.tokensUsedThisMonth / q.tokensLimitPerMonth, 2) AS usagePercentage,
  mu.totalChargeToUser
FROM workspaces w
JOIN subscriptions s ON w.workspaceId = s.workspaceId
JOIN quotas q ON w.workspaceId = q.workspaceId
LEFT JOIN monthly_usage mu ON w.workspaceId = mu.workspaceId
  AND mu.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

COMMENT ON VIEW v_current_month_usage IS 'Current month quota progress per workspace (read-only)';

-- View for admin: Total usage by model
CREATE OR REPLACE VIEW v_model_usage_summary AS
SELECT
  model_usage.modelId,
  model_catalog.displayName,
  SUM(model_usage.tokensUsed) AS totalTokensUsed,
  SUM(model_usage.chargeToUser) AS totalRevenue,
  AVG(model_usage.chargeToUser) AS avgChargePerMonth,
  COUNT(DISTINCT model_usage.workspaceId) AS uniqueWorkspaces
FROM model_usage
JOIN model_catalog ON model_usage.modelId = model_catalog.modelId
GROUP BY model_usage.modelId, model_catalog.displayName
ORDER BY totalTokensUsed DESC;

COMMENT ON VIEW v_model_usage_summary IS 'Analytics: which models are most used/profitable';