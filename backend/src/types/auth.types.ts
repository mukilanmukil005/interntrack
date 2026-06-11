// =============================================================================
// File: backend/src/types/auth.types.ts
// Purpose: Shared authentication-related TypeScript interfaces
// =============================================================================

import { Role } from '@prisma/client';

/**
 * JWT payload — stored inside both access and refresh tokens.
 * `sub` is the user's UUID.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

/**
 * Issued token pair returned after login / register.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Minimal user object attached to req.user and returned in auth responses.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}
