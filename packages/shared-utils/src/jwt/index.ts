/**
 * JWT Token Management
 * 
 * Uses jsonwebtoken library (industry standard)
 * Tokens include tenantId for multi-tenant safety
 * 
 * Token types:
 * - access: Short-lived (15 min), for API calls
 * - refresh:  Long-lived (7 days), to get new access token
 */

import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@packages/shared-types';

const SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

/**
 * Create access token
 */
export function createAccessToken(payload:  Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt. sign(
    { ...payload, type: 'access' },
    SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

/**
 * Create refresh token
 * 
 * Refresh tokens are long-lived and used to get new access tokens
 * Must be stored securely (httpOnly cookies or secure storage)
 */
export function createRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(
    { ... payload, type: 'refresh' },
    SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
}

/**
 * Verify and decode token
 * 
 * Throws error if invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, SECRET) as JWTPayload;
}

/**
 * Decode token without verification
 * 
 * UNSAFE:  Only use for debugging or when trust is implicit
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * 
 * Expects:  "Bearer <token>"
 */
export function extractToken(authHeader?:  string): string | null {
  if (!authHeader?. startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}