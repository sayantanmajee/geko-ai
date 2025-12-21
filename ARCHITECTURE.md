auth-service
├─ Only handles:  OAuth, JWT, user identity
├─ No workspace logic
└─ No quota logic

workspace-service  
├─ Only handles: Workspace config, quotas, members
├─ No chat/conversation logic
└─ No auth logic

api-gateway
├─ Routes requests
├─ Calls auth-service (verify JWT)
├─ Calls workspace-service (load config)
├─ Calls librechat-backend (execute)
├─ Enforces quotas
└─ Handles streaming

librechat-backend
├─ Vanilla (no modifications)
├─ Executes conversations
├─ Manages agents, MCPs, tools
└─ Doesn't know about tenant/workspace


Request comes in with JWT (contains tenantId, workspaceId)
    ↓
API Gateway validates JWT (calls auth-service)
    ↓
API Gateway loads workspace config (calls workspace-service)
    ↓
API Gateway checks quotas (calls workspace-service)
    ↓
API Gateway routes to LibreChat + workspace context
    ↓
LibreChat executes (doesn't need to know tenant context)
    ↓
API Gateway updates quotas (calls workspace-service)
    ↓
Response sent to client


### FROM LIBRECHAT
Core Chat: 
✅ Multi-model support (GPT-4, Claude, Ollama, Bedrock, etc.)
✅ Streaming responses (via LibreChat)
✅ Conversation management (create, list, delete)
✅ Message history
✅ File uploads (images, PDFs, docs)
✅ Vision API support (GPT-4V, Claude)
✅ Code interpreter mode
✅ Web search integration
✅ Image generation (DALL-E, Midjourney, etc.)
✅ Function calling (OpenAI native functions)

MCP & Tools:
✅ MCP server orchestration
✅ Tool execution (predefined + custom)
✅ OAuth for tool providers
✅ Tool result caching
✅ Parallel tool execution
✅ Tool error handling + recovery

Agents:
✅ Agent framework (LangGraph-based)
✅ Multi-step workflows
✅ Agent routing (who does what)
✅ Memory in agents
✅ Tool composition

Vector DB:
✅ Embeddings (OpenAI, local)
✅ Semantic search
✅ RAG (retrieval-augmented generation)
✅ File chunking + indexing
✅ Vector store management

Data Storage:
✅ Conversation persistence (MongoDB)
✅ Message storage
✅ Agent definitions
✅ File metadata


### CHERRY ON TOP
Multi-Tenancy:
✅ Tenant management
✅ Tenant isolation (data, quotas, access)
✅ Per-tenant billing/quotas
✅ Tenant settings + branding
✅ Audit logs per tenant

Workspaces:
✅ Multi-workspace per tenant
✅ Workspace configuration
✅ Per-workspace model selection
✅ Per-workspace MCP selection
✅ Per-workspace quotas
✅ Workspace switching
✅ Workspace member management
✅ Workspace roles (owner, admin, member, viewer)

Auth: 
✅ OAuth (Google, GitHub, OIDC)
✅ Local auth (email/password)
✅ JWT tokens (with tenantId + workspaceId)
✅ Refresh tokens
✅ Session management
✅ Multi-factor authentication (future)
✅ SAML for enterprise (future)

Quotas & Billing:
✅ Per-workspace token limits
✅ Per-model costs tracking
✅ Usage tracking (API calls, tokens, files)
✅ Quota enforcement
✅ Rate limiting
✅ Monthly reset
✅ Overage handling
✅ Stripe integration (future)

Workspace Settings:
✅ Enable/disable models per workspace
✅ Enable/disable MCPs per workspace
✅ Configure model parameters (temperature, max_tokens)
✅ Custom system prompts
✅ Tool whitelisting
✅ Audit log viewing
✅ Data export

UI/UX:
✅ Workspace selector
✅ Multi-workspace navigation
✅ Settings UI
✅ Chat interface (streaming)
✅ Conversation browser
✅ Model selector
✅ MCP selector
✅ User profile
✅ Dark/Light mode
✅ Mobile responsive

Dev Mode (VSCode-like):
✅ Code editor (Monaco Editor)
✅ Live code execution
✅ Real-time AI integration
✅ Output panel
✅ Debugging tools
✅ Agent builder UI
✅ Workflow builder
✅ Custom tool builder
✅ Hot reload
✅ Project management

### PART C: DEV MODE (VSCode-Like Feature)
This is your killer differentiation. Let me design it properly.

**WHAT IS DEV MODE? **
Dev Mode = Figma-like unified editor where users can:

Write code
Run it live
Use AI to help write/debug code
Build custom tools
Create workflows
All in one app
Think: Cursor + Replit + ChatGPT merged into one interface

┌─────────────────────────────────────────────────────────┐
│  GEKO-AI DEV MODE                                       │
│                                                         │
│  ┌──────────────────┬──────────────────┬──────────────┐ │
│  │   File Tree      │  Code Editor     │   AI Panel   │ │
│  │                  │  (Monaco)        │              │ │
│  │ • index.ts       │                  │ "Write a     │ │
│  │ • utils.ts       │ function hello() │ function     │ │
│  │ • config.json    │   return "hi"    │ that fetches │ │
│  │                  │ }                │ from API"    │ │
│  │ [+ New File]     │                  │              │ │
│  │                  │                  │ [Generate]   │ │
│  │                  │ [▶ Run]          │ [Debug]      │ │
│  └──────────────────┴──────────────────┴──────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Output / Console                                   │ │
│  │  > node index.ts                                    │ │
│  │  ✓ Compiled successfully                            │ │
│  │  $ hello()                                          │ │
│  │  "hi"                                               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

### ARCHITECTURE: Dev Mode


┌─────────────────────────────────────────────────────────┐
│  Web UI (React + Monaco Editor)                         │
│  ├─ File tree                                           │
│  ├─ Code editor                                         │
│  ├─ Output panel                                        │
│  └─ AI assistant panel                                  │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ WebSocket      │
         │ Connection     │
         └───────┬────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Code Runtime Service (NEW - code-runtime)             │
│                                                         │
│  ├─ File system (in-memory or persistent)             │
│  ├─ Executor (run code in sandbox)                    │
│  ├─ Package manager (npm install)                     │
│  ├─ Console capture (stdout/stderr)                   │
│  ├─ Environment manager                              │
│  └─ AI integration (send code to LLM)                │
│                                                         │
│  Contains:                                              │
│  ├─ Sandbox (isolate code execution)                 │
│  ├─ Worker pool (parallel execution)                 │
│  └─ Timeout handler (prevent infinite loops)         │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ API Gateway    │
         │ (routes calls) │
         └────────────────┘

### USER WORKFLOW: Dev Mode

1. User clicks "Create New Project"
2. Dev mode opens with:
   ├─ index.ts (empty)
   └─ package.json template

3. User types code:
   ```typescript
   import axios from 'axios'
   
   async function fetchData(url: string) {
     return await axios.get(url)
   }
User asks AI: "How do I cache this with Redis?"

AI generates:

TypeScript
import redis from 'redis'
const cache = redis.createClient()

async function fetchData(url: string) {
  const cached = await cache.get(url)
  if (cached) return cached
  
  const data = await axios.get(url)
  await cache.set(url, JSON.stringify(data))
  return data
}
User clicks "Run"

Code executes in sandbox

Output shown in console

User can test the function in REPL

User creates MCP tool from this: ├─ Tool name: "fetchDataWithCache" ├─ Input schema: { url: string } ├─ Code: (above) └─ [Deploy to workspace]

Tool now available in chat as MCP

Code
