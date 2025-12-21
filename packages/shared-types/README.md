# Shared Types

Core type definitions and contracts for the entire platform.

## What's Here

- **Tenant** - Top-level isolation boundary
- **User** - User identity (belongs to exactly one tenant)
- **JWT** - Token payloads and refresh logic
- **RequestContext** - Injected into every Express request
- **Errors** - Structured error classes (all errors extend AppError)
- **Logger** - Centralized Pino configuration

## Usage

```typescript
import { Tenant, User, createLogger, AppError } from '@shared-types'

const logger = createLogger('my-service')
```

## Rules

1. **Never import from other services** - Only import from `@shared-types`
2. **Never modify types without discussion** - Types are contracts
3. **Always include tenantId** - Every data structure ties to a tenant
4. **Extend AppError** - Never throw plain Error objects
5. **Use createLogger()** - Never create Pino loggers directly

## Adding New Types

1. Create file in `src/`
2. Export from `src/index.ts`
3. Update README
4. Run `pnpm -r build` to validate

## Testing

```bash
cd packages/shared-types
pnpm type-check
```