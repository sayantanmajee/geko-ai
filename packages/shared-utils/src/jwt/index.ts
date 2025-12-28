/**
 * ============================================================
 * JWT Token Utilities
 * ============================================================
 *
 * Responsibilities:
 * - Issue access & refresh tokens
 * - Verify and validate tokens securely
 * - Extract tokens from HTTP headers
 *
 * Security Notes:
 * - Secrets MUST be provided via environment variables
 * - Access tokens are short-lived
 * - Refresh tokens are long-lived and MUST be stored securely
 *
 * Token Claims:
 * - tenantId (multi-tenant isolation)
 * - userId   (subject)
 * - role     (authorization)
 * - type     ('access' | 'refresh')
 *
 * ============================================================
 */

import jwt from 'jsonwebtoken';
import type { SignOptions, VerifyOptions}  from 'jsonwebtoken'
import { createLogger } from '../logger/index.js';
import type { JWTPayload } from '@package/shared-types';

/* ------------------------------------------------------------------ */
/* Logger                                                             */
/* ------------------------------------------------------------------ */

const logger = createLogger('jwt-utils');

/* ------------------------------------------------------------------ */
/* Environment Validation                                             */
/* ------------------------------------------------------------------ */

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  /**
   * Fail fast: JWT secret must NEVER have a fallback in production.
   * This prevents accidentally deploying insecure builds.
   */
  throw new Error('JWT_SECRET is not defined in environment variables');
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const JWT_ALGORITHM: jwt.Algorithm = 'HS256';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type TokenType = 'access' | 'refresh';

export interface TokenPayload
  extends Omit<JWTPayload, 'iat' | 'exp'> {
  type: TokenType;
}

/* ------------------------------------------------------------------ */
/* Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

function signToken(
  payload: TokenPayload,
  options: SignOptions
): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    ...options
  });
}

/* ------------------------------------------------------------------ */
/* Token Creation                                                     */
/* ------------------------------------------------------------------ */

/**
 * Creates a short-lived access token.
 *
 * Usage:
 * - Attached to Authorization header
 * - Used for authenticating API requests
 */
export function createAccessToken(
  payload: Omit<TokenPayload, 'type'>
): string {
  return signToken(
    { ...payload, type: 'access' },
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Creates a long-lived refresh token.
 *
 * Usage:
 * - Used only to obtain new access tokens
 * - Should be stored in httpOnly + secure cookies
 */
export function createRefreshToken(
  payload: Omit<TokenPayload, 'type'>
): string {
  return signToken(
    { ...payload, type: 'refresh' },
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/* ------------------------------------------------------------------ */
/* Token Verification                                                 */
/* ------------------------------------------------------------------ */

/**
 * Verifies token integrity and expiration.
 *
 * Throws:
 * - TokenExpiredError
 * - JsonWebTokenError
 */
export function verifyToken(
  token: string,
  expectedType?: TokenType
): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM]
    } as VerifyOptions) as TokenPayload;

    if (expectedType && decoded.type !== expectedType) {
      throw new jwt.JsonWebTokenError(
        `Invalid token type. Expected '${expectedType}', received '${decoded.type}'`
      );
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT expired', { token });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT invalid', { reason: error.message });
    } else {
      logger.error('Unexpected JWT verification error', { error });
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Token Decoding (Unsafe)                                            */
/* ------------------------------------------------------------------ */

/**
 * Decodes token without verifying signature or expiry.
 *
 * ⚠️ WARNING:
 * - Do NOT use for authentication or authorization
 * - Intended only for logging or diagnostics
 */
export function decodeTokenUnsafe(
  token: string
): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* HTTP Utilities                                                     */
/* ------------------------------------------------------------------ */

/**
 * Extracts JWT from Authorization header.
 *
 * Expected format:
 *   Authorization: Bearer <token>
 */
export function extractBearerToken(
  authorizationHeader?: string
): string | null {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
