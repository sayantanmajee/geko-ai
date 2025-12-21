/**
 * JWT Token Definitions
 * 
 * AccessToken: Short-lived (15 min), contains identity
 * RefreshToken: Long-lived (7 days), used to get new AccessToken
 * 
 * RULE: tenantId is MANDATORY in every token. 
 * This prevents accidental cross-tenant access.
 */

export interface JWTPayload {
  // Standard JWT claims
  sub: string // userId
  iat: number // issued at
  exp: number // expires at
  
  // Custom claims (multi-tenant safety)
  tenantId: string // MANDATORY
  role: string
  
  // Token type
  type: 'access' | 'refresh'
}

export interface TokenResponse {
  ok: true
  accessToken: string
  refreshToken?:  string
  expiresIn: number // seconds
}

export interface TokenError {
  ok: false
  error: string
  code: string
}

export type TokenResult = TokenResponse | TokenError

export interface TokenPayload {
  userId: string
  tenantId:  string
  role: string
}

/**
 * Session data stored server-side (optional)
 * Useful for revoking tokens, tracking logins
 */
export interface Session {
  sessionId: string
  userId: string
  tenantId: string
  accessTokenId: string
  refreshTokenId?:  string
  createdAt: number
  expiresAt: number
  ipAddress?: string
  userAgent?:  string
}