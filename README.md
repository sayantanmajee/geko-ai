# SaaS Web Browser - Cloud-First, Multi-Tenant AI

A production-grade, cloud-first platform built with TypeScript, Pino, Passport, Postgres, and Turbo.

## User's Perspective:
1. Sign up → Create workspace/tenant
2. Install LLM models (Claude, GPT, local, custom)
3. Install MCPs (tools, integrations)
4. Create agents (workflows)
5. Configure custom prompts
6. Use via Electron app OR web
7. Build automation/workflows
8. Share with team members

Developer's Perspective:
1. One codebase, multi-tenant
2. Each tenant has isolated: 
   - Models
   - MCPs/Tools
   - Agents
   - Memory
   - Workflows
3. LibreChat is **pluggable execution engine**
4. Not coupled to any UI (headless)

## Architecture
Services (Turbo Monorepo) ├── auth-service (OAuth + JWT) ├── ai-gateway (Request routing) ├── memory-service (Tenant-scoped storage) └── [More services...]

Shared └── @shared-types (Types, Logger, Errors)

Question: Does it have state/lifecycle?
  ├─ YES  → CLASS (Service, Database, Logger wrapper)
  └─ NO   → FUNCTION (Utils, validators, mappers, routes)

Question: Does it need to be instantiated?
  ├─ YES  → CLASS (AuthService, UserService)
  └─ NO   → FUNCTION (Helpers, pure functions)

Question: Will it be tested in isolation?
  ├─ YES  → FUNCTION or CLASS with dependency injection
  └─ NO   → Both work, prefer simpler (function)

Question: Is it an Express route handler?
  └─ ALWAYS FUNCTION (Routes are entry points)

Question: Is it error handling?
  └─ CLASS (extends Error)

  ┌──────────────────────────────────────────────────────┐
│              Electron + Web Client                    │
│           (React TypeScript)                          │
└────────────────┬─────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────┐
│         YOUR API GATEWAY (3002)                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ 1. Auth (JWT)                                  │  │
│  │    - Login user                                │  │
│  │    - Issue token with tenantId + workspaceId  │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │ 2. Tenant Middleware                           │  │
│  │    - Extract tenant_id, workspace_id from JWT  │  │
│  │    - Validate user has access                  │  │
│  │    - Load workspace config                     │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │ 3. Router                                      │  │
│  │    - Route to LibreChat with workspace context │  │
│  │    - Apply workspace models/MCPs/quotas        │  │
│  └────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────────┘
                 │
    ┌────────────┴─────────────┐
    │                          │
┌───▼────────────────────┐  ┌──▼──────────────────────┐
│ YOUR DATABASE          │  │ LibreChat               │
│ (PostgreSQL)           │  │ (Shared Backend)        │
│                        │  │                        │
│ tenants                │  │ - conversations        │
│ workspaces             │  │ - messages             │
│ users                  │  │ - agents               │
│ workspace_models       │  │ - files                │
│ workspace_mcps         │  │ - agents (execution)   │
│ workspace_agents       │  │ (all shared, no tenant)│
│ quotas                 │  │                        │
│ audit_logs             │  │ MongoDB                │
└────────────────────────┘  └────────────────────────┘

Client: 
POST /v1/chat/send
{
  "message": "Generate sales report",
  "model": "gpt-4",
  "mcps": ["google_search"]
}
Header: Authorization: Bearer <JWT with tenantId=acme, workspaceId=sales>

↓

Your Gateway:
1. Validate JWT → extract tenantId + workspaceId
2. Load workspace config from YOUR DB: 
   {
     workspace_id: "sales",
     enabled_models: ["gpt-4", "claude"],
     enabled_mcps: ["google_search"],
     tokens_used: 45000,
     tokens_limit: 100000
   }
3. Verify:  Is GPT-4 enabled for Sales workspace?  YES
4. Verify: Is tokens_used + estimated < limit? YES
5. Prepare LibreChat request:
   {
     message: "Generate sales report",
     model: "gpt-4",
     mcps: ["google_search"],
     user_id: "alice@acme.com",
     conversation_id: "conv_123"  // LibreChat creates/manages this
   }
6. Send to LibreChat (no tenant context needed)
7. Stream response back to client
8. Update YOUR DB:  tokens_used += actual_tokens

↓

LibreChat:
- Executes with GPT-4 + Google Search
- Stores conversation in MongoDB
- Doesn't know about workspace/tenant
- Just executes what gateway tells it

## Chat flow
1. Client:  POST /v1/chat/send (with JWT containing workspace_id)
2. Gateway: Load workspace config from YOUR DB
3. Gateway: Determine which models/MCPs are enabled
4. Gateway: Enforce quotas from YOUR DB
5. Gateway: Call LibreChat with {message, model, mcps}
6. LibreChat: Execute conversation (doesn't know about tenant)
7. LibreChat: Store in MongoDB (shared instance)
8. Gateway: Link conversation to workspace in YOUR DB
9. Gateway: Update quota tracking
10. Client:  Receive response


Client: GET /v1/conversations? workspace_id=sales
↓
Gateway: Query YOUR DB for conversations linked to workspace
↓
Return list of conversations
↓
Client: Click conversation
↓
Gateway: Fetch from LibreChat MongoDB using librechat_conversation_id
↓
Return messages

DAY 1   ✅ Foundation (completed)

DAY 2   📅 Auth Service
├─ OAuth + JWT
├─ User creation (with tenant)
├─ Token includes:  userId, tenantId, workspaceId

DAY 3   📅 Your PostgreSQL Schema + Services
├─ Create tables (tenants, workspaces, users, quotas)
├─ User service (manage tenant/workspace members)
├─ Workspace service (config, enable/disable models)
├─ Quota service (track usage)

DAY 4   📅 API Gateway (Thin Wrapper)
├─ Auth middleware (validate JWT)
├─ Workspace middleware (load config from YOUR DB)
├─ Routes that call LibreChat
├─ Stream responses back

DAY 5   📅 Setup LibreChat (Vanilla, No Mods)
├─ Run LibreChat as-is
├─ Your gateway just calls it
├─ Link conversations back to YOUR DB

DAY 6   📅 Integration Tests
├─ Multi-workspace isolation
├─ Quota enforcement
├─ Cross-workspace access denied

DAY 7   📅 Web Client
├─ Workspace selector
├─ Chat interface
├─ Settings (enable/disable models)

DAY 8   📅 Electron + Docker
├─ Same React code
├─ Electron wrapper
├─ docker-compose for all services