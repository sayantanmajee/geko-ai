# Services Guide

Detailed guide for each microservice in GEKO-AI.

---

## Auth Service (Port 3001)

**Repository:** `services/auth-service/`  
**Language:** TypeScript + Node.js + Express  
**Database:** PostgreSQL

### Overview

Handles all user authentication and account management.

**Responsibilities:**
- User registration
- Email/password authentication
- Password hashing and verification
- JWT token management (issue, refresh, validate)
- User profiles
- OAuth integration (future)

### Key Files

```
src/
├── config/
│   ├── index.ts                 # Config loader + validator
│   └── database.ts              # PostgreSQL connection
├── database/
│   ├── queries/
│   │   ├── tenants.ts          # Tenant CRUD
│   │   └── users.ts            # User CRUD
│   ├── types. ts                # Database row interfaces
│   └── utils/
│       └── db-mapper.ts         # snake_case ↔ camelCase
├── services/
│   ├── auth. service.ts          # Login, refresh logic
│   ├── user.service.ts          # Register, profile
│   └── token.service.ts         # JWT operations
├── routes/
│   └── auth. routes.ts           # Express routes
├── middleware/
│   └── error. handler.ts         # Error handling
├── utils/
│   └── password. ts              # scrypt hashing
├── server.ts                    # Server startup
└── __tests__/                   # Unit tests
```

### Endpoints

```
POST   /v1/auth/register       Create tenant + user
POST   /v1/auth/login          Email + password auth
POST   /v1/auth/refresh        Get new access token
GET    /v1/auth/me             Get user profile
POST   /v1/auth/logout         Logout (client-side)
GET    /health                 Health check
```

See:  `docs/API.md`

### Starting

```bash
cd services/auth-service

# Install
npm install

# Setup env
cp .env.example .env
# Edit .env with your database credentials

# Development
npm run dev

# Production
npm run build
npm start
```

### Environment Variables

```bash
# Node
NODE_ENV=development
LOG_LEVEL=debug

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_platform
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Service
AUTH_SERVICE_PORT=3001

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# URLs
CLIENT_URL=http://localhost:5173
API_GATEWAY_URL=http://localhost:3002
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm test:watch

# Coverage
npm test:coverage
```

### Database Queries

**Get user by email:**
```typescript
const user = await UserQueries.findByEmail(tenantId, email);
```

**Create user:**
```typescript
const user = await UserQueries.create({
  tenantId,
  email,
  passwordHash,
  name,
  role:  'member'
});
```

**Update user:**
```typescript
const user = await UserQueries.update(userId, {
  name:  'New Name',
  lastLoginAt: Date.now()
});
```

### Password Security

Uses Node.js built-in `crypto.scrypt`:

```typescript
// Hash password
const hash = await hashPassword(password);
// Result: "scrypt:salt_hex:key_hex"

// Verify password
const isValid = await verifyPassword(password, hash);
```

**Properties:**
- 64-byte derived key
- 16-byte random salt
- Constant-time comparison (prevents timing attacks)
- No external dependencies

---

## API Gateway (Port 3002)

**Repository:** `services/api-gateway/` (DAY 3)  
**Language:** TypeScript + Node.js + Express  
**Database:** None (purely routing)

### Overview

Central routing layer that: 
- Routes requests to appropriate services
- Enforces tenant/workspace context
- Checks quotas
- Manages WebSocket connections
- Transforms responses

**Responsibilities:**
- JWT validation
- Tenant/workspace middleware
- Quota enforcement
- Service routing
- Response transformation
- Error handling
- WebSocket management

### Architecture

```
Request → Auth Middleware → Workspace Middleware → Quota Middleware
         ↓                   ↓                       ↓
      Validate JWT      Load config            Check limits
         ↓                   ↓                       ↓
      Service Call (Auth / Workspace / LibreChat)
         ↓
      Response Transform
         ↓
      Client Response
```

### Key Files (Coming DAY 3)

```
src/
├── config/
│   └── index.ts                 # Config loader
├── middleware/
│   ├── auth.middleware.ts       # JWT validation
│   ├── workspace. middleware.ts  # Load config
│   ├── quota.middleware.ts      # Enforce limits
│   └── error. handler.ts         # Error handling
├── clients/
│   ├── auth.client.ts           # Call auth-service
│   ├── workspace.client.ts      # Call workspace-service
│   └── librechat.client.ts      # Call LibreChat
├── routes/
│   ├── chat.routes.ts           # Chat endpoints
│   ├── workspaces.routes.ts     # Workspace endpoints
│   └── index.ts                 # Route aggregation
├── services/
│   ├── quota.service.ts         # Quota logic
│   └── transform.service.ts     # Response transform
├── ws/
│   └── chat. ws.ts               # WebSocket handlers
├── server.ts                    # Server startup
└── __tests__/                   # Tests
```

