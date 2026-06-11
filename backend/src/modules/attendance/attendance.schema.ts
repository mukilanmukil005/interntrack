// =============================================================================
// File: backend/src/modules/attendance/attendance.schema.ts
// Purpose: Zod validation schemas for all attendance endpoints
// Dependencies: zod, @prisma/client
// =============================================================================

import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

// ── Paginated history query (for intern's own view + mentor/admin intern view) ─

export const attendanceHistoryQuerySchema = z
  .object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year:  z.coerce.number().int().min(2020).max(2100).optional(),
  })
  .refine(
    ({ month, year }) => (month === undefined) === (year === undefined),
    {
      message: 'Both month and year must be provided together, or neither',
      path: ['month'],
    },
  );

// ── Monthly report query (both month AND year required) ───────────────────────

export const monthlyQuerySchema = z.object({
  month: z.coerce
    .number({ required_error: 'month is required' })
    .int()
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z.coerce
    .number({ required_error: 'year is required' })
    .int()
    .min(2020, 'Year must be 2020 or later')
    .max(2100, 'Year must be 2100 or earlier'),
});

// ── Admin — all records, fully filterable ─────────────────────────────────────

export const adminAttendanceQuerySchema = z
  .object({
    page:     z.coerce.number().int().positive().default(1),
    limit:    z.coerce.number().int().positive().max(100).default(20),
    internId: z.string().optional(),
    from:     z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format for 'from'")
      .optional(),
    to:       z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format for 'to'")
      .optional(),
    status:   z.nativeEnum(AttendanceStatus).optional(),
  })
  .refine(
    ({ from, to }) => {
      if (from && to) return new Date(from) <= new Date(to);
      return true;
    },
    { message: "'from' date must be before or equal to 'to' date", path: ['from'] },
  );

// ── Route param schema ────────────────────────────────────────────────────────

export const internUserIdParamSchema = z.object({
  userId: z.string().min(1, 'Intern user ID is required'),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type AttendanceHistoryQuery = z.infer<typeof attendanceHistoryQuerySchema>;
export type MonthlyQuery           = z.infer<typeof monthlyQuerySchema>;
export type AdminAttendanceQuery   = z.infer<typeof adminAttendanceQuerySchema>;
