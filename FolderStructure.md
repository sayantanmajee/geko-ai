geko-ai/
│
├── . github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── packages/
│   ├── shared-types/              # ✅ DONE (locked)
│   │   ├── src/
│   │   │   ├── tenant. ts
│   │   │   ├── user.ts
│   │   │   ├── token.ts
│   │   │   ├── request.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared-utils/              # ✅ DONE (locked)
│   │   ├── src/
│   │   │   ├── logger.ts
│   │   │   ├── error.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── librechat-types/           # 🆕 Extract types from LibreChat
│       ├── src/
│       │   ├── conversation.ts
│       │   ├── message.ts
│       │   ├── agent.ts
│       │   ├── mcp.ts
│       │   ├── file.ts
│       │   └── index.ts
│       └── package.json
│
├── services/
│   │
│   ├── auth-service/              # 🆕 OAuth + JWT + Tenant mapping
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── index.ts
│   │   │   │   └── database.ts
│   │   │   ├── database/
│   │   │   │   ├── connection.ts
│   │   │   │   └── queries/
│   │   │   │       ├── users.ts
│   │   │   │       └── tenants.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── tenant.service.ts
│   │   │   │   ├── passport.service.ts
│   │   │   │   └── token.service.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts      # /v1/auth/*
│   │   │   │   ├── user.routes. ts      # /v1/users/*
│   │   │   │   └── index.ts
│   │   │   ├── middleware/
│   │   │   │   ├── error.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   └── validators.ts
│   │   │   ├── __tests__/
│   │   │   ├── server.ts
│   │   │   └── index.ts
│   │   ├── jest.config.js
│   │   ├── . env. example
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── api-gateway/                # 🆕 Multi-tenant wrapper + streaming
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── index.ts
│   │   │   │   └── librechat.ts
│   │   │   ├── clients/
│   │   │   │   └── librechat.client.ts  # Axios calls to LibreChat
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── workspace.middleware.ts
│   │   │   │   ├── quota.middleware.ts
│   │   │   │   └── error.handler.ts
│   │   │   ├── routes/
│   │   │   │   ├── chat.routes.ts       # /v1/chat/*
│   │   │   │   ├── conversations.routes.ts
│   │   │   │   ├── agents.routes.ts
│   │   │   │   ├── mcps.routes.ts
│   │   │   │   ├── workspaces.routes.ts # /v1/workspaces/*
│   │   │   │   ├── models. routes.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── quota.service.ts
│   │   │   │   ├── workspace.service.ts
│   │   │   │   ├── model-router.service.ts
│   │   │   │   └── transform.service.ts
│   │   │   ├── ws/                     # WebSocket handlers
│   │   │   │   ├── chat.ws.ts
│   │   │   │   └── events.ts
│   │   │   ├── __tests__/
│   │   │   ├── server.ts
│   │   │   └── index.ts
│   │   ├── jest. config.js
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── workspace-service/         # 🆕 Workspace + quota management
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   │   ├── connection.ts
│   │   │   │   └── queries/
│   │   │   │       ├── workspaces.ts
│   │   │   │       ├── quotas.ts
│   │   │   │       └── configs.ts
│   │   │   ├── services/
│   │   │   │   ├── workspace.service.ts
│   │   │   │   ├── quota.service.ts
│   │   │   │   ├── config.service.ts
│   │   │   │   └── member.service.ts
│   │   │   ├── routes/
│   │   │   │   ├── workspaces.routes.ts
│   │   │   │   ├── quotas.routes.ts
│   │   │   │   └── index.ts
│   │   │   ├── middleware/
│   │   │   ├── __tests__/
│   │   │   ├── server.ts
│   │   │   └── index.ts
│   │   ├── jest.config. js
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── librechat-backend/         # 🆕 Git subtree (VANILLA, minimal mods)
│   │   ├── api/
│   │   │   ├── server/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   ├── packages/
│   │   ├── rag/
│   │   ├── package.json
│   │   └── ... 
│   │
│   ├── code-runtime/              # 🆕 (For DAY 9+:  VSCode-like dev mode)
│   │   ├── src/
│   │   │   ├── runtime/
│   │   │   │   ├── executor.ts
│   │   │   │   ├── sandbox.ts
│   │   │   ├── server. ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── integrations-service/      # 🆕 (For future:  Slack, Discord, etc.)
│       ├── src/
│       ├── package.json
│       └── README.md
│
├── apps/
│   │
│   ├── web/                       # 🆕 React Web (Vite)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── auth/
│   │   │   │   ├── workspaces/
│   │   │   │   ├── chat/
│   │   │   │   ├── dev-mode/      # VSCode-like editor
│   │   │   │   └── settings/
│   │   │   ├── components/
│   │   │   │   ├── Chat/
│   │   │   │   ├── Editor/        # Monaco Editor for code
│   │   │   │   ├── Sidebar/
│   │   │   │   └── shared/
│   │   │   ├── services/
│   │   │   │   ├── api. client.ts
│   │   │   │   ├── ws.client.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth. ts
│   │   │   │   ├── useWorkspace.ts
│   │   │   │   ├── useChat.ts
│   │   │   │   └── useDevMode.ts
│   │   │   ├── store/             # Zustand/Recoil
│   │   │   │   ├── auth.ts
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── chat.ts
│   │   │   │   └── devMode.ts
│   │   │   ├── types/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── . env.example
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── desktop/                   # 🆕 Electron (same React code)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   └── index.ts       # Electron main process
│   │   │   ├── preload/
│   │   │   │   └── index.ts
│   │   │   ├── renderer/
│   │   │   │   └── (shared with web/)
│   │   │   └── utils/
│   │   ├── electron-builder.yml
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── vscode-extension/          # 🆕 (For later: VSCode extension)
│       ├── src/
│       ├── package.json
│       └── README.md
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile. auth-service
│   │   ├── Dockerfile.api-gateway
│   │   ├── Dockerfile.workspace-service
│   │   ├── Dockerfile.librechat-backend
│   │   ├── Dockerfile.code-runtime
│   │   └── Dockerfile.web
│   │
│   ├── docker-compose.yml         # Local dev (all services)
│   ├── docker-compose.prod.yml    # Production
│   │
│   ├── postgres/
│   │   ├── migrations/
│   │   │   ├── 001_init_schema.sql
│   │   │   ├── 002_tenants_workspaces.sql
│   │   │   ├── 003_users.sql
│   │   │   ├── 004_quotas.sql
│   │   │   └── 005_audit_logs.sql
│   │   │
│   │   └── seeds/
│   │       └── seed. sql
│   │
│   ├── kubernetes/
│   │   ├── auth-service. yaml
│   │   ├── api-gateway.yaml
│   │   ├── workspace-service.yaml
│   │   ├── web-deployment.yaml
│   │   └── ingress.yaml
│   │
│   └── nginx/
│       └── nginx.conf
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── LIBRECHAT_MODIFICATIONS.md  (empty, no mods!)
│   ├── API. md
│   ├── DEPLOYMENT.md
│   ├── DEV_MODE.md                 (VSCode-like feature)
│   └── FEATURES.md
│
├── scripts/
│   ├── setup. sh
│   ├── migrate-db.sh
│   ├── seed-db.sh
│   └── docker-build.sh
│
├── .  env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── jest.config.js
├── package.json
├── README.md
└── ROADMAP.md