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

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/server.js"]
