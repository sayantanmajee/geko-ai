#!/bin/bash

#  ============================================================
# GEKO-AI Service Scaffolding Script
# 
# Creates skeleton for all remaining services
# Usage:   bash scripts/scaffold-services.sh
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Services configuration
declare -A SERVICES
SERVICES[workspace-service]="3003"
SERVICES[model-service]="3005"
SERVICES[billing-service]="3006"
SERVICES[rbac-service]="3007"
SERVICES[memory-service]="3004"
SERVICES[ai-gateway]="3002"

echo -e "${BLUE}🚀 GEKO-AI Service Scaffolding Started${NC}\n"

for SERVICE in "${!SERVICES[@]}"; do
  PORT=${SERVICES[$SERVICE]}
  SERVICE_PATH="services/$SERVICE"

  echo -e "${GREEN}Creating $SERVICE (port $PORT)...${NC}"

  # Create directories
  mkdir -p "$SERVICE_PATH/src/routes"
  mkdir -p "$SERVICE_PATH/src/middleware"
  mkdir -p "$SERVICE_PATH/src/services"

  # ============================================================
  # package.json
  # ============================================================
  cat > "$SERVICE_PATH/package.json" <<EOF
{
  "name":  "@service/$SERVICE",
  "version": "0.0.1",
  "description":  "$(echo $SERVICE | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')",
  "type": "module",
  "private": true,
  "main": "dist/server.js",
  "scripts":  {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc",
    "clean": "rm -rf dist node_modules",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src",
    "type-check": "tsc --noEmit",
    "db:migrate": "node scripts/migrate.js"
  },
  "dependencies": {
    "@packages/shared-types": "workspace:*",
    "@packages/shared-utils": "workspace:*",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "cors": "^2.8.5",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node":  "^20.10.6",
    "@types/jest": "^29.5.8",
    "typescript": "^5.3.0",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
    "tsx": "^4.7.0",
    "eslint": "^8.55.0"
  }
}
EOF

  # ============================================================
  # tsconfig.json
  # ============================================================
  cat > "$SERVICE_PATH/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "moduleResolution": "node"
  },
  "include":  ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

  # ============================================================
  # Dockerfile
  # ============================================================
  cat > "$SERVICE_PATH/Dockerfile" <<'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy packages and services
COPY packages ./packages
COPY services/$SERVICE_NAME ./services/$SERVICE_NAME

# Build service
WORKDIR /app/services/$SERVICE_NAME
RUN pnpm build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/server.js"]
EOF
  
  # Replace SERVICE_NAME and PORT in Dockerfile
  sed -i "s/\$SERVICE_NAME/$SERVICE/g" "$SERVICE_PATH/Dockerfile"
  sed -i "s/3000/$PORT/g" "$SERVICE_PATH/Dockerfile"

  # ============================================================
  # src/server.ts
  # ============================================================
  cat > "$SERVICE_PATH/src/server.ts" <<EOF
/**
 * $(echo $SERVICE | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g') Service
 * 
 * Port: $PORT
 * TODO: Add service-specific documentation
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@package/shared-utils/logger';
import { initializePool, closePool } from '@package/shared-utils/db';
import { asyncHandler } from '@package/shared-utils/errors';
import { healthRouter } from './routes/health. js';
import { errorHandler } from './middleware/error-handler.js';

const PORT = parseInt(process.env.PORT || '$PORT');
const NODE_ENV = process.env.NODE_ENV || 'development';
const logger = createLogger('$SERVICE');

const app: Express = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?. split(',') || '*',
  credentials: true,
}));

// Body parsing
app.use(express. json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use((req: Request, res: Response, next:  NextFunction) => {
  logger.debug(\`\${req.method} \${req.path}\`);
  next();
});

// Initialize database (if needed)
initializePool();

// Routes
app.use('/health', healthRouter);

// TODO: Add service-specific routes here

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message:  'Route not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(
    { port: PORT, env: NODE_ENV },
    '$(echo $SERVICE | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g') Service started'
  );
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Graceful shutdown initiated');
  
  server.close(async () => {
    await closePool();
    logger.info('Service stopped');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
EOF

  # ============================================================
  # src/routes/health.ts
  # ============================================================
  cat > "$SERVICE_PATH/src/routes/health. ts" <<'EOF'
/**
 * Health Check Endpoint
 * 
 * Used for Docker healthcheck and load balancer readiness
 */

import { Router, Request, Response } from 'express';
import type { HealthResponse } from '@package/shared-types';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response<HealthResponse>) => {
  res.json({
    ok: true,
    service: process.env.SERVICE_NAME || 'service',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});
EOF

  # ============================================================
  # src/middleware/error-handler.ts
  # ============================================================
  cat > "$SERVICE_PATH/src/middleware/error-handler.ts" <<'EOF'
/**
 * Global Error Handler Middleware
 * 
 * Must be registered LAST in Express middleware chain
 * Catches all errors and returns consistent response
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, sanitizeError } from '@package/shared-utils/errors';
import { createLogger } from '@package/shared-utils/logger';

const logger = createLogger('error-handler');

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    logger.warn(
      {
        code: error.code,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
      },
      'Application error'
    );
    return res.status(error.statusCode).json(sanitizeError(error));
  }

  // Unknown error
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    },
    'Unexpected error'
  );

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred',
      details: 
        process.env.NODE_ENV === 'development' ?  error.stack : undefined,
    },
  });
}
EOF

  echo -e "${GREEN}✓ $SERVICE scaffolded${NC}\n"
done

echo -e "${GREEN}✅ All services scaffolded!${NC}\n"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run: pnpm install"
echo "2. Run: pnpm build"
echo "3. Run: docker-compose -f infra/docker-compose.yml up"
echo ""