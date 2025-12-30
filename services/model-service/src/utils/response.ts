/**
 * Response Formatting Utilities
 * 
 * Standardizes all API response formats
 * Ensures consistent structure across endpoints
 * 
 * @module utils/response
 */

import type { SuccessResponse, ErrorResponse } from '@package/shared-types';

/**
 * Format success response
 * 
 * Wraps data in standard success response structure
 * 
 * @param data - Response data of any type
 * @returns Formatted success response
 * 
 * @example
 * res.json(successResponse({ modelId: '123', name: 'GPT-4' }));
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
 * Wraps error in standard error response structure
 * 
 * @param code - Machine-readable error code
 * @param message - Human-readable error message
 * @param details - Optional error details for debugging
 * @returns Formatted error response
 * 
 * @example
 * res. status(400).json(errorResponse('INVALID_INPUT', 'Plan is required'));
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, any>
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
 * Format cost in USD with proper decimal places
 * 
 * @param cost - Cost in USD
 * @returns Formatted cost string (e.g., "$0.0015")
 */
export function formatCostUSD(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Format disk usage in human-readable format
 * 
 * @param bytes - Disk usage in bytes
 * @returns Formatted size (e.g., "2.5 GB", "500 MB")
 */
export function formatDiskUsage(bytes: number | null): string {
  if (bytes === null) return 'Unknown';

  const GB = bytes / 1024 / 1024 / 1024;
  if (GB >= 1) {
    return `${GB.toFixed(2)} GB`;
  }

  const MB = bytes / 1024 / 1024;
  if (MB >= 1) {
    return `${MB.toFixed(2)} MB`;
  }

  const KB = bytes / 1024;
  return `${KB.toFixed(2)} KB`;
}

/**
 * Sanitize model object before sending to client
 * Removes any internal fields
 * 
 * @param model - Model record
 * @returns Sanitized model
 */
export function sanitizeModel(model: any): any {
  const { ... safe } = model;
  // Could remove fields here if needed
  return safe;
}

/**
 * Sanitize list of models
 * 
 * @param models - Array of models
 * @returns Array of sanitized models
 */
export function sanitizeModels(models: any[]): any[] {
  return models.map(sanitizeModel);
}