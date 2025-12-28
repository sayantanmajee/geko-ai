### GEKO-AI: Complete Development Roadmap (21 Days)
## WEEK 1: Foundation & Core Services
# Day 1: Monorepo Setup, Structure & Infrastructure
  **Goal: Have all services running locally with health checks**
  **Scope: Setup, Docker, DB, logging**

Deliverables:

 Cleanup/finalize folder structure (apps/, services/, packages/, infra/)
 Docker Compose with all services:
PostgreSQL (primary DB)
Redis (cache, sessions)
Auth-service (3001)
API-Gateway (3002)
Workspace-service (3003) - New
Memory-service (3004)
Model-service (3005) - New
Billing-service (3006) - New
LibreChat (3040)
 .env. example with all required vars
 Health check endpoints on all services (GET /health)
 Root pnpm dev runs all services in parallel
Files to Create/Modify:

Code
infra/
├── docker-compose.yml          (Add all 6 services)
├── docker-compose.dev.yml
├── postgres/
│   ├── init/
│   │   └── 00-schema.sql       (Create databases)
│   └── wait-for-db.sh
├── redis/
│   └── redis. conf
└── . env.example                (Expand:  20+ vars for each service)

services/
├── workspace-service/          (NEW directory)
├── model-service/              (NEW directory)
└── billing-service/            (NEW directory)
Testing:

bash
docker-compose up -d
curl http://localhost:3001/health   # auth-service
curl http://localhost:3002/health   # api-gateway
curl http://localhost:3003/health   # workspace-service
curl http://localhost:3005/health   # model-service
curl http://localhost:3006/health   # billing-service
Day 2: Database Schema (PostgreSQL Migrations)
Goal: Solid schema supporting multi-tenancy, RBAC, quotas, billing, audit
Scope: SQL migrations, types, queries layer foundation

Deliverables:

 Migration 001: Tenants, users (core)
 Migration 002: Workspaces, workspace_members, workspace_roles
 Migration 003: Models catalog, workspace_models (enable/disable per team)
 Migration 004: Quotas, token_usage, cost_tracking
 Migration 005: Audit logs
 Migration 006: OAuth tokens, sessions
 Migration 007: MCPs/Tools registry, workspace_mcps
 All migrations tested with seed data
Key Tables:

SQL
-- Core
tenants (tenant_id, name, plan, stripe_customer_id, metadata, created_at)
users (user_id, tenant_id, email, password_hash, name, role, created_at)
audit_logs (log_id, tenant_id, user_id, action, resource, details, created_at)

-- Workspaces
workspaces (workspace_id, tenant_id, name, icon, created_by, created_at)
workspace_members (id, workspace_id, user_id, role, status, invited_at, accepted_at)
workspace_roles (role_id, workspace_id, name, description)
role_permissions (id, role_id, permission)

-- Models & MCPs
model_catalog (model_id, provider, name, type, is_local, is_free, cost_per_1k_tokens, metadata)
workspace_models (id, workspace_id, model_id, enabled, status, installed_at)
workspace_mcps (id, workspace_id, mcp_id, enabled, config)

-- Usage & Quotas
quotas (quota_id, workspace_id, plan, tokens_limit, tokens_used, reset_at)
token_usage (id, workspace_id, user_id, model_id, input_tokens, output_tokens, cost, created_at)
cost_tracking (id, workspace_id, month, total_cost, used_limit)

-- Sessions & Auth
sessions (session_id, user_id, tenant_id, workspace_id, access_token, refresh_token, expires_at)
oauth_providers (id, user_id, provider, provider_user_id, access_token, expires_at)
Files to Create:

Code
infra/postgres/
├── migrations/
│   ├── 001_init_core. sql
│   ├── 002_workspaces_and_members.sql
│   ├── 003_models_and_mcps.sql
│   ├── 004_quotas_and_usage.sql
│   ├── 005_audit_logs.sql
│   ├── 006_oauth_sessions.sql
│   └── 007_indexes_and_constraints.sql
└── seeds/
    └── 001_sample_data.sql
Testing:

bash
docker-compose exec postgres psql -U postgres -d geko_ai -c "\dt"  # List tables
pnpm run db: migrate                                                 # Run all migrations
Day 3: Shared Types & Contracts (Extend)
Goal: All services speak the same language
Scope: Types, enums, interfaces

Deliverables:

 Extend @package/shared-types with:

Workspace, WorkspaceMember, WorkspaceRole types
ModelCatalog, WorkspaceModel, ModelStatus types
Permission enum (30+ permissions)
Quota, Usage, BillingEvent types
AuditLog, AuditAction types
MCPConfig type
 Update RequestContext to include:

permissions:  Permission[]
workspace?:  Workspace
quotaInfo?: QuotaInfo
Files to Create/Modify:

TypeScript
// packages/shared-types/src/

permission.ts              (NEW)
export enum Permission {
  // Chat
  CHAT_CREATE = 'chat:create',
  CHAT_VIEW_OWN = 'chat:view: own',
  CHAT_VIEW_WORKSPACE = 'chat:view:workspace',
  
  // Models
  MODEL_USE_LOCAL = 'model:use:local',
  MODEL_USE_FREE = 'model:use:free',
  MODEL_USE_PREMIUM = 'model: use:premium',
  
  // Team
  MEMBER_INVITE = 'member:invite',
  MEMBER_REMOVE = 'member:remove',
  
  // Admin
  WORKSPACE_CONFIG = 'workspace:config',
  WORKSPACE_BILLING = 'workspace:billing',
  AUDIT_LOG_VIEW = 'audit:view'
}

workspace.ts               (NEW)
export interface Workspace { ... }

model.ts                   (NEW)
export interface ModelCatalog { ... }

quota.ts                   (NEW)
export interface Quota { ... }

