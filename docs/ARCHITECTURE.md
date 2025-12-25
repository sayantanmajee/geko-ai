# GEKO-AI Architecture

## Overview

GEKO-AI is a multi-tenant, multi-workspace AI platform built on LibreChat. 

```
┌─────────────────────────────────────┐
│  Client (Web + Electron)            │
└────────────────┬────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│ Auth   │  │ API    │  │Workspace│
│Service │  │Gateway │  │Service  │
│(3001)  │  │(3002)  │  │(3003)   │
└───┬────┘  └───┬────┘  └───┬────┘
    │           │           │
    └─────┬─────┴─────┬─────┘
          │           │
      ┌───▼────┐  ┌──▼──────┐
      │PostgreSQL│  │LibreChat │
      │          │  │MongoDB   │
      └──────────┘  └──────────┘
```

## Services

### **Auth Service (3001)**

- User authentication (register, login, refresh)
- JWT token management
- OAuth integration (Google, GitHub)
- User profile management

**Database:** PostgreSQL
**Tables:** users, tenants, oauth_tokens, sessions

**Key Files:**
```
src/
├── services/
│   ├── auth. service.ts      (Login, refresh logic)
│   ├── user.service.ts      (Register, profile)
│   └── token.service.ts     (JWT operations)
├── routes/
│   └── auth.routes.ts       (Express routes)
├── database/
│   └── queries/
│       ├── users.ts         (User CRUD)
│       └── tenants.ts       (Tenant CRUD)
└── utils/
    └── password.ts          (scrypt hashing)
```

### **API Gateway (3002)**

- Routes requests to appropriate services
- Tenant/workspace middleware
- Quota enforcement
- WebSocket management (chat streaming)

**No database** - purely routing layer

**Key Files:**
```
src/
├── middleware/
│   ├── auth.middleware.ts
│   ├── workspace.middleware.ts
│   └── quota.middleware.ts
├── routes/
│   ├── chat.routes.ts
│   └── workspaces.routes.ts
├── clients/
│   ├── auth. client.ts
│   ├── workspace.client.ts
│   └── librechat.client.ts
└── ws/
    └── chat.ws.ts
```

### **Workspace Service (3003)**

- Workspace CRUD
- Member management
- Configuration (models, MCPs, quotas)
- Quota tracking

**Database:** PostgreSQL
**Tables:** workspaces, workspace_members, workspace_config, workspace_quotas

**Key Files:**
```
src/
├── services/
│   ├── workspace. service.ts
│   ├── quota.service.ts
│   ├── config.service.ts
│   └── member.service.ts
├── routes/
│   ├── workspaces.routes. ts
│   ├── quotas.routes.ts
│   └── members.routes.ts
└── database/
    └── queries/
        ├── workspaces.ts
        ├── quotas.ts
        └── members.ts
```

### **LibreChat Backend**

- Conversation management
- Message storage
- Agent execution
- MCP orchestration
- File handling
- Vector DB (RAG)

**Database:** MongoDB (shared, not modified)
**Port:** 3080
**Status:** Vanilla fork (no modifications)

## Multi-Tenancy Model

```
Tenant (Organization)
│
├── Workspace 1 (Sales Team)
│   ├── Models:  [GPT-4, Claude]
│   ├── MCPs: [Google Search]
│   ├── Members: [alice, bob]
│   ├── Quotas: 100k tokens/month
│   └── Conversations: (in LibreChat)
│
└── Workspace 2 (Engineering)
    ├── Models: [Claude, Ollama]
    ├── MCPs: [GitHub, Jira]
    ├── Members: [charlie, diana]
    ├── Quotas: 500k tokens/month
    └── Conversations: (in LibreChat)
```

## Authentication Flow

```
1. User registers
   └─> Auth Service creates Tenant + User
   └─> Issues JWT tokens (with tenantId)

2. User logs in
   └─> Auth Service validates credentials
   └─> Issues JWT tokens

3. Token structure:
   {
     "sub": "user-id",
     "tenantId": "tenant-id",
     "workspaceId": "workspace-id",
     "role": "member",
     "type": "access",
     "exp": 1234567890
   }

4. Every request includes token
   └─> API Gateway validates
   └─> Extracts tenantId, workspaceId
   └─> Enforces access control
```

## Data Flow:  Send Chat Message

