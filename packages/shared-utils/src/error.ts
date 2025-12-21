/**
 * Error Type Definitions
 * 
 * All errors in the system extend AppError. 
 * This ensures consistent error responses.
 */

export interface ErrorResponse {
  ok: false
  error: string // error code (e.g., 'AUTH_REQUIRED')
  message: string
  statusCode: number
  requestId?:  string
  details?: Record<string, unknown>
}

/**
 * Base error class
 * All custom errors extend this
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?:  Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toResponse(requestId?:  string): ErrorResponse {
    return {
      ok: false,
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      requestId,
      details: this.details,
    }
  }
}

/**
 * Authentication Errors
 */
export class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super('AUTH_ERROR', 401, message)
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = 'Invalid or expired token') {
    super('INVALID_TOKEN', 401, message)
    Object.setPrototypeOf(this, InvalidTokenError.prototype)
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid email or password') {
    super('INVALID_CREDENTIALS', 401, message)
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype)
  }
}

/**
 * Tenant Errors
 */
export class TenantError extends AppError {
  constructor(message = 'Tenant is required') {
    super('TENANT_REQUIRED', 400, message)
    Object.setPrototypeOf(this, TenantError.prototype)
  }
}

export class TenantNotFoundError extends AppError {
  constructor(tenantId: string) {
    super('TENANT_NOT_FOUND', 404, `Tenant ${tenantId} not found`)
    Object.setPrototypeOf(this, TenantNotFoundError.prototype)
  }
}

/**
 * User Errors
 */
export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super('USER_NOT_FOUND', 404, `User ${userId} not found`)
    Object.setPrototypeOf(this, UserNotFoundError.prototype)
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super('USER_ALREADY_EXISTS', 409, `User with email ${email} already exists`)
    Object.setPrototypeOf(this, UserAlreadyExistsError.prototype)
  }
}

/**
 * Validation Errors
 */
export class ValidationError extends AppError {
  constructor(message:  string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', 400, message, details)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Rate Limit / Quota Errors
 */
export class QuotaExceededError extends AppError {
  constructor(
    resource: string,
    limit: number,
    details?: Record<string, unknown>
  ) {
    super(
      'QUOTA_EXCEEDED',
      429,
      `${resource} limit of ${limit} exceeded`,
      details
    )
    Object.setPrototypeOf(this, QuotaExceededError.prototype)
  }
}

/**
 * Service / Infrastructure Errors
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: Record<string, unknown>) {
    super('INTERNAL_ERROR', 500, message, details)
    Object.setPrototypeOf(this, InternalServerError.prototype)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super('SERVICE_UNAVAILABLE', 503, `${service} is currently unavailable`)
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype)
  }
}

/**
 * Type guard:  check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}