### Endpoints

```
POST   /v1/chat/send           Send message
GET    /v1/chat/: convId        Get conversation
GET    /v1/workspaces          List workspaces
POST   /v1/workspaces          Create workspace
GET    /v1/workspaces/:id      Get workspace
PATCH  /v1/workspaces/:id      Update workspace
DELETE /v1/workspaces/: id      Delete workspace
```

### Middleware Stack

**Order matters:**
```
1. Logger
2. Express.json()
3. RequestId (add to every request)
4. Auth (validate JWT)
5. Workspace (load config)
6. Quota (check limits)
7. Routes
8. 404 handler
9. Error handler
```

### Service Communication

**Example:  Send Chat Message**

```typescript
// API Gateway route
router.post('/chat/send', async (req, res, next) => {
  try {
    // 1. Already validated by middleware
    const { tenantId, workspaceId } = req.ctx;

    // 2. Load workspace config
    const config = await workspaceClient.getConfig(workspaceId);

    // 3. Check quota
    const quota = await workspaceClient.getQuota(workspaceId);
    if (quota.tokensUsed >= quota.tokensLimit) {
      return res.status(429).json({ error: 'QUOTA_EXCEEDED' });
    }

    // 4. Call LibreChat
    const response = await librechatClient.sendMessage(
      req.body.message,
      req.body.model,
      config.enabledMcps
    );

    // 5. Update quota
    await workspaceClient.updateQuota(workspaceId, {
      tokensUsed: quota.tokensUsed + response.tokensUsed
    });

    // 6. Return response
    res.json({
      ok: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});
```

---

## Workspace Service (Port 3003)

**Repository:** `services/workspace-service/` (DAY 3)  
**Language:** TypeScript + Node.js + Express  
**Database:** PostgreSQL

### Overview

Manages workspaces, members, configuration, and quotas.

**Responsibilities:**
- Workspace CRUD
- Member management
- Workspace configuration
- Quota tracking
- Audit logging

### Tables

```
workspaces
├── workspace_id (PK)
├── tenant_id (FK)
├── name
├── description
├── created_by
└── status

workspace_members
├── workspace_id (FK)
├── user_id (FK)
├── role
└── joined_at

workspace_config
├── config_id (PK)
├── workspace_id (FK)
├── enabled_models (JSONB)
├── enabled_mcps (JSONB)
└── custom_settings (JSONB)

workspace_quotas
├── quota_id (PK)
├── workspace_id (FK)
├── tokens_limit
├── tokens_used
├── requests_limit
├── requests_used
└── reset_at

audit_logs
├── log_id (PK)
├── tenant_id (FK)
├── workspace_id (FK)
├── action
├── resource
└── details (JSONB)
```

### Key Files (Coming DAY 3)

```
src/
├── config/
│   └── index.ts                 # Config loader
├── database/
│   ├── queries/
│   │   ├── workspaces.ts
│   │   ├── members.ts
│   │   ├── configs.ts
│   │   ├── quotas.ts
│   │   └── audit.ts
│   └── utils/
│       └── db-mapper.ts
├── services/
│   ├── workspace.service.ts
│   ├── member.service.ts
│   ├── config.service.ts
│   ├── quota.service.ts
│   └── audit.service. ts
├── routes/
│   ├── workspaces.routes.ts
│   ├── members.routes. ts
│   ├── configs.routes.ts
│   └── quotas.routes.ts
├── middleware/
│   └── error.handler.ts
├── server.ts
└── __tests__/
```

### Endpoints

```
GET    /v1/workspaces           List user's workspaces
POST   /v1/workspaces           Create workspace
GET    /v1/workspaces/:id       Get workspace
PATCH  /v1/workspaces/:id       Update workspace
DELETE /v1/workspaces/: id       Delete workspace

POST   /v1/workspaces/:id/members         Add member
GET    /v1/workspaces/:id/members         List members
DELETE /v1/workspaces/:id/members/: userId Remove member

GET    /v1/workspaces/:id/config   Get configuration
PATCH  /v1/workspaces/:id/config   Update configuration

GET    /v1/workspaces/:id/quotas   Get quotas
PATCH  /v1/workspaces/:id/quotas   Update quotas

GET    /v1/workspaces/:id/audit    Audit log
```

See: `docs/API.md`

### Starting

```bash
cd services/workspace-service

npm install
cp .env.example .env
npm run dev
```

---

## LibreChat Backend (Port 3080)

