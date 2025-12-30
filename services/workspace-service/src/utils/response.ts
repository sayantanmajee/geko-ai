/**
 * Response Formatting Utilities
 * 
 * Standardizes API response format
 * 
 * @module utils/response
 */

import type { SuccessResponse, ErrorResponse } from '@package/shared-types';

/**
 * Format success response
 * 
 * @param data - Response data
 * @returns Formatted success response
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    ok: true,
    data,
  };
}

/**
 * Format error response
 * 
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional error details
 * @returns Formatted error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?:  Record<string, any>
): ErrorResponse {
  return {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Sanitize member object before sending
 * Removes sensitive fields
 */
export function sanitizeMember(member: any): any {
  const { ... safe } = member;
  return safe;
}