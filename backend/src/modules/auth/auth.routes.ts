// =============================================================================
// File: backend/src/modules/auth/auth.routes.ts
// Purpose: Express router for all /api/v1/auth endpoints
// Dependencies: validate.middleware, auth.middleware, auth.schema, auth.controller
// =============================================================================

import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from './auth.schema';
import * as AuthController from './auth.controller';

const router = Router();

/**
 * @route  POST /api/v1/auth/register
 * @access Public
 * @desc   Register a new intern account
 */
router.post(
  '/register',
  validate(registerSchema),
  AuthController.register,
);

/**
 * @route  POST /api/v1/auth/login
 * @access Public
 * @desc   Authenticate user, returns access + refresh tokens
 */
router.post(
  '/login',
  validate(loginSchema),
  AuthController.login,
);

/**
 * @route  POST /api/v1/auth/refresh
 * @access Public (refresh token required in body)
 * @desc   Returns a new access token using a valid refresh token
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  AuthController.refresh,
);

/**
 * @route  POST /api/v1/auth/logout
 * @access Protected
 * @desc   Invalidate the provided refresh token
 */
router.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  AuthController.logout,
);

/**
 * @route  GET /api/v1/auth/me
 * @access Protected
 * @desc   Get the current authenticated user's full profile
 */
router.get(
  '/me',
  authenticate,
  AuthController.getMe,
);

export default router;
