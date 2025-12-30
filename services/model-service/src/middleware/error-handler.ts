/**
 * Global Error Handler Middleware
 * 
 * Catches all errors from route handlers and middleware
 * Converts errors to standardized JSON responses
 * Must be last middleware in Express app
 * 
 * Handles:
 * - Custom AppError exceptions
 * - ValidationError (from input validation)
 * - AuthenticationError / AuthorizationError
 * - Database errors
 * - Unexpected/unhandled errors
 * 
 * @module middleware/error-handler
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '@package/shared-types';
import { createLogger } from '@package/shared-utils';

const logger = createLogger('error-handler');

/**
 * Global error handler
 * 
 * Logs all errors with context and returns standardized response
 * 
 * @param error - Error thrown by middleware/handler
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next (not used but required signature)
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error with request context
  logger.error(
    {
      error,
      errorMessage: error?. message,
      errorCode: error?.code,
      method: req.method,
      path: req.path,
      userId: (req.user as any)?.sub,
      tenantId: (req.user as any)?.tenantId,
    },
    'Error occurred in request'
  );

  // Handle custom AppError (includes ValidationError, AuthenticationError, etc.)
  if (error instanceof AppError) {
    logger.debug(
      { statusCode: error.statusCode, code: error.code },
      'Returning AppError response'
    );
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // Handle database connection errors
  if (
    error. code === 'ECONNREFUSED' ||
    error.code === 'EHOSTUNREACH' ||
    error.message?. includes('connection')
  ) {
    logger.error({}, 'Database connection error');
    res.status(503).json({
      ok: false,
      error: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database service is temporarily unavailable.  Please try again later.',
      },
    });
    return;
  }

  // Handle duplicate key constraint (unique violation)
  if (error.code === '23505') {
    logger.debug({}, 'Unique constraint violation');
    res.status(409).json({
      ok: false,
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists',
      },
    });
    return;
  }

  // Handle foreign key constraint error
  if (error.code === '23503') {
    logger.debug({}, 'Foreign key constraint violation');
    res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced resource does not exist',
      },
    });
    return;
  }

  // Default:  500 Internal Server Error
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    ok: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred. Our team has been notified.',
      // Include stack trace only in development
      details: isDevelopment ? { message: error.message, stack: error.stack } : undefined,
    },
  });
}