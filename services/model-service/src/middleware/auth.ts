/**
 * Authentication Middleware
 * 
 * Verifies JWT token and extracts user claims
 * Attaches user information to request object
 * Required for protected routes
 * 
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import { extractBearerToken, verifyToken } from '@package/shared-utils';
import { createLogger } from '@package/shared-utils';
import { AuthenticationError } from '@package/shared-types';
import type { JWTUser } from '../types/index.js';

const logger = createLogger('auth-middleware');

/**
 * Declare Express Request extension
 * Adds optional user property to Request object
 */
declare global {
  namespace Express {
    interface Request {
      user?:  JWTUser;
    }
  }
}

/**
 * Authentication middleware
 * 
 * Extracts JWT from Authorization header
 * Verifies signature and expiry
 * Attaches user to request object
 * 
 * Flow:
 * 1. Extract token from "Authorization: Bearer <token>" header
 * 2. Verify token signature with JWT_SECRET
 * 3. Check token not expired
 * 4. Extract user claims from token
 * 5. Attach user to req.user for downstream handlers
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 * @throws {AuthenticationError} If token missing/invalid
 * 
 * @example
 * // Protect route with middleware
 * app.get('/protected', authMiddleware, (req, res) => {
 *   console.log(req.user. sub); // userId
 *   console.log(req.user.tenantId); // tenantId
 * });
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Step 1: Extract token from Authorization header
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      logger.warn(
        { path: req.path, method: req.method },
        'Missing authorization token'
      );
      throw new AuthenticationError('Missing authorization token');
    }

    // Step 2-3: Verify token (checks signature and expiry)
    let user: JWTUser;
    try {
      user = verifyToken(token) as JWTUser;
    } catch (verifyError) {
      logger.warn(
        { error: (verifyError as Error).message, path: req.path },
        'Token verification failed'
      );
      throw new AuthenticationError('Invalid or expired token');
    }

    // Step 4: Validate token structure
    if (!user. sub || !user.tenantId) {
      logger.warn({ user }, 'Invalid token structure - missing claims');
      throw new AuthenticationError('Invalid token - missing required claims');
    }

    // Step 5: Attach user to request
    req.user = user;

    logger.debug(
      { userId: user.sub, tenantId: user.tenantId },
      'User authenticated successfully'
    );

    // Continue to next middleware/handler
    next();
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
}