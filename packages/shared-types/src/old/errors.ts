import { ErrorCode, HttpStatus } from './enums';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      ok: false,
      error: {
        code: this. code,
        message: this. message,
        details: this. details,
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.INVALID_REQUEST, message, HttpStatus.BAD_REQUEST, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(ErrorCode.INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(ErrorCode.MODEL_NOT_FOUND, `${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode. INVALID_REQUEST, message, HttpStatus.CONFLICT);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Quota exceeded', details?: any) {
    super(ErrorCode.QUOTA_EXCEEDED, message, HttpStatus.TOO_MANY_REQUESTS, details);
  }
}