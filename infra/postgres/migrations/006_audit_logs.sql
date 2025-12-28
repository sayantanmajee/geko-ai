/**
 * Migration 006: Audit Logging
 * 
 * Comprehensive audit trail for: 
 * - Security audits (who accessed what)
 * - Compliance (GDPR, SOC2)
 * - Debugging (what happened to user X)
 * - Analytics (action trends)
 * 
 * Log BEFORE and AFTER values for all changes
 */

-- Audit Logs: Complete action history
CREATE TABLE IF NOT EXISTS audit_logs (
  auditLogId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES tenants(tenantId) ON DELETE CASCADE,
  workspaceId UUID REFERENCES workspaces(workspaceId) ON DELETE CASCADE,
  userId UUID REFERENCES users(userId) ON DELETE SET NULL,
  
  -- What happened
  action VARCHAR(100) NOT NULL,
  resourceType VARCHAR(100), -- "workspace", "user", "model", etc
  resourceId VARCHAR(255),
  
  -- How it changed
  changesBefore JSONB, -- Before state
  changesAfter JSONB, -- After state
  
  -- Context
  ipAddress INET,
  userAgent TEXT,
  
  -- Timestamps
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit_logs IS 'Complete audit trail of all significant actions';
COMMENT ON COLUMN audit_logs.action IS 'USER_REGISTERED, WORKSPACE_CREATED, MODEL_ENABLED, etc';
COMMENT ON COLUMN audit_logs.changesBefore IS 'State before action (for rollback capability)';
COMMENT ON COLUMN audit_logs.changesAfter IS 'State after action';

-- Indexes
CREATE INDEX idx_audit_logs_tenantId ON audit_logs(tenantId);
CREATE INDEX idx_audit_logs_workspaceId ON audit_logs(workspaceId);
CREATE INDEX idx_audit_logs_userId ON audit_logs(userId);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_createdAt ON audit_logs(createdAt);
CREATE INDEX idx_audit_logs_resourceType_resourceId ON audit_logs(resourceType, resourceId);