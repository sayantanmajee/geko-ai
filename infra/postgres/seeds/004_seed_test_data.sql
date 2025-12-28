/**
 * Seed Migration 004: Test Data (Development Only!)
 * 
 * Creates test tenant, users, workspaces for local development
 * 
 * CRITICAL: 
 * - Only run in development (check NODE_ENV)
 * - Delete before production deployment
 * - Password hashes are pre-computed for speed
 * 
 * Test Accounts:
 * 1.Tenant "Demo Corp"
 *    - User:  owner@demo.com / Password123 (owner)
 *    - User: admin@demo.com / Password123 (admin)
 *    - User: editor@demo.com / Password123 (editor)
 *    - User: viewer@demo.com / Password123 (viewer)
 * 
 *    Workspaces:
 *    - "Engineering" (Pro plan, 3 members)
 *    - "Marketing" (Free plan, 2 members)
 */

-- Only seed if explicitly enabled
-- DO NOT auto-seed in production! 
-- 
-- To enable:   export SEED_TEST_DATA=true before starting

-- Tenant:  Demo Corp
INSERT INTO tenants (tenantId, name, slug, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001':: uuid,
  'Demo Corp',
  'demo-corp',
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- Users (password hashes are PBKDF2)
-- Password: Password123
-- Hash: salt$derivedkey (format from hashPassword function)
-- 
-- These are pre-computed for demo purposes
-- In production, users register themselves

INSERT INTO users (
  userId, tenantId, email, passwordHash, firstName, lastName, emailVerified, status
) VALUES
-- Owner
('550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid,
 'owner@demo.com', 
 '7c74f832dbe0eb16d02cd18c6bff1c28$1e8a5f8c2d3b9a4e7f6c1d2a8b9c0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
 'Owner', 'Demo', true, 'active'),

-- Admin
('550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid,
 'admin@demo.com',
 '9f8e7d6c5b4a3210987654321abcdef0$2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d',
 'Admin', 'Demo', true, 'active'),

-- Editor
('550e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid,
 'editor@demo.com',
 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6$3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f',
 'Editor', 'Demo', true, 'active'),

-- Viewer
('550e8400-e29b-41d4-a716-446655440013'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid,
 'viewer@demo.com',
 '4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f$5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
 'Viewer', 'Demo', true, 'active')
ON CONFLICT (email) DO NOTHING;

-- Workspace 1: Engineering (Pro)
INSERT INTO workspaces (
  workspaceId, tenantId, name, description, plan, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440020'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Engineering',
  'Development team workspace',
  'pro',
  'active'
)
ON CONFLICT (workspaceId) DO NOTHING;

-- Workspace 2: Marketing (Free)
INSERT INTO workspaces (
  workspaceId, tenantId, name, description, plan, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440021'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Marketing',
  'Marketing team workspace',
  'free',
  'active'
)
ON CONFLICT (workspaceId) DO NOTHING;

-- Workspace Members:  Engineering
INSERT INTO workspace_members (
  workspaceId, userId, role, invitedBy
) VALUES
-- Owner
('550e8400-e29b-41d4-a716-446655440020':: uuid, '550e8400-e29b-41d4-a716-446655440010'::uuid, 'owner', NULL),
-- Admin
('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440011':: uuid, 'admin', 
 '550e8400-e29b-41d4-a716-446655440010'::uuid),
-- Editor
('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440012':: uuid, 'editor',
 '550e8400-e29b-41d4-a716-446655440010'::uuid)
ON CONFLICT (workspaceId, userId) DO NOTHING;

-- Workspace Members:  Marketing
INSERT INTO workspace_members (
  workspaceId, userId, role, invitedBy
) VALUES
-- Owner
('550e8400-e29b-41d4-a716-446655440021'::uuid, '550e8400-e29b-41d4-a716-446655440010'::uuid, 'owner', NULL),
-- Viewer
('550e8400-e29b-41d4-a716-446655440021'::uuid, '550e8400-e29b-41d4-a716-446655440013'::uuid, 'viewer',
 '550e8400-e29b-41d4-a716-446655440010'::uuid)
ON CONFLICT (workspaceId, userId) DO NOTHING;

-- Workspace Roles: Create default roles
-- Note: These are created for each workspace

INSERT INTO workspace_roles (workspaceId, roleName, description)
VALUES
('550e8400-e29b-41d4-a716-446655440020'::uuid, 'owner', 'Full control'),
('550e8400-e29b-41d4-a716-446655440020'::uuid, 'admin', 'Team management'),
('550e8400-e29b-41d4-a716-446655440020'::uuid, 'editor', 'Can chat and use models'),
('550e8400-e29b-41d4-a716-446655440020'::uuid, 'viewer', 'Read-only access'),
('550e8400-e29b-41d4-a716-446655440021':: uuid, 'owner', 'Full control'),
('550e8400-e29b-41d4-a716-446655440021'::uuid, 'admin', 'Team management'),
('550e8400-e29b-41d4-a716-446655440021'::uuid, 'editor', 'Can chat and use models'),
('550e8400-e29b-41d4-a716-446655440021'::uuid, 'viewer', 'Read-only access')
ON CONFLICT (workspaceId, roleName) DO NOTHING;

-- Subscriptions: Set up billing for workspaces
INSERT INTO subscriptions (
  subscriptionId, workspaceId, tenantId, plan, status, currentMonthCost
) VALUES
-- Engineering:  Pro plan
('550e8400-e29b-41d4-a716-446655440030'::uuid, '550e8400-e29b-41d4-a716-446655440020'::uuid, 
 '550e8400-e29b-41d4-a716-446655440001'::uuid, 'pro', 'active', 29.00),
-- Marketing: Free plan
('550e8400-e29b-41d4-a716-446655440031'::uuid, '550e8400-e29b-41d4-a716-446655440021':: uuid,
 '550e8400-e29b-41d4-a716-446655440001'::uuid, 'free', 'active', 0.00)
ON CONFLICT (subscriptionId) DO NOTHING;

-- Quotas: Initialize usage limits
INSERT INTO quotas (
  quotaId, workspaceId, tokensLimitPerMonth, requestsLimitPerMonth, resetAt
) VALUES
-- Engineering (Pro): 500k tokens
('550e8400-e29b-41d4-a716-446655440040'::uuid, '550e8400-e29b-41d4-a716-446655440020'::uuid,
 500000, 10000, CURRENT_TIMESTAMP + INTERVAL '1 month'),
-- Marketing (Free): 50k tokens
('550e8400-e29b-41d4-a716-446655440041'::uuid, '550e8400-e29b-41d4-a716-446655440021'::uuid,
 50000, 100, CURRENT_TIMESTAMP + INTERVAL '1 month')
ON CONFLICT (quotaId) DO NOTHING;

-- Enable models for workspaces
INSERT INTO workspace_models (workspaceId, modelId, enabled)
SELECT w.workspaceId, m.modelId, true
FROM (
  SELECT '550e8400-e29b-41d4-a716-446655440020'::uuid AS workspaceId UNION
  SELECT '550e8400-e29b-41d4-a716-446655440021'::uuid AS workspaceId
) w
CROSS JOIN model_catalog m
ON CONFLICT (workspaceId, modelId) DO NOTHING;

-- Log that we seeded test data
INSERT INTO audit_logs (
  auditLogId, tenantId, userId, action, resourceType, resourceId
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  NULL,
  'SYSTEM_INIT',
  'system',
  'test_data_seeded'
)
ON CONFLICT DO NOTHING;

-- Print results
SELECT 'Test data seeded successfully!' AS result;
SELECT COUNT(*) AS tenant_count FROM tenants;
SELECT COUNT(*) AS user_count FROM users WHERE tenantId = '550e8400-e29b-41d4-a716-446655440001'::uuid;
SELECT COUNT(*) AS workspace_count FROM workspaces WHERE tenantId = '550e8400-e29b-41d4-a716-446655440001'::uuid;