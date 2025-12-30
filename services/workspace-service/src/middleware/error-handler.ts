/**
 * Global Error Handler Middleware
 * 
 * Catches all errors and converts to standardized API responses
 * Must be last middleware in Express stack
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
 * Handles: 
 * - Custom AppError exceptions
 * - Database errors
 * - Unexpected errors
 * 
 * Returns consistent JSON error response
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error({
    error,
    method: req.method,
    path: req.path,
    userId: (req.user as any)?.sub,
  }, 'Error occurred');

  // Handle custom AppError
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error. toJSON());
    return;
  }

  // Handle database connection errors
  if (error. code === 'ECONNREFUSED' || error.message?. includes('connection')) {
    res.status(503).json({
      ok: false,
      error: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database connection failed.  Please try again later.',
      },
    });
    return;
  }

  // Handle duplicate key (unique constraint)
  if (error.code === '23505') {
    res.status(409).json({
      ok: false,
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists',
      },
    });
    return;
  }

  // Handle foreign key constraint
  if (error. code === '23503') {
    res.status(400).json({
      ok: false,
      error: {
        code:  'INVALID_REFERENCE',
        message: 'Referenced resource not found',
      },
    });
    return;
  }

  // Default:  500 Internal Server Error
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    ok: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      details: isDev ? error.message : undefined,
    },
  });
  next();
}