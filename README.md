# 🚀 GEKO-AI

> **Self-hosted AI workspace for teams.** Multi-tenant, multi-workspace, enterprise-ready.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Beta-yellow)](https://github.com/yourusername/geko-ai)

**One workspace. All your tools. One interface.**

```text
Sales Team         Engineering Team      Finance Team
├─ GPT-4           ├─ Claude             ├─ Claude
├─ Google Search   ├─ GitHub             └─ Web Search
├─ Slack API       ├─ Jira
└─ Email MCP       └─ Local Ollama
```

- ✅ **Any AI model** (GPT-4, Claude, Ollama, more)
- ✅ **Any tool** (Google Search, GitHub, Jira, Slack, custom APIs)
- ✅ **Any workflow** (agents, multi-step tasks, automation)
- ✅ **Full control** (your server, your data, no limits)

---

## 🏢 For Your Organization

- **Multi-workspace** - Sales, Engineering, Finance each get their own config
- **Role-based access** - Owner, Admin, Member, Viewer
- **Usage quotas** - Control spend per team/workspace
- **Audit logs** - Every action tracked (compliance ready)
- **Enterprise auth** - JWT, OAuth, SAML (coming)

---

## 👨‍💻 For Your Developers

Stop fighting ChatGPT. Start building with AI as a first-class citizen.

```typescript
// Your API is AI-enabled from day one
POST /v1/chat/send
{
  message: "Write a function that...",
  model: "gpt-4",
  mcps: ["github", "web_search"]
}

// WebSocket streaming, quota tracking, audit logs.
// All built in. All production-ready.
```

---

## 🎯 Use Cases

### Development Teams
> "Write code with AI as your pair programmer"

```text
├─ Claude analyzes pull requests
├─ GPT-4 explains architecture
├─ GitHub MCP shows your repos
├─ Web search finds best practices
└─ All in one workspace
```

### Sales & Marketing
> "Generate content 10x faster"

```text
├─ GPT-4 writes proposals
├─ Web search finds competitor research
├─ Slack integration shares wins
├─ Jira MCP tracks leads
└─ Templates for everything
```

### Operations & Finance
> "Automate repetitive work"

```text
├─ Claude analyzes reports
├─ Google Sheets MCP pulls data
├─ Custom tools integrate your APIs
├─ Quotas prevent overspend
└─ Audit logs prove compliance
```

### Enterprises
> "AI on YOUR terms"

```text
├─ Self-hosted (no data leaving your network)
├─ Custom models (fine-tuned on your data)
├─ Full audit trail (compliance)
├─ Role-based access (governance)
├─ Usage controls (budget safety)
└─ SSO integration (employee login)
```

---

## 🔥 What Makes This Different

| Feature | ChatGPT | Claude Web | GEKO-AI (Self-Hosted) |
| :--- | :---: | :---: | :---: |
| Multi-Tenant | ❌ | ❌ | ✅ |
| Team Workspaces | ❌ | ❌ | ✅ |
| Custom Tools/MCPs | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ |
| Usage Quotas | ❌ | ❌ | ✅ |
| Role-Based Access | ❌ | ❌ | ✅ |
| API-First | ❌ | ❌ | ✅ |
| Your Data, Your Rules | ❌ | ❌ | ✅ |

---

## ⚡ How It Makes Your Dev Life Easy

### Before GEKO-AI
> Monday Morning

- ❌ "What was that prompt I used?"
- ❌ "I need the context from last week's chat"
- ❌ "Can we add GitHub info here?"
- ❌ "Who can see this? Is it safe?"
- ❌ "We're paying $100/month per person??"
- ❌ 2 hours lost jumping between tools

### With GEKO-AI
> Monday Morning

- ✅ "Everything is in one place"
- ✅ "I can search my entire history"
- ✅ "GitHub, Google, custom tools are built in"
- ✅ "Role-based access controls everything"
- ✅ "I can see exactly who used what"
- ✅ "Quotas keep costs predictable"
- ✅ +2 hours of actual work

---

## 🚀 Quick Start (3 minutes)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)

### Setup

#### 1. Clone repository

```bash
git clone https://github.com/yourusername/geko-ai
cd geko-ai && pnpm install
```

#### 2. Start PostgreSQL (using Docker)

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

#### 3. Run migrations

```bash
psql -h localhost -U postgres -d saas_platform < infra/postgres/migrations/001_init_schema.sql
```

#### 4. Start Auth Service

```bash
cd services/auth-service
cp .env.example .env
npm run dev
# ✅ Running on http://localhost:3001
```

### Test It

Register a new account:

```bash
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "SecurePass123",
    "tenantName": "My Company"
  }'

# Expected response:
# {
#   "ok": true,
#   "accessToken": "eyJhbGc...",
#   "user": { ... },
#   "tenant": { ... }
# }
```

**Done!** You have a running multi-tenant AI workspace. 🎉

---

## 📚 Documentation

| Document | For | Time |
| :--- | :--- | :--- |
| [Architecture](docs/ARCHITECTURE.md) | Architects, DevOps | 10 min |
| [API Reference](docs/API.md) | Developers | 15 min |
| [Database Schema](docs/DATABASE.md) | Database Engineers | 10 min |
| [Developer Setup](docs/DEVELOPMENT.md) | Developers | 5 min |
| [Deployment](docs/DEPLOYMENT.md) | DevOps, SRE | 20 min |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Databases:** PostgreSQL (app) + MongoDB (chat)
- **Authentication:** JWT + Passport.js
- **Real-time:** WebSocket
- **Deployment:** Docker + Kubernetes
- **Password Hash:** Node.js crypto (scrypt, zero deps)

---

## 📊 Architecture

```text
┌──────────────────────────────────┐
│   Web Client + Desktop Client    │
└────────────────┬─────────────────┘
                 │ HTTP + WebSocket
    ┌────────────▼──────────────┐
    │   API Gateway (3002)      │
    │  • Auth validation        │
    │  • Workspace routing      │
    │  • Quota enforcement      │
    └────┬───────┬──────────┬───┘
         │       │          │
    ┌────▼──┐┌───▼───┐┌────▼─────┐
    │Auth   ││Workspace││LibreChat│
    │(3001) ││(3003)   ││(3080)   │
    └─┬─────┘└───┬────┘└───┬─────┘
      │          │         │
   ┌──▼──────────▼───┐ ┌───▼─────┐
   │  PostgreSQL     │ │ MongoDB  │
   │  (multi-tenant) │ │ (chat)   │
   └─────────────────┘ └──────────┘
```

### Key Services

- **Auth Service** - Registration, login, JWT tokens, user management
- **Workspace Service** - Workspace CRUD, members, configuration, quotas
- **API Gateway** - Request routing, middleware, WebSocket management
- **LibreChat Backend** - Vanilla fork, chat execution, agents, MCPs
- **Code Runtime** - Dev mode, code execution sandbox (future)

---

## 🎯 Roadmap

### ✅ [Released] v0.1.0 Multi-tenant auth (Dec 23, 2025)
- User registration, login, JWT tokens, PostgreSQL schema

### 🚧 [In Progress] v0.2.0 Workspace management (ETA: Week 2-3 Jan 2026)
- Workspace CRUD, Member management, Configuration, Quota management

### 📋 [Planned] v0.3.0 Chat API + Integration (ETA: Week 4 Jan 2026)
- Chat endpoint with WebSocket streaming, LibreChat integration, Agent execution, MCP orchestration

### 📋 [Planned] v1.0.0 Production Ready (ETA: End of Jan 2026)
- Dev Mode, Custom tool builder, Advanced agents, Security hardening

---

## 💻 Developer Setup

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/geko-ai
cd geko-ai

# Install dependencies (uses pnpm monorepo)
pnpm install

# Setup environment
cd services/auth-service
cp .env.example .env
# Edit .env with your database credentials
```

### Start Development

```bash
# Terminal 1: PostgreSQL (Docker)
docker run -d --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:15

# Terminal 2: Auth Service (localhost:3001)
cd services/auth-service && npm run dev

# Terminal 3: LibreChat Backend (localhost:3080) - optional
cd services/librechat-backend && npm run dev:api
```

### Useful Commands

```bash
npm run dev          # Start development with hot reload
npm test             # Run all tests
npm test:watch       # Run tests in watch mode
npm run type-check   # Type check (TypeScript)
npm run lint         # Lint code (ESLint)
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code (Prettier)
npm run build        # Build for production
npm start            # Run production build
```

### Database Commands

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d saas_platform

# Run all migrations
psql -h localhost -U postgres -d saas_platform -f infra/postgres/migrations/001_init_schema.sql
psql -h localhost -U postgres -d saas_platform -f infra/postgres/migrations/002_initial_data.sql

# Backup/Restore
pg_dump -h localhost -U postgres saas_platform > backup.sql
psql -h localhost -U postgres saas_platform < backup.sql
```

---

## 🤝 Contributing

We welcome contributions from everyone! Whether you're a developer, designer, or documentation writer, there's a place for you.

### Quick Start

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally: `git clone https://github.com/YOUR-USERNAME/geko-ai`
3. **Create feature branch:** `git checkout -b feature/your-feature-name`
4. **Make changes** and test locally (`npm test`, `npm run lint`).
5. **Commit:** `git commit -m "feat: add your feature"`
6. **Push:** `git push origin feature/your-feature-name`
7. **Open Pull Request** on GitHub.

### Areas We Need Help

**High Priority:**
- ⭐ Workspace Service implementation (DAY 3)
- ⭐ API Gateway development (DAY 3)
- ⭐ Chat API with WebSocket (DAY 4)

**Medium Priority:**
- 📚 Documentation improvements
- 🐛 Bug fixes and issues

---

## 📋 Requirements

### Development

| Component | Requirement |
| :--- | :--- |
| Node.js | 18.0.0+ |
| npm/pnpm | 8.0.0+ |
| PostgreSQL | 14.0+ |
| RAM | 4GB minimum |

### Production

| Component | Requirement |
| :--- | :--- |
| Node.js | 18.0.0+ LTS |
| PostgreSQL | 14.0+ (managed recommended) |
| MongoDB | For LibreChat (managed service) |
| RAM | 8GB per service |

---

## 🔐 Security

- **Passwords:** Hashed with Node.js crypto (scrypt)
- **Tokens:** JWT (15min access, 7day refresh)
- **Database:** SQL injection prevention (parameterized queries)
- **Audit:** Complete action logging with user/IP/timestamp
- **Access Control:** Role-based, Tenant-isolated, API-based validation

---

## 💬 Support & FAQ

**Q: Is this production-ready?**  
A: v0.1.0 is in beta. Full production release coming v1.0.0 (late January 2026).

**Q: Can I modify LibreChat?**  
A: We keep it vanilla. All customization happens at the API Gateway layer.

**Q: How do I scale this?**  
A: Use Kubernetes for horizontal scaling (see deployment docs).

**Q: What about data privacy?**  
A: Your data stays on YOUR server. We don't collect anything.

---

## 👨‍💻 Authors

- **Sayantan Majee** ([@sayantanmajee](https://github.com/sayantanmajee)) - Founder & Lead Developer

---

## 📄 License

This project is licensed under the **MIT License**.

---

## ⭐ Show Your Support

Love GEKO-AI? Please:

- ⭐ **Star this repo** - Help others discover it
- 🐛 **Report issues** - Help us improve
- 🚀 **Spread the word** - Be an advocate

---

<div align="center">

### 🎉 Ready to transform your team's AI workflow?

[Get Started](#-quick-start-3-minutes) • [Documentation](#-documentation) • [Community](https://github.com/yourusername/geko-ai/discussions)

**Made with ❤️ by the GEKO-AI Team**

</div>