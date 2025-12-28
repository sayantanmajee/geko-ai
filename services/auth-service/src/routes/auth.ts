/**
 * Authentication Routes
 * 
 * HTTP endpoints for auth operations
 * - POST /v1/auth/register
 * - POST /v1/auth/login
 * - POST /v1/auth/refresh
 * - POST /v1/auth/logout
 * - GET  /v1/auth/me
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '@package/shared-utils';
import { extractBearerToken } from '@package/shared-utils';
// import { ValidationError, AppError } from '@package/shared-types';
import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

const logger = createLogger('auth-routes');
export const authRouter: Router = Router();

/**
 * POST /v1/auth/register
 * 
 * Register new tenant + user
 * Creates a new isolated tenant environment
 */
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;
  const childLogger = logger.child({ requestId });
  
  try {
    const { tenantName, tenantSlug, email, password, firstName, lastName } = req.body;
    
    childLogger.info(
      { tenantSlug, email },
      'POST /v1/auth/register - registration request received'
    );
    
    // Validate required fields
    if (!tenantName || !tenantSlug || ! email || !password) {
      childLogger.warn({ tenantSlug, email }, 'Missing required fields');
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', 'Missing required fields:  tenantName, tenantSlug, email, password')
      );
    }
    
    // Call service
    childLogger.debug({ email }, 'Calling authService.register()');
    const response = await authService.register({
      tenantName,
      tenantSlug,
      email,
      password,
      firstName,
      lastName,
    });
    
    childLogger.info({ email, tenantId: response.user.tenantId }, '✓ Registration successful');
    
    res.status(201).json(successResponse(response));
  } catch (error) {
    childLogger.error({ error: (error as Error).message }, 'Registration failed');
    next(error);
  }
});

/**
 * POST /v1/auth/login
 * 
 * Authenticate user by email + password
 * Returns JWT tokens
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;
  const childLogger = logger. child({ requestId });
  
  try {
    const { tenantId, email, password } = req.body;
    
    childLogger.info(
      { tenantId, email },
      'POST /v1/auth/login - login request received'
    );
    
    // Validate required fields
    if (!tenantId || !email || !password) {
      childLogger.warn({ tenantId, email }, 'Missing required fields');
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', 'Missing required fields:  tenantId, email, password')
      );
    }
    
    // Get IP + User-Agent for audit
    const ipAddress = (req. ip || req.connection.remoteAddress) as string;
    const userAgent = req. headers['user-agent'];
    
    childLogger.debug({ email, ipAddress }, 'Calling authService.login()');
    
    // Call service
    const response = await authService.login({
      tenantId,
      email,
      password,
      ipAddress,
      userAgent,
    });
    
    childLogger.info({ email, tenantId }, '✓ Login successful');
    
    res.json(successResponse(response));
  } catch (error) {
    childLogger.error({ error: (error as Error).message }, 'Login failed');
    next(error);
  }
});

/**
 * POST /v1/auth/refresh
 * 
 * Refresh expired access token using refresh token
 * Returns new access token
 */
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  const requestId = req. headers['x-request-id'] as string || `req-${Date.now()}`;
  const childLogger = logger.child({ requestId });
  
  try {
    const { refreshToken } = req.body;
    
    childLogger.info('POST /v1/auth/refresh - token refresh request received');
    
    if (!refreshToken) {
      childLogger.warn('Missing refresh token');
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', 'Refresh token required')
      );
    }
    
    childLogger.debug('Calling authService.refreshToken()');
    
    // Call service
    const response = await authService.refreshToken({ refreshToken });
    
    childLogger.info('✓ Token refresh successful');
    
    res.json(successResponse(response));
  } catch (error) {
    childLogger.error({ error: (error as Error).message }, 'Token refresh failed');
    next(error);
  }
});

/**
 * POST /v1/auth/logout
 * 
 * Revoke session + tokens
 */
authRouter.post('/logout', async (req: Request, res:  Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;
  const childLogger = logger.child({ requestId });
  
  try {
    const { sessionId } = req.body;
    const authHeader = req.headers. authorization;
    const token = extractBearerToken(authHeader);
    
    childLogger.info('POST /v1/auth/logout - logout request received');
    
    if (!token) {
      childLogger.warn('Missing authorization token');
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', 'Missing authorization token')
      );
    }
    
    if (!sessionId) {
      childLogger.warn('Missing session ID');
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', 'Session ID required')
      );
    }
    
    childLogger. debug({ sessionId }, 'Decoding token');
    
    // Decode token (without verification, just to get claims)
    const { decodeTokenUnsafe } = await import('@package/shared-utils');
    const decoded = decodeTokenUnsafe(token);
    
    if (!decoded) {
      childLogger.warn('Failed to decode token');
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', 'Invalid token')
      );
    }
    
    childLogger.debug({ userId: decoded.sub }, 'Calling authService. logout()');
    
    // Call service
    await authService. logout({
      sessionId,
      tenantId: decoded.tenantId,
      userId: decoded.sub,
    });
    
    childLogger. info({ userId: decoded.sub }, '✓ Logout successful');
    
    res.json(successResponse({ message: 'Logged out successfully' }));
  } catch (error) {
    childLogger.error({ error: (error as Error).message }, 'Logout failed');
    next(error);
  }
});

/**
 * GET /v1/auth/me
 * 
 * Get current user profile
 * Requires valid JWT in Authorization header
 */
authRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;
  const childLogger = logger.child({ requestId });
  
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    childLogger.info('GET /v1/auth/me - get profile request received');
    
    if (!token) {
      childLogger.warn('Missing authorization token');
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', 'Missing authorization token')
      );
    }
    
    childLogger.debug('Verifying token');
    
    // Verify token
    const { verifyToken } = await import('@package/shared-utils');
    let payload;
    try {
      payload = verifyToken(token);
      childLogger.debug({ userId: payload.sub }, 'Token verified');
    } catch (error) {
      childLogger.warn({ error: (error as Error).message }, 'Token verification failed');
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', 'Invalid or expired token')
      );
    }
    
    childLogger. debug({ userId: payload.sub }, 'Querying user from database');
    
    // Get user from database
    const { queryOne } = await import('@package/shared-utils');
    const user = await queryOne(
      'SELECT userId, email, tenantId, firstName, lastName, createdAt FROM users WHERE userId = $1',
      [payload.sub]
    );
    
    if (!user) {
      childLogger.warn({ userId: payload.sub }, 'User not found in database');
      return res.status(404).json(
        errorResponse('NOT_FOUND', 'User not found')
      );
    }
    
    childLogger.info({ userId: payload.sub }, '✓ Profile retrieved successfully');
    
    res.json(successResponse(user));
  } catch (error) {
    childLogger.error({ error: (error as Error).message }, 'Get profile failed');
    next(error);
  }
});