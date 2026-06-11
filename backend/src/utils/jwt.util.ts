// =============================================================================
// File: backend/src/utils/jwt.util.ts
// Purpose: Sign and verify JWT access and refresh tokens
// Dependencies: jsonwebtoken, env.ts, app-error.ts
// =============================================================================

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types/auth.types';
import { AppError } from './app-error';

// ── Access Token ──────────────────────────────────────────────────────────────

/**
 * Signs a short-lived access token (default: 15m).
 */
export function signAccessToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    issuer: 'interntrack-api',
    audience: 'interntrack-client',
  } as jwt.SignOptions);
}

/**
 * Verifies an access token and returns the decoded payload.
 * Throws AppError on invalid/expired tokens.
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'interntrack-api',
      audience: 'interntrack-client',
    }) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.tokenExpired('Access token has expired');
    }
    throw AppError.tokenInvalid('Invalid access token');
  }
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

/**
 * Signs a long-lived refresh token (default: 7d).
 * Only embeds the user ID to minimise payload size.
 */
export function signRefreshToken(payload: Pick<JwtPayload, 'sub'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    issuer: 'interntrack-api',
  } as jwt.SignOptions);
}

/**
 * Verifies a refresh token and returns the user ID.
 * Throws AppError on invalid/expired tokens.
 */
export function verifyRefreshToken(token: string): Pick<JwtPayload, 'sub'> {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'interntrack-api',
    }) as Pick<JwtPayload, 'sub'>;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.tokenExpired(
        'Refresh token has expired. Please log in again.',
      );
    }
    throw AppError.tokenInvalid('Invalid refresh token');
  }
}