audit.ts                   (NEW)
export interface AuditLog { ...  }

request. ts                 (EXTEND)
export interface RequestContext {
  .. .,
  permissions: Permission[]
  workspace?: Workspace
}

index.ts                   (EXTEND exports)
Testing:

bash
pnpm -r build          # TypeScript validation
pnpm -r type-check     # Type checking
Day 4: Auth Service - Complete & Test
Goal: Full auth pipeline (register, login, refresh, JWT)
Scope: Already 80% done; add edge cases, tests, docs

Deliverables:

 Auth endpoints working:
POST /v1/auth/register → Create tenant + user
POST /v1/auth/login → Issue JWT with tenantId
POST /v1/auth/refresh → Refresh tokens
GET /v1/auth/me → User profile
 JWT payload includes tenantId (security critical)
 Password hashing (bcrypt, salt rounds ≥10)
 Tests: register, login, refresh, invalid credentials
 Docs: Auth flow diagram
Files to Verify/Extend:

TypeScript
services/auth-service/src/

server.ts                  (Already good)
config/
├── database.ts            (Ensure connection pooling)
└── jwt.ts                 (NEW:  JWT signing/validation)

services/
├── auth. service.ts        (Extend:  refresh flow, profile)
├── user.service.ts        (Ensure password hashing)
└── token.service.ts       (Ensure tenantId in JWT)

routes/
└── auth.routes.ts         (All endpoints)

__tests__/
├── auth. service.test.ts   (NEW)
└── auth.routes.test.ts    (NEW)
Testing:

bash
# Manual
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123","tenantName":"test-org"}'

# Automated
cd services/auth-service
pnpm test
Day 5: Workspace Service - CRUD & Schema
Goal: Full team workspace management
Scope: Create, list, update, delete workspaces; invite members

Deliverables:

 Workspace CRUD:
POST /v1/workspaces → Create workspace
GET /v1/workspaces → List user's workspaces
GET /v1/workspaces/{id} → Get details
PATCH /v1/workspaces/{id} → Update name/icon
DELETE /v1/workspaces/{id} → Soft delete
 Member management:
POST /v1/workspaces/{id}/members → Invite by email
GET /v1/workspaces/{id}/members → List members
PATCH /v1/workspaces/{id}/members/{userId} → Update role
DELETE /v1/workspaces/{id}/members/{userId} → Remove member
 Invitation flow:
Generate invite token (expires in 7 days)
Email invite (or just return link)
Accept: POST /v1/invitations/{token}/accept
Files to Create:

TypeScript
services/workspace-service/

src/
├── server.ts
├── config/
│   ├── index.ts
│   └── database.ts
├── database/
│   ├── types.ts            (WorkspaceDbRow, MemberDbRow, etc.)
│   └── queries/
│       ├── workspaces.ts
│       ├── members.ts
│       ├── roles.ts
│       └── invitations.ts
├── services/
│   ├── workspace.service.ts
│   ├── member.service.ts
│   └── invitation.service. ts
├── routes/
│   └── workspaces.routes.ts
├── middleware/
│   └── auth. middleware.ts
└── __tests__/
    └── workspace.service.test.ts

jest.config.js
package.json
tsconfig.json
Testing:

bash
# Manual
TOKEN=$(curl -s -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}' | jq -r '.accessToken')

curl -X POST http://localhost:3003/v1/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sales Team"}'

# Automated
pnpm test
Day 6: Model Service - Catalog & Local Registry
Goal: Catalog all AI models, track local model installs
Scope: Model metadata, local status, availability per workspace

Deliverables:

 Model catalog APIs:
GET /v1/models → List all models with metadata (free, premium, local, status)
GET /v1/models/{id} → Model details
 Local model management:
POST /v1/models/install → Install Ollama model (async, returns job id)
DELETE /v1/models/{id} → Remove local model
GET /v1/models/{id}/status → Real-time status (downloading, ready, error)
 Workspace model config:
PATCH /v1/workspaces/{id}/models → Enable/disable models for team
Files to Create:

TypeScript
services/model-service/

src/
├── server.ts
├── config/
│   ├── index.ts
│   └── database.ts
├── database/
│   └── queries/
│       ├── models.ts
│       └── workspace-models.ts
├── services/
│   ├── model.service.ts      (CRUD model catalog)
│   ├── local. service.ts      (Ollama integration)
│   └── status.service.ts     (Health checks)
├── routes/
│   └── models.routes. ts
├── integrations/
│   └── ollama.ts            (Talk to Ollama API)
└── __tests__/

jest.config.js
package. json
tsconfig.json
Database Seed (Day 2 migration should include):

SQL
INSERT INTO model_catalog (model_id, provider, name, type, is_local, is_free, cost_per_1k_tokens)
VALUES
  ('gpt-4o-mini', 'openai', 'GPT-4o Mini', 'chat', false, true, 0),        -- Free tier eligible
  ('gpt-4', 'openai', 'GPT-4', 'chat', false, false, 0.03),                -- Premium
  ('claude-haiku', 'anthropic', 'Claude Haiku', 'chat', false, true, 0),    -- Free tier
  ('claude-3-5-sonnet', 'anthropic', 'Claude 3.5 Sonnet', 'chat', false, false, 0.015),
  ('llama2', 'ollama', 'Llama 2 7B', 'chat', true, true, 0),               -- Local, always free
  ('mistral', 'ollama', 'Mistral 7B', 'chat', true, true, 0),              -- Local, always free
  ('deepseek-r1', 'deepseek', 'DeepSeek R1', 'chat', false, false, 0.002);
Testing:

bash
# Manual
curl http://localhost:3005/v1/models

# Automated
pnpm test
Day 7: API Gateway - Auth & Routing Layer
Goal: Central orchestrator with JWT validation, context injection, routing
Scope: NOT full quota enforcement yet; just routing with context

