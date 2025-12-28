/**
 * Request Context
 * 
 * Every Express request gets enriched with RequestContext. 
 * This flows through the entire request lifecycle.
 */

export interface RequestContext {
  // Identification
  requestId: string // UUID, unique per request
  tenantId: string // MANDATORY, extracted from JWT or header

  // User identity (from JWT, optional if not authenticated)
  userId?: string
  role?: string

  // Timing
  startTime: number // Date.now()

  // Metadata (optional, added by middleware)
  metadata?: Record<string, unknown>
}

/**
 * Extend Express Request to include ctx
 */
declare global {
  namespace Express {
    interface Request {
      ctx?: RequestContext
    }
  }
}

export type RequestContextRequired = Required<RequestContext>