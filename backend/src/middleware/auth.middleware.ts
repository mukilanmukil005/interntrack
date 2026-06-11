// =============================================================================
// File: backend/src/middleware/auth.middleware.ts
// Purpose: Verify JWT access token and populate req.user
// Dependencies: jwt.util.ts, app-error.ts
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { AppError } from '../utils/app-error';

/**
 * `authenticate` middleware.
 *
 * Expects: `Authorization: Bearer <access_token>` header.
 * On success: populates `req.user` with the decoded JWT payload.
 * On failure: passes an AppError to next() for the error middleware to handle.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(AppError.unauthorized('No authentication token provided'));
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  if (!token) {
    next(AppError.unauthorized('No authentication token provided'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    next();
  } catch (err) {
    next(err);
  }
}