**Repository:** `services/librechat-backend/`  
**Language:** JavaScript/TypeScript (mixed)  
**Database:** MongoDB

### Overview

**VANILLA FORK - NO MODIFICATIONS**

LibreChat handles all conversation and chat functionality.

**Responsibilities:**
- Conversation management
- Message storage
- Agent execution
- MCP orchestration
- File handling
- Vector search (RAG)
- Web search
- Code interpreter

### Key Directories

```
api/
├── server/              # Express app
├── controllers/         # Request handlers
├── models/             # MongoDB schemas
├── routes/             # Express routes
├── services/           # Business logic
│   ├── mcp-service.ts         # MCP orchestration
│   ├── agent-service.ts       # Agent execution
│   └── model-service.ts       # Model routing
└── middleware/

packages/
├── data-provider/      # Shared types
├── data-schemas/       # Mongoose schemas
└── client/            # Client packages

rag/                   # Separate RAG service
├── server/
├── embeddings/
└── docker-compose.yml
```

### Starting

```bash
cd services/librechat-backend

npm install
cp .env.example .env
npm run dev: api        # Just API (no client UI)
```

### Configuration

**LibreChat uses:**
- MongoDB (not PostgreSQL)
- Environment variables for API keys
- No tenant awareness (multi-tenant at gateway level)

### Important:  No Direct Modifications

All multi-tenant logic happens at API Gateway level. 

**Do NOT:**
- Modify schemas
- Add tenantId to LibreChat models
- Query LibreChat database directly from other services

**DO:**
- Call via HTTP (librechat.client.ts)
- Map responses at gateway level
- Keep LibreChat vanilla for easy updates

### Updating LibreChat

```bash
cd services/librechat-backend

# Pull latest
git subtree pull --prefix services/librechat-backend \
  https://github.com/danny-avila/LibreChat main

# Test
npm run dev:api

# If breaking changes, document in:  LIBRECHAT_MODIFICATIONS.md
```

---

## Local Development Setup

### All Services Running

**Terminal 1: PostgreSQL**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

**Terminal 2: Auth Service (3001)**
```bash
cd services/auth-service
npm install
npm run dev
```

**Terminal 3: LibreChat (3080)**
```bash
cd services/librechat-backend
npm install
npm run dev: api
```

**Terminal 4:  Workspace Service (3003)** (DAY 3)
```bash
cd services/workspace-service
npm install
npm run dev
```

**Terminal 5: API Gateway (3002)** (DAY 3)
```bash
cd services/api-gateway
npm install
npm run dev
```

### Stop Everything

```bash
docker stop postgres
# Kill all npm processes (Ctrl+C in each terminal)
```

### Health Checks

```bash
curl http://localhost:3001/health    # Auth Service
curl http://localhost:3002/health    # API Gateway
curl http://localhost:3003/health    # Workspace Service
curl http://localhost:3080/health    # LibreChat
```

---

## Service Communication Map

```
┌─────────────────────────────────────────────────┐
│              API Gateway (3002)                 │
└─────────────┬──────────────┬────────────────────┘
              │              │
    ┌─────────▼────┐  ┌─────▼──────────┐
    │ Auth Service │  │ Workspace      │
    │ (3001)       │  │ Service (3003) │
    │              │  │                │
    │ PostgreSQL   │  │ PostgreSQL     │
    └──────────────┘  └────────────────┘

    ┌────────────────────────────┐
    │ LibreChat Backend (3080)   │
    │                            │
    │ MongoDB                    │
    └────────────────────────────┘
```

**Rules:**
- Services communicate via HTTP only
- No direct database access between services
- API Gateway is the only entry point
- LibreChat stays vanilla

---

## Monitoring & Debugging

### Logs

Each service logs to stdout: 

```bash
# See logs for specific service
npm run dev 2>&1 | grep "auth-service"
```

### Database Queries

**Auth Service:**
```bash
psql -h localhost -U postgres -d saas_platform -c "SELECT * FROM users LIMIT 5;"
```

**LibreChat:**
```bash
mongosh "mongodb://localhost:27017"
```

### Health Endpoints

Every service has `/health`:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### Performance

Check service logs for slow queries:

```bash
npm run dev -- --debug=*
```

---

## Deployment

Each service has its own Docker image:

```bash
# Build
docker build -f infra/docker/Dockerfile. auth-service \
  -t geko-ai/auth-service:latest . 

# Run
docker run -p 3001:3001 geko-ai/auth-service: latest

# Or use docker-compose
docker-compose -f infra/docker-compose.yml up
```

See: `docs/DEPLOYMENT.md`

---

**Last Updated:** 2025-12-23  
**Version:** 0.1.0