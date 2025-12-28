/**
 * Migration 007: Session Management
 * 
 * Server-side session tracking:
 * - Track active sessions
 * - Enable token revocation
 * - Enforce concurrent session limits
 * - Security auditing
 */

-- Sessions: Track user sessions
CREATE TABLE IF NOT EXISTS sessions (
  sessionId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
  tenantId UUID NOT NULL REFERENCES tenants(tenantId) ON DELETE CASCADE,
  
  -- Token hashes (never store raw tokens)
  accessTokenHash VARCHAR(255) NOT NULL,
  refreshTokenHash VARCHAR(255),
  
  -- Session metadata
  createdAt INTEGER NOT NULL, -- Unix timestamp
  expiresAt INTEGER NOT NULL, -- Unix timestamp
  
  -- Security
  ipAddress INET,
  userAgent TEXT,
  
  -- Revocation
  revokedAt INTEGER, -- NULL=active, value=revoked timestamp
  
  UNIQUE(accessTokenHash)
);

COMMENT ON TABLE sessions IS 'Server-side session tracking for token revocation and analytics';
COMMENT ON COLUMN sessions.accessTokenHash IS 'Hash of JWT (never store raw token)';
COMMENT ON COLUMN sessions.revokedAt IS 'NULL=active, value=unix timestamp when revoked';

-- Indexes
CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_sessions_tenantId ON sessions(tenantId);
CREATE INDEX idx_sessions_expiresAt ON sessions(expiresAt);
CREATE INDEX idx_sessions_revokedAt ON sessions(revokedAt);
CREATE INDEX idx_sessions_accessTokenHash ON sessions(accessTokenHash);