// =============================================================================
// File: backend/src/middleware/error.middleware.ts
// Purpose: Centralized global error handler — MUST be last middleware in Express
// Dependencies: zod, logger.ts, app-error.ts
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../utils/app-error';

// Prisma error shape (avoid importing PrismaClientKnownRequestError directly)
interface PrismaKnownError {
  code: string;
  meta?: { target?: string[] };
}

function isPrismaKnownError(err: unknown): err is PrismaKnownError {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return false;
  }
  // Extract to local variable so TypeScript can narrow unknown → string
  const code = (err as Record<string, unknown>).code;
  return typeof code === 'string' && code.startsWith('P');
}

/**
 * Express 4-argument error middleware — handles all errors thrown or passed via next(err).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Zod validation error ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // ── Known operational AppError ────────────────────────────────────────────
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  // ── Prisma known request errors ───────────────────────────────────────────
  if (isPrismaKnownError(err)) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] ?? 'field';
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `A record with this ${field} already exists`,
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Record not found' },
      });
      return;
    }
  }

  // ── Unexpected / unhandled errors ─────────────────────────────────────────
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body as unknown,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}
