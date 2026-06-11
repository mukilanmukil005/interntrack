// =============================================================================
// File: backend/src/utils/app-error.ts
// Purpose: Centralized, typed error class with factory helpers
// =============================================================================

/**
 * Operational error — expected, human-readable, safe to expose to the client.
 * Non-operational errors (unexpected crashes) are handled separately.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Array<{ field: string; message: string }>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Array<{ field: string; message: string }>,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Factory helpers ────────────────────────────────────────────────────────

  static badRequest(
    message: string,
    details?: Array<{ field: string; message: string }>,
  ): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Access denied'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }

  static validation(
    message: string,
    details?: Array<{ field: string; message: string }>,
  ): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static tokenExpired(message = 'Token has expired'): AppError {
    return new AppError(message, 401, 'TOKEN_EXPIRED');
  }

  static tokenInvalid(message = 'Invalid token'): AppError {
    return new AppError(message, 401, 'TOKEN_INVALID');
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, 'SERVER_ERROR', undefined, false);
  }
}
