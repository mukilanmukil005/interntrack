// =============================================================================
// File: backend/src/modules/auth/auth.schema.ts
// Purpose: Zod validation schemas for auth endpoints
// Dependencies: zod
// =============================================================================

import { z } from 'zod';

// ── Register ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(2, 'First name must be at least 2 characters')
    .max(100)
    .trim(),

  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(2, 'Last name must be at least 2 characters')
    .max(100)
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),

  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format')
    .optional(),

  college: z
    .string({ required_error: 'College name is required' })
    .min(2, 'College name must be at least 2 characters')
    .max(255)
    .trim(),

  domain: z
    .string({ required_error: 'Domain/specialization is required' })
    .min(2, 'Domain must be at least 2 characters')
    .max(200)
    .trim(),
});

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z.string({ required_error: 'Password is required' }).min(1),
});

// ── Refresh Token ─────────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token must not be empty'),
});

// ── Logout ────────────────────────────────────────────────────────────────────

export const logoutSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token must not be empty'),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
