/**
 * Error Handler Middleware
 * 
 * Catches all errors and returns standardized JSON response.
 */

import { Request, Response, NextFunction } from 'express'
import { createLogger, isAppError } from '@package/shared-utils'

const logger = createLogger('error-handler')

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || 'unknown'

  // Log full error details
  logger.error('Request error', {
    requestId,
    path: req.path,
    method: req.method,
    error: err.message,
    code: err.code,
    stack: err.stack,
  })

  // AppError (our custom errors)
  if (isAppError(err)) {
    return res.status(err.statusCode).json(err.toResponse(requestId))
  }

  // Database errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({
      ok: false,
      error: 'DUPLICATE_ENTRY',
      message: 'This record already exists',
      requestId,
    })
  }

  // Log the full error object
  console.error('FULL ERROR OBJECT:', err)
  console.error('ERROR STACK:', err.stack)

  // Unknown error
  res.status(500).json({
    ok: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
    requestId,
  })
}