Deliverables:

 Auth middleware:

Extract JWT from header
Validate token, extract tenantId/userId/role
Return 401 if invalid
 Request context middleware:

Generate requestId
Load workspace config from workspace-service
Attach to request
 Request logging:

Log all requests with requestId, method, path, user
 Basic routing (proxies, not logic):

POST /v1/chat/send → Forward to LibreChat (no quota yet)
GET /v1/models → Forward to model-service
GET /v1/workspaces/{id} → Forward to workspace-service
GET /health → Healthcheck all dependencies
 Error handling:

Centralized error responses (AppError → JSON)
Files to Create:

TypeScript
services/ai-gateway/

src/
├── server.ts              (REWRITE: Middleware stack)
├── config/
│   ├── index.ts
│   └── service-urls.ts
├── middleware/
│   ├── auth.middleware.ts       (JWT validation)
│   ├── context.middleware.ts    (Load workspace, user context)
│   ├── logging.middleware.ts
│   ├── error. middleware.ts
│   └── cors.middleware.ts
├── routes/
│   ├── chat.routes.ts
│   ├── models.routes.ts
│   ├── workspaces.routes.ts
│   └── health.routes.ts
├── services/
│   └── service-registry.ts      (Know all service URLs)
└── __tests__/

jest.config.js
package. json
tsconfig.json
Testing:

bash
curl -X GET http://localhost:3002/health

