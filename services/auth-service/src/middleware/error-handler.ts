/**
 * Global Error Handler Middleware
 * 
 * Catches all errors and returns consistent JSON response
 * Maps custom errors to appropriate HTTP status codes
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@package/shared-utils';
import { AppError } from '@package/shared-types';
import { errorResponse } from '../utils/response.js';

const logger = createLogger('error-handler');

export function errorHandlerMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });
  
  // Custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }
  
  // Database errors
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json(
      errorResponse('SERVICE_UNAVAILABLE', 'Database connection failed')
    );
  }
  
  if (error.code === '23505') {
    // Unique constraint violation
    return res.status(409).json(
      errorResponse('CONFLICT', 'Resource already exists')
    );
  }
  
  // Default:   500 Internal Server Error
  res.status(500).json(
    errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
  );
  next();
}