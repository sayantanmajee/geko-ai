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