// =============================================================================
// File: backend/src/middleware/rbac.middleware.ts
// Purpose: Role-Based Access Control guard middleware factory
// Dependencies: @prisma/client, app-error.ts
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/app-error';

/**
 * Returns Express middleware that restricts access to specific roles.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole(Role.ADMIN), handler);
 *   router.get('/admin-or-mentor', authenticate, adminOrMentor, handler);
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        AppError.forbidden(
          `Access denied. This action requires role: ${roles.join(' or ')}`,
        ),
      );
      return;
    }

    next();
  };
}

// ── Convenience guards ────────────────────────────────────────────────────────

/** Allows only ADMIN */
export const adminOnly = requireRole(Role.ADMIN);

/** Allows only MENTOR */
export const mentorOnly = requireRole(Role.MENTOR);

/** Allows only INTERN */
export const internOnly = requireRole(Role.INTERN);

/** Allows ADMIN or MENTOR */
export const adminOrMentor = requireRole(Role.ADMIN, Role.MENTOR);

/** Allows MENTOR or INTERN */
export const mentorOrIntern = requireRole(Role.MENTOR, Role.INTERN);

/** Allows any authenticated role */
export const anyRole = requireRole(Role.ADMIN, Role.MENTOR, Role.INTERN);
