/**
 * Authentication Middleware
 * 
 * Verifies JWT token and extracts user claims
 * Attaches user to request object
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
 * Express Request with user attached
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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
 * Attaches user to request
 */
export function authMiddleware(
  req:  Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from header
    const token = extractBearerToken(req. headers.authorization);
    if (!token) {
      logger.warn({ path: req.path }, 'Missing authorization token');
      throw new AuthenticationError('Missing authorization token');
    }

    // Verify token
    let user: JWTUser;
    try {
      user = verifyToken(token) as JWTUser;
    } catch (error) {
      logger.warn({ error:  (error as Error).message }, 'Token verification failed');
      throw new AuthenticationError('Invalid or expired token');
    }

    // Validate token structure
    if (!user. sub || !user.tenantId) {
      logger.warn('Invalid token structure');
      throw new AuthenticationError('Invalid token');
    }

    // Attach user to request
    req.user = user;
    logger.debug({ userId: user.sub }, 'User authenticated');
    next();
  } catch (error) {
    next(error);
  }
}