# With JWT
TOKEN=$(curl -s http://localhost:3001/v1/auth/login ...  | jq -r '.accessToken')
curl -H "Authorization: Bearer $TOKEN" http://localhost:3002/v1/models
WEEK 2: RBAC, Free Tier, Model Access Control
Day 8: RBAC - Permissions Matrix
Goal: Table-driven permissions, role definitions
Scope: Database, service logic, no enforcement yet

Deliverables:

 Seed default roles into DB:

owner: All permissions
admin: All except billing
editor: Chat, models, tools (not admin, not billing)
viewer: Chat only (read-only)
 Seed permissions table:

SQL
INSERT INTO role_permissions (role_id, permission) VALUES
  (owner_id, 'chat:create'),
  (owner_id, 'model:use: premium'),
  (admin_id, 'member:invite'),
  (editor_id, 'chat:create'),
  (viewer_id, 'chat:view')
 RBAC service:

hasPermission(userId, workspaceId, permission) → bool
getPermissions(userId, workspaceId) → Permission[]
Caching with 5-min TTL
 Tests: RBAC matrix

Files to Create/Modify:

TypeScript
services/workspace-service/

src/services/
└── rbac.service.ts        (NEW)

export class RBACService {
  static async hasPermission(
    userId: string,
    workspaceId: string,
    permission: Permission
  ): Promise<boolean> { ... }
  
  static async getPermissions(
    userId:  string,
    workspaceId: string
  ): Promise<Permission[]> { ... }
}

__tests__/
└── rbac.service.test.ts
Testing:

bash
pnpm test -- rbac.service.test.ts
Day 9: Free Tier Logic - Model Eligibility
Goal: Define which models are "free" and accessible on free tier
Scope: Extend model catalog, tag models, add plan requirements

Deliverables:

 Extend model_catalog table with columns:

SQL
ALTER TABLE model_catalog ADD COLUMN min_plan VARCHAR(50);  -- 'free', 'pro', 'paygo'
ALTER TABLE model_catalog ADD COLUMN max_free_tokens_per_month INT;  -- e.g., 100k for GPT-4o-mini
 Update seed data:

SQL
UPDATE model_catalog SET min_plan = 'free', max_free_tokens_per_month = 100000
  WHERE model_id IN ('gpt-4o-mini', 'claude-haiku', 'llama2', 'mistral');

UPDATE model_catalog SET min_plan = 'pro', max_free_tokens_per_month = NULL
  WHERE model_id IN ('gpt-4', 'claude-3-5-sonnet');
 Model eligibility API:

GET /v1/models/eligible → List models user can access in their workspace
 Logic:

Free tier users: Can access all models with min_plan = 'free' + all local models
Pro users: Can access all models
PayGo users: Can access all models
Files to Modify:

TypeScript
services/model-service/

src/services/model.service.ts
export class ModelService {
  static async getEligibleModels(
    userId: string,
    workspaceId: string
  ): Promise<ModelCatalog[]> {
    // Get user's workspace plan
    // Filter models by plan requirement
  }
}
Testing:

bash
# Free tier user
TOKEN=$(login_as free_tier_user)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3005/v1/models/eligible
# Should return: gpt-4o-mini, claude-haiku, llama2, mistral

# Pro user
TOKEN=$(login_as pro_user)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3005/v1/models/eligible
# Should return: ALL models
Day 10: Quota System - Setup & Enforcement
Goal: Track usage, enforce limits per workspace/plan
Scope: Database, quota calculation, soft/hard limits

Deliverables:

 Quotas table structure:

SQL
CREATE TABLE quotas (
  quota_id UUID PRIMARY KEY,
  workspace_id UUID,
  plan VARCHAR(50),  -- 'free', 'pro', 'paygo'
  tokens_limit INT,  -- -1 = unlimited
  tokens_used INT,
  requests_limit INT,
  requests_used INT,
  reset_at TIMESTAMP,
  created_at TIMESTAMP
);
 Plan-based quotas (constants):

TypeScript
export const PLAN_QUOTAS = {
  free: { tokensPerMonth: 50_000, requestsPerMonth: 100 },
  pro: { tokensPerMonth: 500_000, requestsPerMonth: 10_000 },
  paygo:  { tokensPerMonth: -1, requestsPerMonth: -1 }  // Unlimited
};
 Quota service:

getQuotaInfo(workspaceId) → Current usage, limit, reset_at
checkQuota(workspaceId, estimatedTokens) → Can proceed? (bool)
recordUsage(workspaceId, tokensUsed) → Log usage
Monthly reset job (Cron)
 Tests: Quota calc, limits

Files to Create:

TypeScript
services/billing-service/  (NEW, minimal start)

src/
├── server.ts
├── services/
│   └── quota.service.ts
├── database/
│   └── queries/quotas.ts
└── __tests__/
    └── quota.service.test. ts
Testing:

bash
# Create workspace with free plan
WORKSPACE_ID=$(create_free_workspace)

# Check initial quota
curl -H "Authorization:  Bearer $TOKEN" \
  http://localhost:3006/v1/workspaces/$WORKSPACE_ID/quota
# Returns: { tokens_limit: 50000, tokens_used: 0, ...  }

# Record usage
curl -X POST http://localhost:3006/v1/quota/record \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"workspace_id": "'$WORKSPACE_ID'", "tokens_used": 5000}'

# Check again
# Returns: { tokens_limit: 50000, tokens_used: 5000, ... }
Day 11: API Gateway - Permission & Quota Middleware
Goal: Enforce RBAC and quotas on every chat/model request
Scope: Check before forwarding to LibreChat or other services

Deliverables:

 Permission middleware:

Before POST /v1/chat/send: Check CHAT_CREATE permission
Before model request: Check MODEL_USE_* based on model tier
Return 403 if denied
 Quota middleware:

Before POST /v1/chat/send: Check token quota
Estimate tokens from request (or use conservative default)
Return 429 if exceeded, with message "Upgrade to Pro"
 Response augmentation:

Add X-Quota-Remaining header to responses
Add X-Upgrade-Required if limit hit
Files to Modify:

TypeScript
services/ai-gateway/

src/middleware/
├── permission.middleware.ts    (NEW)
└── quota.middleware.ts         (NEW)

src/routes/
└── chat.routes.ts             (Add middlewares to POST /v1/chat/send)
Testing:

bash
TOKEN=$(login_as_free_tier_user)

# Try to use pro-only model (GPT-4)
curl -X POST http://localhost:3002/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "hi", "model": "gpt-4"}'
# Returns 403: { error: "MODEL_NOT_ALLOWED", message: "Upgrade to Pro" }

# Use free model (gpt-4o-mini)
curl -X POST http://localhost:3002/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "hi", "model": "gpt-4o-mini"}'
# Returns 200, forwards to LibreChat, records usage
Day 12: Workspace-Model Enablement APIs
Goal: Admins can customize which models their team can access
Scope: Override global defaults per workspace

Deliverables:

 Workspace model config APIs:

PATCH /v1/workspaces/{id}/models → Set enabled models for workspace
GET /v1/workspaces/{id}/models → List enabled models + status
 Schema:

SQL
ALTER TABLE workspace_models ADD COLUMN custom_cost_override DECIMAL;  -- Admin can override pricing
ALTER TABLE workspace_models ADD COLUMN max_tokens_override INT;
 Logic:

Admin enables/disables models for their team
Gateway checks this before forwarding request
Stored in DB, cached in memory
Files to Create/Modify:

TypeScript
services/workspace-service/

src/services/
└── workspace-model. service.ts  (NEW)

src/routes/
└── workspaces.routes.ts        (Add PATCH /v1/workspaces/{id}/models)
Testing:

bash
WORKSPACE_ID=$(create_workspace)
ADMIN_TOKEN=$(get_admin_token)

# Admin enables GPT-4 for their workspace
curl -X PATCH http://localhost:3003/v1/workspaces/$WORKSPACE_ID/models \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled_models":  ["gpt-4", "gpt-4o-mini", "llama2"]}'

# Check:  Should return enabled models
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3003/v1/workspaces/$WORKSPACE_ID/models
Day 13: Usage Tracking & Recording
Goal: Log all token usage for billing and quota enforcement
Scope: Record after each chat, aggregate

Deliverables:

 After LibreChat responds to chat:

Extract token counts from response
Calculate cost (model price × tokens)
Insert into token_usage table
Update quotas.tokens_used
Create audit log entry
 Usage service:

recordUsage(workspaceId, userId, modelId, conversationId, tokens, cost)
getUserUsage(workspaceId, month) → Aggregated usage
getModelUsage(workspaceId, modelId, month) → Per-model breakdown
 Tests: Recording, aggregation

Files to Create/Modify:

TypeScript
services/billing-service/

src/services/
├── quota.service.ts
└── usage.service.ts            (NEW)

src/database/
└── queries/
    ├── quotas.ts
    └── usage.ts                (NEW)
Modified in ai-gateway:

TypeScript
services/ai-gateway/

src/services/
└── librechat-proxy.ts          (After response, call billing-service)

// Pseudo-code:
const response = await forwardToLibreChat(request);
const tokens = response.usage?. total_tokens;
const cost = calculateCost(request.model, tokens);
await billingService.recordUsage({
  workspace_id: ctx.workspaceId,
  user_id: ctx.userId,
  model_id: request.model,
  tokens,
  cost
});
Testing:

bash
# Make a chat request
curl -X POST http://localhost:3002/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "hi", "model":  "gpt-4o-mini"}'

# Check recorded usage
curl -H "Authorization:  Bearer $TOKEN" \
  http://localhost:3006/v1/workspaces/$WORKSPACE_ID/usage/this-month
# Returns: { workspace_id, month:  "2025-12", tokens_used: 50, cost: 0 }
Day 14: Audit Logging & Testing
Goal: All important actions logged (for compliance, debugging)
Scope: Audit table, service, cleanup

Deliverables:

 Audit log service:

logAction(tenantId, userId, action, resource, details) → Insert
Actions: USER_LOGIN, WORKSPACE_CREATED, MEMBER_INVITED, MODEL_ENABLED, CHAT_INITIATED, QUOTA_EXCEEDED, etc.
 Audit middleware:

Automatically log on endpoints marked with @Audit(action)
 Integration tests:

End-to-end: Register → Create workspace → Invite member → Enable models → Chat
Verify audit logs created at each step
Files to Create/Modify:

TypeScript
services/workspace-service/

src/services/
└── audit.service.ts            (NEW)

src/middleware/
└── audit.middleware.ts          (NEW)

__tests__/
└── e2e. test.ts                 (NEW:  Full flow test)
Testing:

bash
# Run E2E test
pnpm test -- e2e.test.ts

# Sample flow:
# 1. Register user
# 2. Create workspace
# 3. Invite member
# 4. Enable GPT-4o-mini
# 5. Send chat
# Verify 5 audit log entries created
WEEK 3: Billing, Advanced Quotas, Premium Features
Day 15: Billing Integration - Stripe Setup
Goal: Connect Stripe for premium plan signups, payment processing
Scope: Create Stripe products, setup webhook, session creation

Deliverables:

 Create Stripe products (via Stripe dashboard or API):

Free plan (free)
Pro plan ($29/month)
Pay-as-you-go (usage-based)
 Billing service:

createCheckoutSession(workspaceId, plan) → Stripe session URL
getPaymentMethods(tenantId) → Saved cards
updatePaymentMethod(tenantId, stripeToken) → Add/update card
 Stripe webhook handler:

Listen for charge.succeeded, charge.failed
Update workspace plan in DB
Create audit log
 Tests: Stripe API mocking

Files to Create/Modify:

TypeScript
services/billing-service/

src/
├── integrations/
│   └── stripe.ts               (NEW:  Stripe client setup)
├── services/
│   └── payment. service.ts      (NEW)
├── routes/
│   └── billing.routes.ts       (NEW)
└── webhooks/
    └── stripe. webhook.ts       (NEW)

package.json (Add stripe dependency)
Testing:

bash
# Manual:  Open checkout URL in browser
curl -X POST http://localhost:3006/v1/billing/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan": "pro"}'
# Returns: { checkout_url: "https://checkout.stripe.com/..." }

# Automated: Mock Stripe responses
pnpm test -- payment.service.test.ts
Day 16: Premium Model Unlocking
Goal: Restrict premium models to paid plan only
Scope: Enforce in middleware, show upgrade prompts in responses

Deliverables:

 Update model_catalog:

SQL
UPDATE model_catalog SET min_plan = 'pro'
  WHERE model_id IN ('gpt-4', 'claude-3-5-sonnet', 'o1');
 Gateway middleware:

If user tries premium model on free plan → Return 403 with upgrade link
 Response enrichment:

Add X-Upgrade-URL header when user hits premium model limit
Frontend can show "Upgrade to Pro" CTA
Files to Modify:

TypeScript
services/ai-gateway/

src/middleware/
└── quota.middleware.ts         (Check min_plan requirement)
Testing:

bash
TOKEN=$(login_as free_tier_user)

# Free user tries premium model
curl -X POST http://localhost:3002/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "hi", "model": "gpt-4"}'
# Returns 403 with X-Upgrade-URL header

# Same user after upgrading to pro
update_plan_to_pro($WORKSPACE_ID)
curl -X POST http://localhost:3002/v1/chat/send \
  -H "Authorization:  Bearer $TOKEN" \
  -d '{"message": "hi", "model": "gpt-4"}'
# Returns 200, forwards to LibreChat
Day 17: Pay-as-You-Go (Usage-Based) Billing
Goal: Track cumulative cost, charge at month-end
Scope: Aggregation, invoicing logic, overage enforcement

Deliverables:

 PayGo quota logic:

No token limit, but track cost
Soft limit: Alert at 80% of budget (if budget set)
Hard limit: Deny at 100% (if budget set)
 Monthly invoice generation:

Cron job: Run on 1st of each month
Sum all usage for previous month
Create invoice in DB
Send email to user
 Payment reconciliation:

Check Stripe for charged amount
Mark invoice as paid
Files to Create/Modify:

TypeScript
services/billing-service/

src/
├── services/
│   └── invoice.service.ts      (NEW)
├── jobs/
│   └── monthly-invoice.job.ts  (NEW:  Cron trigger)
└── emails/
    └── invoice.email.ts         (NEW)

package.json (Add node-cron, email library)
Testing:

bash
# Setup: Create paygo workspace
WORKSPACE_ID=$(create_paygo_workspace)

# Simulate month's usage
for i in {1..10}; do
  record_usage($WORKSPACE_ID, 1000)  # 1000 tokens each
done

# Trigger invoice generation manually (normally cron)
curl -X POST http://localhost:3006/v1/billing/generate-invoices \
  -H "X-Admin-Token: $ADMIN_TOKEN"

# Check invoice
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3006/v1/billing/invoices
# Returns: [{ invoice_id, month:  "2025-12", total_cost: 10. 00, status:  "pending" }]
Day 18: Overage Enforcement & Soft Limits
Goal: Prevent runaway costs; warn users approaching limits
Scope: Real-time checks, notifications

Deliverables:

 Quota checks (enhanced):

For paygo: If cost > budget, return 429 with message
For pro: If tokens > monthly alloc, return 429
Add response headers: X-Quota-Remaining-Tokens, X-Estimated-Cost
 Soft-limit notifications:

If quota usage > 80% → Add warning to response
Email alert to workspace admin
 Cost estimation:

Estimate tokens before forwarding to LibreChat
Check if estimated cost + used_cost > budget
If yes, deny
Files to Modify:

TypeScript
services/ai-gateway/

src/middleware/
└── quota.middleware.ts         (Enhanced checks)

services/billing-service/

src/services/
└── quota.service. ts            (Add estimation, soft limits)
Testing:

bash
# Setup: Free workspace with 50k token limit
WORKSPACE_ID=$(create_free_workspace)

# Use 40k tokens
record_usage($WORKSPACE_ID, 40_000)

# Try to use model (remaining:  10k)
curl -X POST http://localhost:3002/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "hi", "model": "gpt-4o-mini"}'
# Returns 200 with X-Quota-Warning header (80% used)

# Use 15k more (total: 55k)
record_usage($WORKSPACE_ID, 15_000)

# Try again (should be denied)
curl -X POST http://localhost:3002/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "hi", "model": "gpt-4o-mini"}'
# Returns 429 with "Quota exhausted" message
Day 19: Billing APIs & Dashboard Endpoints
Goal: Expose usage, invoices, payment methods to frontend
Scope: REST endpoints for usage/cost/payment info

Deliverables:

 Billing endpoints:

GET /v1/workspaces/{id}/usage/month → Current month usage
GET /v1/workspaces/{id}/usage/year → Year breakdown
GET /v1/billing/invoices → All past invoices
GET /v1/billing/payment-methods → Saved cards
POST /v1/billing/payment-method → Add card
PATCH /v1/billing/payment-method/{id} → Update card
DELETE /v1/billing/payment-method/{id} → Remove card
 Usage breakdown:

Per model (tokens, cost)
Per day/week/month (chart data)
Per user in workspace
Files to Create/Modify:

TypeScript
services/billing-service/

src/routes/
├── billing.routes.ts           (EXTEND)
├── usage.routes.ts             (NEW)
└── payment.routes.ts           (NEW)

src/services/
└── usage-analytics.service.ts  (NEW:  Aggregations for charts)
Testing:

bash
# Get current month usage
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3006/v1/workspaces/$WORKSPACE_ID/usage/month
# Returns: {
#   month: "2025-12",
#   tokens_used: 45000,
#   cost: 12. 50,
#   per_model: {
#     "gpt-4o-mini": { tokens: 30000, cost: 0 },
#     "gpt-4": { tokens: 15000, cost: 12.50 }
#   }
# }

# Get usage breakdown (daily)
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:3006/v1/workspaces/$WORKSPACE_ID/usage/daily? month=2025-12'
# Returns: [
#   { date: "2025-12-01", tokens: 1000, cost: 0.25 },
#   { date:  "2025-12-02", tokens: 2000, cost: 0.50 },
#   ...
# ]
Day 20-21: Integration Tests & Week 2 Hardening
Goal: Full flow testing, security audit, documentation
Scope: E2E tests, security checks, API docs

Deliverables:

 E2E test scenarios:

Free tier user: register → create workspace → chat with free models only
Upgrade to pro: Try premium model → Denied → Checkout → Upgraded → Works
PayGo user: Usage tracking, invoicing, payment
Team scenario: Invite member → Member chats → Usage tracked per user
 Security audit:

 All endpoints require auth
 Workspace isolation: User can't access other tenant's workspaces
 RBAC enforced: Viewer can't invite members
 Quota enforced: Can't exceed limits
 API documentation:

Swagger/OpenAPI spec for all services
Deploy to /docs endpoint
 Database health:

 Connection pooling tuned
 Indexes on all queries
 Test with 1M+ records
Files to Create/Modify:

TypeScript
__tests__/e2e/
├── free-tier.test. ts
├── pro-upgrade.test.ts
├── paygo-billing.test.ts
└── team-collaboration.test.ts

docs/
├── API. md                      (OpenAPI spec)
├── SECURITY.md                 (Auth, RBAC, isolation)
└── DEPLOYMENT.md               (Docker, scaling)
Testing:

bash
# Run all E2E tests
pnpm test -- --testPathPattern="e2e"

# Security scan (static analysis)
pnpm lint
pnpm typecheck

# Load test (optional)
npm install -g artillery
artillery run load-test. yml

# Result: All services healthy, auth required, RBAC enforced, quotas working
WEEK 4: Electron/Web UI, Team Features, Launch
Day 22-23: Electron App Shell & Auth
Goal: Full Electron app with login, workspace selector, chat skeleton
Scope: Electron setup, React routing, API integration

Deliverables:

 Electron app structure:

Code
apps/electron-app/
├── src/
│   ├── main/index.ts          (Electron main process)
│   ├── preload/index.ts       (IPC bridge)
│   ├── renderer/              (React app)
│   └── assets/
├── electron-builder.json
├── package.json
└── tsconfig.json
 React app:

LoginPage → Register/login form
WorkspaceSelector → List user's workspaces
ChatPage → Chat interface shell
SettingsPage → Stub
 Auth flow:

Prompt for email/password
Fetch JWT from auth-service
Store in localStorage (or electron secure storage)
Redirect to workspace selector on success
 API client:

Gateway client lib: fetch with JWT header injection
Files to Create:

TypeScript
apps/electron-app/

src/
├── main/
│   └── index.ts                (Window creation, IPC handlers)
├── preload/
│   └── index.ts                (Expose ipcRenderer, fs, etc.)
└── renderer/
    ├── components/
    │   ├── LoginForm.tsx
    │   ├── WorkspaceSelector.tsx
    │   └── ChatInterface.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── WorkspacePage.tsx
    │   └── ChatPage.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   └── useGateway.ts
    ├── services/
    │   ├── auth. ts
    │   └── gateway-client.ts
    ├── App.tsx
    └── main.tsx

electron-builder.json
package.json
tsconfig.json
vite.config.ts
Testing:

bash
cd apps/electron-app
pnpm install
pnpm dev          # Launches dev Electron app

# Manual test: 
# 1. Login with test@example.com / Password123
# 2. See workspace selector
# 3. Click workspace → Enter ChatPage
Day 24: Model Marketplace & Local Model Panel
Goal: Show available models, install local models, display status
Scope: Model list UI, install flow, status polling

Deliverables:

 ModelsPanel component:

List all workspace-enabled models
Show: name, provider, type (local/cloud), plan tier, status
For local models: "Install", "Updating", "Ready", "Error" buttons
For cloud models: "Free", "Pro only", "Free tier limit" badges
 Install flow:

Click "Install" → Send POST to model-service
Show progress bar (poll status endpoint)
On complete: Show "Ready"
 Settings page integration:

Admin sees "Model Management" section
Can enable/disable models for workspace
Shows usage stats per model
Files to Create/Modify:

TypeScript
apps/electron-app/

src/renderer/
├── components/
│   ├── ModelsPanel.tsx         (NEW)
│   ├── ModelCard.tsx           (NEW)
│   ├── LocalModelInstaller.tsx (NEW)
│   └── ChatInterface.tsx        (EXTEND:  Add model picker)
├── pages/
│   ├── SettingsPage.tsx        (NEW:  Model management)
│   └── ChatPage.tsx            (EXTEND)
└── services/
    └── models. ts               (NEW: Model API calls)
Testing:

bash
# In app: 
# 1. Open Settings → Models
# 2. See list of models (gpt-4o-mini, claude-haiku, llama2, etc.)
# 3. Click "Install" on llama2
# 4. See progress bar
# 5. On complete, button changes to "Ready"
# 6. In chat, model picker shows installed models
Day 25: Chat Interface with Model & Quota Display
Goal: Full chat UX with streaming, quota info, source panel
Scope: Message input, streaming response, quota bar, sources

Deliverables:

 ChatInterface component:

Message input box + send button
Model picker dropdown (shows available models + plan badges)
MCP toggle (web search, code executor)
Message history (scrollable)
Typing indicator while awaiting response
 Streaming messages:

Use SSE or WebSocket from gateway
Real-time token rendering (like ChatGPT)
 Quota display:

Progress bar: "45k / 50k tokens used (90%)"
Color: Green (0-80%), Orange (80-95%), Red (95-100%)
"Upgrade to Pro" CTA when at limit
 Source panel (optional for Day 25):

Placeholder: "Sources will appear here"
Populate from MCP results (web search URLs, etc.)
Files to Create/Modify:

TypeScript
apps/electron-app/

src/renderer/
├── components/
│   ├── ChatInterface.tsx       (REWRITE:  Full implementation)
│   ├── MessageList.tsx         (NEW)
│   ├── MessageInput.tsx        (NEW)
│   ├── ModelSelector.tsx       (NEW)
│   ├── QuotaBar.tsx            (NEW)
│   └── SourcePanel.tsx         (NEW:  Stub)
├── pages/
│   └── ChatPage.tsx            (EXTEND)
├── hooks/
│   ├── useChat.ts              (NEW:  Chat logic)
│   └── useQuota.ts             (NEW:  Quota polling)
└── services/
    └── chat.ts                 (NEW: Chat API, SSE)
Testing:

bash
# In app:
# 1. Click workspace
# 2. In chat: 
#    - Select model (gpt-4o-mini by default)
#    - Type "Hello"
#    - See quota bar:  "50 / 100k tokens used"
# 3. Click send
# 4. See "typing" indicator
# 5. See streaming message appear word-by-word
# 6. After done, quota bar updates:  "1050 / 100k"
Day 26-27: Team Management & Permissions UI
Goal: Invite members, assign roles, view permissions
Scope: Member list, invite form, role assignment, audit logs

Deliverables:

 MembersPanel component:

List workspace members
Show role (Owner, Admin, Editor, Viewer)
Change role dropdown (admin only)
Remove member button (admin only)
 Invite flow:

Input email → Click "Send Invite"
Show pending invites list
User receives invite link (email or copy)
Accept: User clicks link → Joins workspace
 Permissions display:

Show what current user can do
Show what each member can do (admin view)
 Audit logs:

Admin sees log of all workspace actions
Filter by user, action, date
Export as CSV
Files to Create/Modify:

TypeScript
apps/electron-app/

src/renderer/
├── components/
│   ├── MembersPanel. tsx        (NEW)
│   ├── MemberCard.tsx          (NEW)
│   ├── InviteForm.tsx          (NEW)
│   ├── RoleSelector.tsx        (NEW)
│   └── AuditLogViewer.tsx      (NEW)
├── pages/
│   ├── SettingsPage.tsx        (EXTEND:  Add Members tab)
│   └── ChatPage.tsx
└── services/
    ├── members.ts              (NEW)
    └── audit.ts                (NEW)
Testing:

bash
# In app:
# 1. Login as admin
# 2. Open Settings → Members
# 3. See "john@example.com" with role "Editor"
# 4. Click "Invite" → Enter "jane@example.com"
# 5. Click "Send Invite"
# 6. See "Pending:  jane@example.com"
# 7. Open Audit Log
# 8. See "MEMBER_INVITED jane@example.com"
Day 28: Web Search, Tools, & Polish
Goal: Enable web search + code tools per workspace
Scope: MCP toggles, tool management, final UI polish

Deliverables:

 ToolsPanel component:

List available MCPs (web_search, code_interpreter, etc.)
Toggle enabled/disabled (admin only)
Show tool descriptions
 Chat integration:

Checkbox next to model picker: "Enable web search"
Send mcps:  ["web_search"] in chat request
Display sources in source panel (URLs, titles, excerpts)
 Polish:

Dark mode toggle
Keyboard shortcuts (Cmd+Enter to send)
Responsive design (resize panels)
Error toasts for API failures
 Final touches:

App icon
Splash screen
Auto-update check
Files to Create/Modify:

TypeScript
apps/electron-app/

src/renderer/
├── components/
│   ├── ToolsPanel.tsx          (NEW)
│   ├── SourcePanel.tsx         (EXTEND:  Real implementation)
│   ├── ChatInterface.tsx        (EXTEND: Tool toggles, sources)
│   └── ThemeToggle.tsx          (NEW)
├── styles/
│   ├── dark. css                (NEW)
│   └── index.css               (EXTEND)
└── pages/
    ├── SettingsPage.tsx        (EXTEND: Dark mode, shortcuts)
    └── ChatPage.tsx
Testing:

bash
# In app:
# 1. Click workspace
# 2. Open Settings → Tools
# 3. See "Web Search" toggle (enabled by default for free)
# 4. In chat: 
#    - Type "Latest AI news"
#    - See "Web Search" checkbox checked
#    - Click send
# 5. See streaming response + sources panel populated: 
#    - "OpenAI releases GPT-5" (https://openai.com/...)
#    - "DeepSeek releases R1" (https://deepseek.com/...)
FINAL WEEK: QA, Documentation, Deployment
Days 29-30: End-to-End Testing, Security, Docs
Goal: Fully functional, secure, documented product
Scope: E2E tests, security audit, API docs, deployment guide

Deliverables:

 E2E Test Suite:

User journey 1: Free tier → Chat → Hit quota → Upgrade → Chat premium model
User journey 2: Create workspace → Invite member → Member joins → All chat
User journey 3: Admin manages models → Disables GPT-4 → User can't use it → Gets error
 Security Audit:

All endpoints require auth ✓
Tenant isolation: User from Tenant A can't access Tenant B data ✓
RBAC enforced: Viewer role can't invite members ✓
Quota enforced: Can't exceed limits ✓
Input validation on all endpoints ✓
Rate limiting on auth endpoints ✓
 Documentation:

API docs (Swagger/OpenAPI)
Deployment guide (Docker, K8s)
User guide (Electron app, features)
Developer guide (Adding new models, services)
 Deployment:

Docker images for all services
docker-compose for local dev + prod variants
Kubernetes manifests (optional)
CI/CD pipeline (GitHub Actions)
Files to Create:

Code
__tests__/e2e/
├── free-to-pro-upgrade.test.ts
├── team-collaboration.test.ts
└── quota-enforcement.test.ts

docs/
├── API.md                      (Swagger link)
├── DEPLOYMENT.md
├── SECURITY.md
├── USER_GUIDE.md
└── DEV_GUIDE.md

. github/workflows/
├── test.yml                    (Run tests on PR)
├── build.yml                   (Build Docker images)
└── deploy.yml                  (Deploy to production)
Testing:

bash
# Run all E2E tests
pnpm test -- --testPathPattern="e2e"

# Result: All tests pass ✓

# Security scan
pnpm lint && pnpm typecheck

# Build Docker images
docker build -f infra/docker/Dockerfile. auth-service -t geko-ai/auth: latest . 
docker build -f infra/docker/Dockerfile.api-gateway -t geko-ai/gateway:latest . 
# ...  (repeat for all services)

# Start full stack locally
docker-compose -f infra/docker-compose.yml up

# Verify all services healthy
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
# ... (all return 200)

# Electron app
cd apps/electron-app
pnpm build  # Build to . dmg / .exe

# Ready to ship!
📊 Summary Table: 30-Day Roadmap
Week	Days	Focus	Key Output
1	1-2	Infra, Docker, services	All 6 services running with /health
1	3	DB schema	Migrations, all tables created
1	4	Auth	Login, register, JWT working
1	5	Workspaces	Workspace CRUD, member invite
1	6	Model catalog	Model list, local model status
1	7	API Gateway	Auth middleware, routing, context
2	8-9	RBAC	Permissions matrix, free tier logic
2	10	Quotas	Per-plan quotas, enforcement
2	11	Gateway perms	Permission + quota middleware
2	12	Model enablement	Workspace can customize models
2	13	Usage tracking	Record tokens, costs, aggregations
2	14	Audit logs	All actions logged, E2E tests
3	15	Stripe	Checkout sessions, webhooks
3	16	Premium models	Restrict to paid plans
3	17	PayGo billing	Usage-based charging
3	18	Overage enforcement	Soft/hard limits, alerts
3	19	Billing APIs	Usage, invoices, payment methods
3	20-21	Integration tests	E2E flows, security audit, docs
4	22-23	Electron auth	App shell, login flow
4	24	Model marketplace	Install local, show status
4	25	Chat interface	Streaming, quota bar, sources
4	26-27	Team management	Invite, roles, audit logs
4	28	Web search + tools	MCP toggles, source panel
5	29-30	QA, docs, deploy	E2E tests, security audit, docker
🎯 Key Principles Throughout
Incremental: Each day delivers working, testable code
Foundation-first: Services, auth, and DB before UI
Security: Tenant isolation, RBAC, audit logs from Day 1
User-centric: Free tier first, then paid tiers
Open-source friendly: Minimal custom code, leverage librechat
Deployment-ready: Docker and docs from Day 1
✅ What You Get at the End
✅ Full multi-tenant SaaS platform
✅ Local models (always free) + Cloud models (free tier + pro/paygo)
✅ Team collaboration with RBAC
✅ Usage tracking and billing (Stripe)
✅ Electron app for chat, settings, team management
✅ Web search, code interpreter, custom tools
✅ Security: Tenant isolation, audit logs, RBAC enforcement
✅ Documentation: API docs, deployment guide, user guide
✅ Ready for production deployment
**Ready to kick off Day 1? ** I can create detailed GitHub issues for each day with exact file paths, code snippets, tests, and implementation steps. Just let me know! 🚀