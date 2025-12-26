/**
 * Global Error Handler Middleware
 * 
 * Must be registered LAST in Express middleware chain
 * Catches all errors and returns consistent response
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, sanitizeError } from '@package/shared-utils/errors';
import { createLogger } from '@package/shared-utils/logger';

const logger = createLogger('error-handler');

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    logger.warn(
      {
        code: error.code,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
      },
      'Application error'
    );
    return res.status(error.statusCode).json(sanitizeError(error));
  }

  // Unknown error
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    },
    'Unexpected error'
  );

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred',
      details: 
        process.env.NODE_ENV === 'development' ?  error.stack : undefined,
    },
  });
}