```
1. Client:
   POST /v1/chat/send
   Body: { message: ".. .", model: "gpt-4" }
   Header: Authorization: Bearer <JWT>

2. API Gateway:
   - Validates JWT
   - Extracts tenantId, workspaceId
   - Loads workspace config
   - Checks quotas
   - Routes to LibreChat

3. LibreChat:
   - Executes conversation
   - Streams response
   - Stores in MongoDB

4. API Gateway:
   - Updates quotas
   - Returns response to client
```

## Development vs Production

### Development

- Single machine, all services running locally
- PostgreSQL in Docker
- LibreChat in Docker
- Hot reload enabled

### Production

- Kubernetes orchestration
- Separate database instances
- Load balancing
- Auto-scaling
- Monitoring + logging

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Backend | Node. js + Express + TypeScript |
| Auth | JWT + Passport.js |
| DB (App) | PostgreSQL |
| DB (Chat) | MongoDB |
| Password | Node. js crypto (scrypt) |
| Vector DB | LibreChat RAG API |
| Deployment | Docker + Kubernetes |
| Logging | Winston + Pino |

## Design Principles

### 1. Separation of Concerns

Each service has single responsibility.  No cross-service business logic.

```
Auth Service  →  Only handles authentication
Workspace Service  →  Only handles workspace configuration
API Gateway  →  Only routes and enforces policies
LibreChat  →  Only executes conversations
```

### 2. Multi-Tenancy First

Every request includes tenant context. Data isolation at application level.

```
Query: SELECT * FROM users WHERE tenant_id = $1 AND user_id = $2
              ↑ Always filter by tenant_id first
```

### 3. Stateless Services

Services can be scaled horizontally.  No session affinity needed.

All state stored in: 
- PostgreSQL (our app data)
- MongoDB (LibreChat data)
- Redis (future:  caching)

### 4. Database Isolation

- App data in PostgreSQL (we control)
- Chat data in LibreChat MongoDB (external)
- Easy to migrate later

### 5. Consistent Naming

- **DB:** snake_case (PostgreSQL standard)
- **Code:** camelCase (JavaScript standard)
- **Automated mapping** at data layer

```typescript
// DB returns: { user_id, tenant_id, created_at }
// Code uses: { userId, tenantId, createdAt }
// Mapped by: mapDbRowToCamelCase()
```

## Service Communication

```
Client
  ↓
API Gateway (3002)
  ├─ Auth calls → Auth Service (3001)
  ├─ Workspace calls → Workspace Service (3003)
  └─ Chat calls → LibreChat Backend (3080)
```

**All inter-service communication via HTTP.**

**No direct database access across services.**

**Example:**
```typescript
// API Gateway calls Auth Service
const user = await authClient.getUser(userId);

// NOT:
const user = await pool.query('SELECT * FROM users WHERE .. .');
```

## Request Lifecycle

```
1. Request arrives at API Gateway
   ├─ Extract JWT from Authorization header
   ├─ Validate JWT signature
   ├─ Extract tenantId, workspaceId
   └─ Add to req.ctx

2. Route to appropriate handler
   ├─ Auth route → Call Auth Service
   ├─ Workspace route → Call Workspace Service
   ├─ Chat route → Call LibreChat Backend
   └─ Other → Handle locally

3. Process request
   ├─ Apply business logic
   ├─ Query databases
   ├─ Call external services
   └─ Build response

4. Return response
   ├─ JSON serialization
   ├─ Include requestId for tracing
   ├─ Set proper HTTP status
   └─ Send to client

5. Error handling
   ├─ Catch all errors
   ├─ Log with context
   ├─ Return standardized error response
   └─ Never expose internal details
```

## Future Architecture Changes

As product evolves, we'll gradually replace LibreChat components while keeping the API stable: 

```
Phase 1 (Current):
├─ Use LibreChat for everything
└─ API calls only (no modifications)

Phase 2 (v1.1):
├─ Keep LibreChat for model routing
├─ Build custom conversation storage
└─ Replace MongoDB with PostgreSQL

Phase 3 (v2.0):
├─ Keep LibreChat MCP orchestration
├─ Build custom agent runner
└─ Custom workflow engine

Phase 4 (v3.0):
├─ Custom everything
└─ LibreChat is completely replaced
```

**Key:** Always via API calls.  Never directly coupled. 

## Scaling Strategy

### Horizontal Scaling

