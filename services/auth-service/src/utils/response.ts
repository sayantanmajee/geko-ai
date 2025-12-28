/**
 * Response Formatting Utilities
 * 
 * Ensures consistent response structure across all endpoints
 * Removes sensitive data before sending
 */

import type { SuccessResponse, ErrorResponse } from '@package/shared-types';

/**
 * Format success response
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    ok: true,
    data,
  };
}

/**
 * Format error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    ok: false,
    error:  {
      code,
      message,
      details,
    },
  };
}

/**
 * Remove sensitive fields from user object
 * Called before sending user data to client
 */
export function sanitizeUser(user: any) {
  const { _passwordHash, ...sanitized } = user;
  return sanitized;
}