# GEKO-AI Platform - Multi-stage build
# Inspired by LibreChat's production Dockerfile
# 
# Stages:
# 1. builder: Install deps, build services
# 2. runtime:  Slim image with only runtime deps
# ============================================================================
# STAGE 1: BUILDER
# ============================================================================
FROM node:24-alpine AS builder

ENV CI=true
# Install system dependencies (builder only)
RUN apk add --no-cache \
    python3 \
    py3-pip \
    git \
    curl

# Copy uv binaries (do NOT install via apk)
COPY --from=ghcr.io/astral-sh/uv:0.9.5-python3.12-alpine /usr/local/bin/uv /usr/local/bin/uvx /usr/local/bin/

# App directory
WORKDIR /app

# --- Corepack + pnpm (single layer, guaranteed) ---
USER root
RUN corepack enable \
 && corepack prepare pnpm@10.0.0 --activate \
 && ln -sf /usr/local/lib/node_modules/corepack/dist/pnpm.js /usr/local/bin/pnpm \
 && chown -R node:node /app

USER node

# Verify pnpm exists (will fail build if not)
RUN pnpm --version

# Copy workspace manifests first (for layer caching)
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node services/*/package.json ./services/
COPY --chown=node:node packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy full source AFTER deps
COPY --chown=node:node . .

# Build all services/packages
RUN pnpm build && pnpm prune --prod

# ============================================================================
# STAGE 2: RUNTIME
# ============================================================================
FROM node:24-alpine AS runtime

# Install runtime-only deps
RUN apk add --no-cache \
    python3 \
    curl \
    tini

# Copy uv runtime binary
COPY --from=builder /usr/local/bin/uv /usr/local/bin/uvx /usr/local/bin/

WORKDIR /app

USER node

# Copy production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services ./services
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Runtime dirs
USER root
RUN mkdir -p logs uploads data
USER node
# Expose ports for all services
# Auth Service
EXPOSE 3001
# AI Gateway
EXPOSE 3002
# Workspace Service
EXPOSE 3003
# Memory Service
EXPOSE 3004
# Model Service
EXPOSE 3005
# Billing Service
EXPOSE 3006
# RBAC Service
EXPOSE 3007
# LibreChat
EXPOSE 3080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

# Start services
CMD ["pnpm", "start"]