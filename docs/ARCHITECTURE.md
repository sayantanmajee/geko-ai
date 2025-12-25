# GEKO-AI Architecture

## High-Level
- **Client:** React/Electron app (login, workspace, chat, models, settings)
- **API Gateway:** Single entry point (auth, RBAC, quota, billing checks)
- **Services:** Auth, Workspace, Model, Billing, Memory (all in monorepo)
- **LibreChat:** Headless backend (model routing, streaming, conversation storage)
- **Database:** PostgreSQL (tenants, workspaces, users, models, usage, billing)

## Key Principle
All model requests flow:  Client → Gateway → LibreChat → Provider APIs
Gateway controls:  auth, plan-eligibility, quotas, usage tracking

## No Direct Provider Access
- Client never calls OpenAI/Anthropic/Google directly
- All keys stored securely in backend
- Gateway injects correct key when forwarding requests



┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │   Electron App       │      │   Web App (Phase 2)  │        │
│  │  (React + Electron)  │      │   (Next.js)          │        │
│  │                      │      │                      │        │
│  │ • Login              │      │ • Browser-based      │        │
│  │ • Workspace Select   │      │ • Responsive         │        │
│  │ • Chat UI            │      │ • Same features      │        │
│  │ • Model Management   │      │                      │        │
│  │ • Team Management    │      │                      │        │
│  │ • Settings           │      │                      │        │
│  └──────────────────────┘      └──────────────────────┘        │
│           │                              │                     │
│           └──────────────┬───────────────┘                     │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                    Uses:  SDK Client
                           │
