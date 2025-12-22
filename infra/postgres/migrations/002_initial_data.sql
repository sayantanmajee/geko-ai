/**
 * Initial seeding data for development
 * 
 * Creates: 
 * - Test tenant
 * - Test user
 * - Test workspace
 */

-- Insert test tenant
INSERT INTO tenants (tenant_id, name, plan, status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Organization',
  'pro',
  'active'
)
ON CONFLICT DO NOTHING;

-- Insert test user
INSERT INTO users (user_id, tenant_id, email, name, password_hash, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@example.com',
  'Test User',
  -- Password:  'password123' (bcrypt hashed)
  '$2b$10$8O0TqJGqO3WOXVKpAzLrS.c2nFJLhZ3/yPR8F8RqVzHG4/5Hj7X3W',
  'owner',
  'active'
)
ON CONFLICT DO NOTHING;

-- Insert test workspace
INSERT INTO workspaces (workspace_id, tenant_id, name, description, created_by, status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Default Workspace',
  'Default workspace for testing',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'active'
)
ON CONFLICT DO NOTHING;

-- Add user to workspace
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'owner'
)
ON CONFLICT DO NOTHING;

-- Create workspace config
INSERT INTO workspace_config (workspace_id, enabled_models, enabled_mcps)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"]'::jsonb,
  '["google_search", "web_browsing"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Create workspace quotas
INSERT INTO workspace_quotas (workspace_id, tokens_limit, requests_limit)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  1000000,
  10000
)
ON CONFLICT DO NOTHING;