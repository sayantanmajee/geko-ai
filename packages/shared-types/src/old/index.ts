/**
 * Shared Types Export
 * 
 * All types exported here are available to all services.
 * Import from '@shared-types' in any service. 
 * 
 * @example
 * ```ts
 * import { Tenant, User, createLogger } from '@shared-types'
 * ```
 */

// Types
// export type { Tenant, Plan, TenantStatus, TenantQuota } from './tenant'
// export { DEFAULT_QUOTAS } from './tenant'

// export type { User, UserRole, UserStatus, LocalAuthCredential, OAuthProvider } from './user'

export type { JWTPayload, TokenResponse, TokenError, TokenResult, TokenPayload, Session } from './token'

export type { RequestContext, RequestContextRequired } from './request'
// Side-effect import for global augmentation
import './express'

// Re-export all types
export * from './tenant';
export * from './user';
export * from './workspace';
export * from './model';
export * from './billing';
export * from './rbac';
export * from './audit';
export * from './api';
export * from './context';
export * from './conversation';
export * from './enums';
export * from './errors';