┌──────────────────────────┼─────────────────────────────────────┐
│                 API GATEWAY LAYER (Port 3002)                  │
├──────────────────────────┼─────────────────────────────────────┤
│                          ▼                                      │
│    ┌────────────────────────────────────────────┐              │
│    │  API Gateway (Express)                     │              │
│    │                                            │              │
│    │  Middleware Chain:                         │              │
│    │  1. Auth Middleware (JWT validate)         │              │
│    │  2. Context Middleware (requestId inject)  │              │
│    │  3. RBAC Middleware (permission check)     │              │
│    │  4. Quota Middleware (limit check)         │              │
│    │  5. Route Handler (route to service)       │              │
│    │  6. Audit Middleware (log action)          │              │
│    └────────────────────────────────────────────┘              │
│                          │                                      │
│       ┌──────────────────┼──────────────────────┐              │
│       │                  │                      │              │
│       ▼                  ▼                      ▼              │
│    /auth/*            /models/*            /chat/*            │
│       │                  │                      │              │
└───────┼──────────────────┼──────────────────────┼──────────────┘
        │                  │                      │
    ┌───▼────┐      ┌──────▼────────┐      ┌────▼─────┐
    │  Auth   │      │    Model      │      │  Chat    │
    │ Service │      │   Service     │      │ (via     │
    │ (3001)  │      │   (3005)      │      │ Gateway) │
    │         │      │               │      │          │
    │ • Reg   │      │ • List models │      │ Usage    │
    │ • Login │      │ • Install     │      │ tracking │
    │ • JWT   │      │ • Status      │      │ Quota    │
    │ • Refresh      │ • Eligibility │      │ Billing  │
    └────┬────┘      └──────┬────────┘      └────┬─────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
    ┌────────────────┐  ┌──────────────┐  ┌─────────────┐
    │  Workspace     │  │ Billing      │  │  RBAC       │
    │  Service       │  │ Service      │  │  Service    │
    │  (3003)        │  │  (3006)      │  │  (3007)     │
    │                │  │              │  │             │
    │ • CRUD WS      │  │ • Track      │  │ • Perms     │
    │ • Members      │  │   usage      │  │ • Roles     │
    │ • Invites      │  │ • Quotas     │  │ • Check     │
    │                │  │ • Plans      │  │   access    │
    │                │  │ • Stripe     │  │             │
    └────┬───────────┘  └──────┬───────┘  └─────┬───────┘
         │                     │                │
         └─────────────────────┼────────────────┘
                               │
┌──────────────────────────────┼────────────────────────────────┐
│              BACKEND SERVICES & INTEGRATIONS                  │
├──────────────────────────────┼────────────────────────────────┤
│                              │                                │
│    ┌──────────────────────────────────────┐                  │
│    │     LibreChat (Headless, 3080)       │                  │
│    │                                      │                  │
│    │  Receives requests from Gateway      │                  │
│    │  Routes to providers (with OUR keys) │                  │
│    │  Returns:  messages, tokens, costs    │                  │
│    │                                      │                  │
│    │  Connected to:                        │                  │
│    │  • Ollama (local models)             │                  │
│    │  • OpenAI (cloud models)             │                  │
│    │  • Anthropic (cloud models)          │                  │
│    │  • Google (cloud models)             │                  │
│    │  • etc.                              │                  │
│    └──────────────────────────────────────┘                  │
│                      │                                        │
│       ┌──────────────┼──────────────┐                        │
│       │              │              │                        │
│       ▼              ▼              ▼                        │
│    ┌─────────┐  ┌──────────┐  ┌──────────┐                 │
│    │ Ollama  │  │ OpenAI   │  │Anthropic │                 │
│    │(Local)  │  │  API     │  │   API    │                 │
│    │ 11434   │  │ (Cloud)  │  │ (Cloud)  │                 │
│    └─────────┘  └──────────┘  └──────────┘                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  PostgreSQL      │  │  MongoDB         │                │
│  │  (5432)          │  │  (27017)         │                │
│  │                  │  │                  │                │
│  │ Tables:          │  │ Collections:     │                │
│  │ • tenants        │  │ • conversations  │                │
│  │ • users          │  │ • messages       │                │
│  │ • workspaces     │  │ • presets        │                │
│  │ • model_catalog  │  │ • assistants     │                │
│  │ • token_usage    │  │                  │                │
│  │ • quotas         │  │ (LibreChat data) │                │
│  │ • subscriptions  │  │                  │                │
│  │ • audit_logs     │  │                  │                │
│  │ • permissions    │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Redis           │  │  Stripe          │                │
│  │  (6379)          │  │  (External)      │                │
│  │                  │  │                  │                │
│  │ Cache:           │  │ • Payments       │                │
│  │ • JWT tokens     │  │ • Subscriptions  │                │
│  │ • Rate limits    │  │ • Invoices       │                │
│  │ • Model status   │  │                  │                │
│  │ • RBAC perms     │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
└──────────────────────────────────────────────────────────────┘


geko-ai/
│
├── README.md
├── PRODUCT_PLAN.md
├── ARCHITECTURE.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── . env.example
├── .eslintrc.json
├── . prettierrc
├── .gitignore
│
├── infra/
│   ├── docker-compose.yml              ← ALL services
│   ├── docker-compose.prod.yml         ← Production variant
│   ├── . env.example                    ← All service env vars
│   ├── postgres/
│   │   ├── init. sql                    ← Create databases
│   │   ├── Dockerfile                  ← Custom postgres (optional)
│   │   └── migrations/
│   │       ├── 001_init_schema.sql
│   │       ├── 002_add_model_pricing.sql
│   │       ├── 003_add_workspace_subscriptions.sql
│   │       ├── 004_add_token_usage.sql
│   │       ├── 005_add_audit_logs.sql
│   │       └── seed_data.sql
│   ├── mongodb/                        ← LibreChat conversations
│   │   ├── init.js
│   │   └── Dockerfile (optional)
│   ├── redis/
│   │   └── redis. conf
│   └── nginx/                          ← Optional reverse proxy
│       └── nginx.conf
│
├── services/
│   ├── librechat-backend/              ✅ (Headless only, no client)
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── api/
│   │   ├── src/
│   │   └── [rest of LibreChat]
│   │
│   ├── auth-service/                   ✅ (User registration, JWT, refresh)
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── server. ts
│   │   │   ├── routes/
│   │   │   │   ├── register.ts
│   │   │   │   ├── login. ts
│   │   │   │   ├── refresh.ts
│   │   │   │   └── profile.ts
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   └── db/
│   │   └── tests/
│   │
│   ├── ai-gateway/                     ✅ (Central orchestrator)
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              ← JWT validation
│   │   │   │   ├── quota.ts             ← Quota enforcement
│   │   │   │   ├── rbac.ts              ← Permission checking
│   │   │   │   └── context.ts           ← Request context injection
│   │   │   ├── routes/
│   │   │   │   ├── chat.ts              ← Proxy to LibreChat + usage tracking
│   │   │   │   ├── models. ts            ← Proxy to model-service
│   │   │   │   ├── workspaces.ts        ← Proxy to workspace-service
│   │   │   │   ├── billing.ts           ← Proxy to billing-service
│   │   │   │   └── health.ts
│   │   │   └── services/
│   │   │       ├── librechat-client. ts  ← Talk to LibreChat
│   │   │       └── service-client.ts    ← Talk to other services
│   │   └── tests/
│   │
│   ├── workspace-service/              [NEW] (Team mgmt)
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── crud. ts              ← POST/GET/PATCH/DELETE workspaces
│   │   │   │   └── members.ts           ← Invite, list, update, remove
│   │   │   ├── services/
│   │   │   │   ├── workspace. ts
│   │   │   │   └── invitation.ts
│   │   │   └── db/
│   │   └── tests/
│   │
│   ├── model-service/                  [NEW] (Model catalog + local setup)
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── models.ts            ← List, get, filter by plan
│   │   │   │   ├── local-models.ts      ← Install, remove, status
│   │   │   │   └── eligibility.ts       ← Which models user can access
│   │   │   ├── services/
│   │   │   │   ├── model-catalog.ts     ← Query catalog
│   │   │   │   ├── ollama-manager.ts    ← Download/install Ollama
│   │   │   │   └── pricing. ts           ← Get model pricing/plan
│   │   │   └── db/
│   │   └── tests/
│   │
│   ├── billing-service/                [NEW] (Usage, quotas, invoices)
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── usage.ts             ← Record, query usage
│   │   │   │   ├── quotas.ts            ← Check, enforce quotas
│   │   │   │   ├── billing.ts           ← Plans, subscriptions, invoices
│   │   │   │   └── stripe.ts            ← Stripe webhooks
│   │   │   ├── services/
│   │   │   │   ├── usage.ts
│   │   │   │   ├── quota.ts
│   │   │   │   ├── billing.ts
│   │   │   │   ├── stripe.ts
│   │   │   │   └── pricing.ts
│   │   │   └── db/
│   │   └── tests/
│   │
│   ├── rbac-service/                   [NEW] (Permissions, roles)
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── roles.ts             ← CRUD roles
│   │   │   │   ├── permissions.ts       ← Query permissions
│   │   │   │   └── assignments.ts       ← Assign roles to users
│   │   │   ├── services/
│   │   │   │   └── rbac-engine.ts       ← hasPermission() logic + caching
│   │   │   └── db/
│   │   └── tests/
│   │
│   └── memory-service/                 ✅ (Redis cache for rates, cache)
│       ├── package.json
│       ├── Dockerfile
│       ├── src/
│       │   ├── server.ts
│       │   ├── cache/
│       │   └── services/
│       └── tests/
│
├── packages/
│   ├── shared-types/                   [NEW] (TS types, enums)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── models.ts                ← Model, ModelCatalog, ModelPricing
│   │   │   ├── workspaces.ts            ← Workspace, WorkspaceMember, WorkspaceRole
│   │   │   ├── users.ts                 ← User, Tenant, JWTPayload
│   │   │   ├── billing.ts               ← Plan, Subscription, Invoice, Usage
│   │   │   ├── permissions.ts           ← Permission enum, Role, RBAC
│   │   │   ├── audit.ts                 ← AuditLog, AuditAction
│   │   │   └── errors.ts                ← AppError, ErrorCode
│   │   └── tsconfig.json
│   │
│   ├── shared-utils/                   [NEW] (Helper functions)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── logging.ts               ← Structured logger
│   │   │   ├── errors.ts                ← Error handling
│   │   │   ├── validation.ts            ← Input validation
│   │   │   ├── crypto.ts                ← Encryption, hashing
│   │   │   ├── http.ts                  ← HTTP client helpers
│   │   │   └── db.ts                    ← DB connection pools
│   │   └── tsconfig.json
│   │
│   ├── sdk/                            [NEW] (Client library)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts                ← Main SDK class
│   │   │   ├── auth.ts                  ← Login, register
│   │   │   ├── workspaces.ts            ← Workspace APIs
│   │   │   ├── models.ts                ← Model APIs
│   │   │   ├── chat.ts                  ← Chat streaming
│   │   │   ├── billing.ts               ← Billing APIs
│   │   │   └── config.ts                ← Config, baseURL, etc
│   │   └── tsconfig.json
│   │
│   └── ui-components/                  [Optional, Phase 2]
│       ├── package.json
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── styles/
│       └── tsconfig.json
│
├── apps/
│   ├── web/                            [NEW, Phase 2] (Next.js web app)
│   │   ├── package.json
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── tsconfig.json
│   │
│   ├── electron/                       [NEW, Phase 1] (Electron desktop)
│   │   ├── package.json
│   │   ├── public/
│   │   │   ├── icon.png
│   │   │   └── splash.png
│   │   ├── src/
│   │   │   ├── main/                    ← Main process
│   │   │   │   └── index.ts
│   │   │   ├── preload/
│   │   │   │   └── index.ts
│   │   │   ├── renderer/                ← React app (Vite)
│   │   │   │   ├── App.tsx
│   │   │   │   ├── pages/
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── WorkspaceSelectorPage.tsx
│   │   │   │   │   ├── ChatPage.tsx
│   │   │   │   │   └── SettingsPage.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── ChatInterface.tsx
│   │   │   │   │   ├── ModelPicker.tsx
│   │   │   │   │   ├── QuotaBar.tsx
│   │   │   │   │   ├── MembersPanel.tsx
│   │   │   │   │   └── ToolsPanel.tsx
│   │   │   │   ├── hooks/
│   │   │   │   └── styles/
│   │   │   └── main.css
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── mobile/                         [Future, Phase 3]
│       ├── package.json
│       └── [React Native or similar]
│
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md                 ✅ (System design)
│   ├── API. md                          ← Endpoint documentation
│   ├── DATABASE.md                     ← Schema documentation
│   ├── SETUP.md                        ← Developer setup
│   ├── DEPLOYMENT.md                   ← Production deployment
│   ├── CONTRIBUTING.md                 ← Contribution guidelines
│   ├── guides/
│   │   ├── local-model-setup.md
│   │   ├── cloud-model-setup.md
│   │   ├── rbac-configuration.md
│   │   └── billing-integration.md
│   └── diagrams/
│       ├── system-architecture.svg
│       ├── data-flow.svg
│       └── deployment-topology.svg
│
└── . github/
    └── workflows/
        ├── ci.yml                      ← Tests on PR
        ├── build.yml                   ← Build images
        └── deploy.yml                  ← Deploy to prod