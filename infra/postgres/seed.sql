/**
 * Seed Data for Development
 * 
 * Creates: 
 * - Demo tenant "Acme Corp"
 * - Demo users (owner + team member)
 * - Demo workspaces
 * - Default roles & permissions
 * - Model catalog entries
 * 
 * Execution:  psql -U geko -d geko_ai -f seed.sql
 */

-- ============================================================================
-- SEED TENANTS
-- ============================================================================
INSERT INTO tenants (tenantId, name, slug, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000':: UUID,
  'Acme Corporation',
  'acme-corp',
  'active'
);

-- ============================================================================
-- SEED USERS
-- ============================================================================
-- Password:  Password123!  (hashed with PBKDF2)
-- Format: salt$hash

INSERT INTO users (userId, tenantId, email, passwordHash, firstName, lastName, emailVerified, status)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'owner@acme.com',
    '7f8d8a9b1c2d3e4f5a6b7c8d9e0f1a2b$8c7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a39282716f5e4d',
    'Alice',
    'Owner',
    true,
    'active'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'member@acme.com',
    '7f8d8a9b1c2d3e4f5a6b7c8d9e0f1a2b$8c7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a39282716f5e4d',
    'Bob',
    'Member',
    true,
    'active'
  );

-- ============================================================================
-- SEED WORKSPACES
-- ============================================================================
INSERT INTO workspaces (workspaceId, tenantId, name, description, plan, status)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'Engineering',
    'Engineering team workspace',
    'pro',
    'active'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'Marketing',
    'Marketing team workspace',
    'free',
    'active'
  );

-- ============================================================================
-- SEED WORKSPACE_ROLES
-- ============================================================================
INSERT INTO workspace_roles (roleId, workspaceId, name, description)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440100'::UUID,
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    'owner',
    'Full control'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440101'::UUID,
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    'admin',
    'Management'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440102'::UUID,
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    'editor',
    'Can chat and use models'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440103':: UUID,
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    'viewer',
    'Read-only'
  );

-- ============================================================================
-- SEED ROLE_PERMISSIONS
-- ============================================================================
INSERT INTO role_permissions (roleId, permission)
VALUES
  -- Owner permissions
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'chat: create'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'chat: read'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'chat:delete'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'model:view'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'model: useFree'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'model: usePremium'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'workspace:read'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'workspace: update'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'member:invite'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'member: remove'),
  ('550e8400-e29b-41d4-a716-446655440100'::UUID, 'admin:access'),
  
  -- Editor permissions
  ('550e8400-e29b-41d4-a716-446655440102'::UUID, 'chat: create'),
  ('550e8400-e29b-41d4-a716-446655440102'::UUID, 'chat:read'),
  ('550e8400-e29b-41d4-a716-446655440102'::UUID, 'chat:delete'),
  ('550e8400-e29b-41d4-a716-446655440102'::UUID, 'model:view'),
  ('550e8400-e29b-41d4-a716-446655440102'::UUID, 'model:useFree'),
  ('550e8400-e29b-41d4-a716-446655440102'::UUID, 'model:usePremium'),
  
  -- Viewer permissions
  ('550e8400-e29b-41d4-a716-446655440103'::UUID, 'chat:read'),
  ('550e8400-e29b-41d4-a716-446655440103'::UUID, 'model:view'),
  ('550e8400-e29b-41d4-a716-446655440103'::UUID, 'model:useFree');

-- ============================================================================
-- SEED WORKSPACE_MEMBERS
-- ============================================================================
INSERT INTO workspace_members (memberId, workspaceId, userId, role, joinedAt)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440200'::UUID,
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    'owner',
    CURRENT_TIMESTAMP
  ),
  (
    '550e8400-e29b-41d4-a716-446655440201'::UUID,
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    'editor',
    CURRENT_TIMESTAMP
  );

-- ============================================================================
-- SEED MODEL_CATALOG
-- ============================================================================
INSERT INTO model_catalog (catalogId, modelId, provider, displayName, description, costPerMInputTokens, costPerMOutputTokens, minPlan, isLocal, isFreeTier, freeTierTokensPerMonth)
VALUES
  -- Free tier cloud models
  (
    '550e8400-e29b-41d4-a716-446655440300'::UUID,
    'gpt-4o-mini',
    'openai',
    'GPT-4o Mini',
    'Fast and cheap',
    0.00015,
    0.0006,
    'free',
    false,
    true,
    1000000
  ),
  (
    '550e8400-e29b-41d4-a716-446655440301'::UUID,
    'claude-haiku',
    'anthropic',
    'Claude 3 Haiku',
    'Fast Claude model',
    0.00008,
    0.0004,
    'free',
    false,
    true,
    500000
  ),
  
  -- Premium cloud models
  (
    '550e8400-e29b-41d4-a716-446655440302'::UUID,
    'gpt-4',
    'openai',
    'GPT-4 Turbo',
    'Most capable',
    0.01,
    0.03,
    'pro',
    false,
    false,
    NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655440303'::UUID,
    'claude-3-5-sonnet',
    'anthropic',
    'Claude 3.5 Sonnet',
    'Excellent all-rounder',
    0.003,
    0.015,
    'pro',
    false,
    false,
    NULL
  ),
  
  -- Local models (always free)
  (
    '550e8400-e29b-41d4-a716-446655440304'::UUID,
    'llama2',
    'ollama',
    'Llama 2 7B',
    'Open source, runs locally',
    0,
    0,
    'free',
    true,
    true,
    NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655440305'::UUID,
    'mistral',
    'ollama',
    'Mistral 7B',
    'Fast open source model',
    0,
    0,
    'free',
    true,
    true,
    NULL
  );

