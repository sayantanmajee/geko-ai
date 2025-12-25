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