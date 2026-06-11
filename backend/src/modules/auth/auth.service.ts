// =============================================================================
// File: backend/src/modules/auth/auth.service.ts
// Purpose: Business logic for registration, login, token refresh, and logout
// Dependencies: prisma, jwt.util, hash.util, app-error, auth.schema, env
// =============================================================================

import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { hashPassword, comparePassword } from '../../utils/hash.util';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.util';
import { AppError } from '../../utils/app-error';
import type { TokenPair, AuthUser } from '../../types/auth.types';
import type { RegisterInput, LoginInput } from './auth.schema';

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Build a token pair for an authenticated user.
 */
function buildTokenPair(user: AuthUser): TokenPair {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken };
}

/**
 * Persist a refresh token to the database.
 * Calculates expiry by parsing the JWT_REFRESH_EXPIRES env var.
 */
async function storeRefreshToken(
  userId: string,
  token: string,
): Promise<void> {
  const expiresAt = new Date();
  const str = env.JWT_REFRESH_EXPIRES; // e.g. "7d", "24h", "30m"

  if (str.endsWith('d')) {
    expiresAt.setDate(expiresAt.getDate() + parseInt(str, 10));
  } else if (str.endsWith('h')) {
    expiresAt.setHours(expiresAt.getHours() + parseInt(str, 10));
  } else if (str.endsWith('m')) {
    expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(str, 10));
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7); // fallback: 7 days
  }

  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
}

// ── Public service methods ────────────────────────────────────────────────────

/**
 * Register a new intern.
 * Creates User + InternProfile in a single transaction.
 */
export async function registerIntern(
  data: RegisterInput,
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(data.password);

  const created = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: Role.INTERN,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      internProfile: {
        create: {
          college: data.college,
          domain: data.domain,
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  });

  const tokens = buildTokenPair(created);
  await storeRefreshToken(created.id, tokens.refreshToken);

  return { user: created, tokens };
}

/**
 * Authenticate a user with email and password.
 * Works for all roles (ADMIN, MENTOR, INTERN).
 */
export async function login(
  data: LoginInput,
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  // Use generic message to avoid user enumeration
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw AppError.forbidden(
      'Your account has been deactivated. Please contact the administrator.',
    );
  }

  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const tokens = buildTokenPair(authUser);
  await storeRefreshToken(authUser.id, tokens.refreshToken);

  return { user: authUser, tokens };
}

/**
 * Exchange a valid refresh token for a new access token.
 * Validates: JWT signature, DB existence, expiry, user active status.
 */
export async function refreshAccessToken(
  incomingRefreshToken: string,
): Promise<{ accessToken: string }> {
  // 1. Verify JWT signature (throws on invalid/expired)
  const jwtPayload = verifyRefreshToken(incomingRefreshToken);

  // 2. Check DB record exists and is not expired
  const stored = await prisma.refreshToken.findUnique({
    where: { token: incomingRefreshToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      },
    },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw AppError.unauthorized(
      'Refresh token is invalid or expired. Please log in again.',
    );
  }

  // 3. Ensure token belongs to the claimed user
  if (stored.userId !== jwtPayload.sub) {
    throw AppError.unauthorized('Token mismatch detected');
  }

  // 4. Ensure user is still active
  if (!stored.user.isActive) {
    throw AppError.forbidden('Your account has been deactivated.');
  }

  const accessToken = signAccessToken({
    sub: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
    firstName: stored.user.firstName,
    lastName: stored.user.lastName,
  });

  return { accessToken };
}

/**
 * Invalidate a refresh token (logout).
 * Silently succeeds if the token doesn't exist (idempotent).
 */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

/**
 * Get the current authenticated user's full profile.
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      internProfile: {
        select: {
          college: true,
          domain: true,
          status: true,
          startDate: true,
          endDate: true,
          requiredHrs: true,
          program: { select: { title: true, duration: true } },
        },
      },
      mentorProfile: {
        select: { expertise: true, department: true, bio: true },
      },
    },
  });

  if (!user) {
    throw AppError.notFound('User not found');
  }

  return user;
}
