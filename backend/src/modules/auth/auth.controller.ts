// =============================================================================
// File: backend/src/modules/auth/auth.controller.ts
// Purpose: Express route handlers for auth endpoints
// Dependencies: auth.service.ts, response.util.ts
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import * as AuthService from './auth.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';

/**
 * POST /api/v1/auth/register
 * Public — Intern self-registration
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await AuthService.registerIntern(req.body);
    sendCreated(res, result, 'Account created successfully. Welcome to InternTrack!');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * Public — Login for all roles
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await AuthService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Public — Exchange refresh token for a new access token
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await AuthService.refreshAccessToken(
      (req.body as { refreshToken: string }).refreshToken,
    );
    sendSuccess(res, result, 'Access token refreshed');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Protected — Invalidate refresh token
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await AuthService.logout(
      (req.body as { refreshToken: string }).refreshToken,
    );
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Protected — Get authenticated user's profile
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // req.user is guaranteed by authenticate middleware
    const user = await AuthService.getMe(req.user!.id);
    sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
}
