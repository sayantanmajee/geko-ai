/**
 * Authentication & Token Management
 * 
 * Multi-tenant safety rules: 
 * 1. tenantId is MANDATORY in every token
 * 2. Request context MUST validate tenantId matches
 * 3. Database queries MUST filter by tenantId
 * 
 * Token lifecycle:
 * - AccessToken (15 min): Used for API requests
 * - RefreshToken (7 days): Used to get new AccessToken
 * - SessionId:  Server-side revocation tracking
 */

import type { UUID, Timestamp } from './common';

/**
 * JWT Access/Refresh Token Payload
 * 
 * CRITICAL: tenantId prevents cross-tenant access
 * Never remove tenantId from token claims
 */
export interface JWTPayload {
  // Standard JWT claims
  sub: string;          // Subject (userId)
  iat: number;          // Issued at (unix timestamp)
  exp: number;          // Expires at (unix timestamp)
  
  // Multi-tenant safety (MANDATORY)
  tenantId: string;     // Prevents cross-tenant access
  role:  string;         // User role in workspace
  
  // Token metadata
  type: 'access' | 'refresh';
}

/**
 * Registration input validation
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName?:  string;
  lastName?: string;
}

/**
 * Login credentials
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Token response on successful auth
 * Both tokens returned on first auth, only accessToken on refresh
 */
export interface TokenResponse {
  ok:  true;
  accessToken: string;
  refreshToken?:  string;
  expiresIn: number; // seconds until accessToken expires
}

/**
 * User object returned after successful auth
 */
export interface AuthUser {
  userId: string;
  email: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  createdAt: Timestamp;
}

/**
 * Complete auth response (tokens + user info)
 */
export interface AuthResponse {
  ok: true;
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  expiresIn: number;
}

/**
 * Server-side session tracking
 * Enables token revocation, concurrent session limits
 */
export interface Session {
  sessionId: string;
  userId: string;
  tenantId: string;
  accessTokenHash: string;  // Hash of JWT (never store raw tokens)
  refreshTokenHash?:  string;
  createdAt: number;        // Unix timestamp
  expiresAt: number;        // Unix timestamp
  ipAddress?: string;       // For security audits
  userAgent?: string;       // For device tracking
  revokedAt?: number;       // If explicitly revoked
}

/**
 * Password validation rules
 * - 8+ chars, 1 uppercase, 1 lowercase, 1 number
 * Enforced at:  controller + client + auth-service
 */
export interface PasswordRequirements {
  minLength:  number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
};