```
Load Balancer
  ├─ Auth Service (3 instances)
  ├─ API Gateway (5 instances)
  ├─ Workspace Service (2 instances)
  └─ LibreChat (2 instances)

PostgreSQL (Master-Slave replication)
MongoDB (LibreChat cluster)
Redis (distributed cache)
```

### Vertical Scaling

Increase CPU/Memory for individual services based on metrics.

### Database Scaling

```
PostgreSQL: 
├─ Read replicas for reporting
├─ Sharding by tenant_id for large deployments
└─ Connection pooling (PgBouncer)

MongoDB:
├─ Atlas auto-scaling
└─ Sharding by conversation_id
```

## Monitoring & Observability

```
Logs:
├─ Winston (application logs)
├─ Centralized logging (ELK stack)
└─ Log level: DEBUG (dev) → INFO (prod)

Metrics:
├─ Response times
├─ Error rates
├─ Token usage
└─ Database queries

Tracing:
├─ Request IDs (trace entire flow)
├─ Service-to-service calls
└─ Latency per service

Alerts:
├─ High error rates (> 1%)
├─ Slow responses (> 1s)
├─ Database issues
└─ Quota exceeded
```

## Security Architecture

```
1. Authentication
   ├─ JWT tokens (15m expiry)
   ├─ Refresh tokens (7d expiry)
   └─ HTTPS in production

2. Authorization
   ├─ Role-based access (owner, admin, member, viewer)
   ├─ Tenant isolation (every query filters by tenant)
   └─ Workspace-level permissions

3. Data Protection
   ├─ Passwords:  scrypt hashing
   ├─ Database: encrypted at rest
   ├─ API:  HTTPS only
   └─ Secrets: environment variables

4. API Security
   ├─ Rate limiting (100 req/min per IP)
   ├─ Input validation
   ├─ SQL injection prevention (parameterized queries)
   └─ CORS enabled for web clients

5. Audit & Compliance
   ├─ Audit logs (all actions)
   ├─ User tracking (IP, user agent)
   ├─ Data retention policies
   └─ GDPR compliance (data export, deletion)
```

## Deployment Pipeline

```
Developer pushes code
  ↓
GitHub Actions (CI)
  ├─ Run tests
  ├─ Type check
  ├─ Lint
  └─ Build

If passes:
  ↓
Build Docker images
  ├─ auth-service: latest
  ├─ api-gateway:latest
  ├─ workspace-service:latest
  └─ web: latest

Push to registry
  ↓
Deploy to Kubernetes
  ├─ Rolling update (no downtime)
  ├─ Health checks
  └─ Auto-rollback on failure

Monitor:
  ├─ Error rates
  ├─ Response times
  └─ Resource usage
```

## Configuration Management

```
Environment Variables:
├─ . env.example (template)
├─ .env.development (local)
├─ .env.staging (staging)
└─ .env.production (production)

Secrets:
├─ JWT_SECRET
├─ DB_PASSWORD
├─ OAUTH_CLIENT_SECRET
└─ Stored in:  GitHub Secrets / AWS Secrets Manager

Feature Flags:
├─ Enable/disable features per tenant
├─ Gradual rollout
└─ Quick rollback capability
```

## Error Handling Strategy

```
Application Errors (handled):
├─ Validation errors → 400
├─ Auth errors → 401
├─ Permission errors → 403
├─ Not found → 404
└─ Conflict → 409

Server Errors (recovered):
├─ Database timeout → Retry with exponential backoff
├─ External service down → Use fallback
└─ Rate limited → Queue for later

System Errors (logged):
├─ Out of memory → Alert ops
├─ Disk full → Alert ops
└─ Network issues → Alert ops

All errors: 
├─ Logged with full context
├─ Include requestId for tracing
├─ Tracked in monitoring
└─ Trigger alerts if critical
```

## Caching Strategy

```
Layer 1: API Response Caching
├─ Workspace configs (1 hour TTL)
├─ Model lists (24 hour TTL)
└─ User permissions (15 min TTL)

Layer 2: Database Query Caching
├─ Frequently accessed queries
└─ Automatic invalidation on updates

Layer 3: External Service Caching
├─ OAuth tokens
├─ Model embeddings
└─ Search results

Implementation:
├─ Redis for distributed cache
├─ In-memory cache for local-only data
└─ Cache-aside pattern
```

---

**Last Updated:** 2025-12-23  
**Version:** 0.1.0