-- ============================================================================
-- SEED QUOTAS
-- ============================================================================
INSERT INTO quotas (quotaId, workspaceId, tokensLimitPerMonth, requestsLimitPerMonth, resetAt)
VALUES
  -- Pro workspace
  (
    '550e8400-e29b-41d4-a716-446655440400'::UUID,
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    500000,
    10000,
    DATE_TRUNC('month', CURRENT_TIMESTAMP + INTERVAL '1 month')::DATE
  ),
  -- Free workspace
  (
    '550e8400-e29b-41d4-a716-446655440401'::UUID,
    '550e8400-e29b-41d4-a716-446655440011'::UUID,
    50000,
    1000,
    DATE_TRUNC('month', CURRENT_TIMESTAMP + INTERVAL '1 month')::DATE
  );

-- ============================================================================
-- SEED WORKSPACE_MODELS
-- ============================================================================
INSERT INTO workspace_models (workspaceModelId, workspaceId, modelId, enabled)
VALUES
  -- Engineering (Pro) - all models enabled
  ('550e8400-e29b-41d4-a716-446655440500'::UUID, '550e8400-e29b-41d4-a716-446655440010'::UUID, 'gpt-4o-mini', true),
  ('550e8400-e29b-41d4-a716-446655440501'::UUID, '550e8400-e29b-41d4-a716-446655440010'::UUID, 'claude-haiku', true),
  ('550e8400-e29b-41d4-a716-446655440502'::UUID, '550e8400-e29b-41d4-a716-446655440010'::UUID, 'gpt-4', true),
  ('550e8400-e29b-41d4-a716-446655440503'::UUID, '550e8400-e29b-41d4-a716-446655440010':: UUID, 'claude-3-5-sonnet', true),
  ('550e8400-e29b-41d4-a716-446655440504':: UUID, '550e8400-e29b-41d4-a716-446655440010'::UUID, 'llama2', true),
  ('550e8400-e29b-41d4-a716-446655440505'::UUID, '550e8400-e29b-41d4-a716-446655440010'::UUID, 'mistral', true),
  
  -- Marketing (Free) - free models only
  ('550e8400-e29b-41d4-a716-446655440506'::UUID, '550e8400-e29b-41d4-a716-446655440011'::UUID, 'gpt-4o-mini', true),
  ('550e8400-e29b-41d4-a716-446655440507'::UUID, '550e8400-e29b-41d4-a716-446655440011'::UUID, 'claude-haiku', true),
  ('550e8400-e29b-41d4-a716-446655440508'::UUID, '550e8400-e29b-41d4-a716-446655440011':: UUID, 'llama2', true),
  ('550e8400-e29b-41d4-a716-446655440509'::UUID, '550e8400-e29b-41d4-a716-446655440011'::UUID, 'mistral', true);

-- ============================================================================
-- SEED SUBSCRIPTIONS
-- ============================================================================
INSERT INTO subscriptions (subscriptionId, workspaceId, tenantId, plan, status, currentMonthCost, startedAt)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440600'::UUID,
    '550e8400-e29b-41d4-a716-446655440010'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'pro',
    'active',
    0,
    CURRENT_TIMESTAMP
  ),
  (
    '550e8400-e29b-41d4-a716-446655440601'::UUID,
    '550e8400-e29b-41d4-a716-446655440011'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'free',
    'active',
    0,
    CURRENT_TIMESTAMP
  );

-- ============================================================================
-- SEED WORKSPACE_MCPS
-- ============================================================================
INSERT INTO workspace_mcps (mcpId, workspaceId, mcpName, displayName, enabled)
VALUES
  ('550e8400-e29b-41d4-a716-446655440700'::UUID, '550e8400-e29b-41d4-a716-446655440010'::UUID, 'web_search', 'Web Search', true),
  ('550e8400-e29b-41d4-a716-446655440701'::UUID, '550e8400-e29b-41d4-a716-446655440010'::UUID, 'code_interpreter', 'Code Interpreter', true),
  ('550e8400-e29b-41d4-a716-446655440702'::UUID, '550e8400-e29b-41d4-a716-446655440011'::UUID, 'web_search', 'Web Search', true);

-- ============================================================================
-- CONFIRM SEED COMPLETED
-- ============================================================================
SELECT '✅ Seed data inserted successfully!' AS status;