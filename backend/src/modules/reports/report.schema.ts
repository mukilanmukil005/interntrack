// =============================================================================
// File: backend/src/modules/reports/report.schema.ts
// Purpose: Zod validation schemas for all daily report endpoints
// =============================================================================

import { z } from 'zod';
import { ReportStatus } from '@prisma/client';

// ── Submit / Create a report ──────────────────────────────────────────────────
// Used for multipart/form-data (text fields only — attachment handled by multer)

export const submitReportSchema = z.object({
  // Date must be a valid ISO 8601 date string (YYYY-MM-DD)
  date: z
    .string({ required_error: 'date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),

  taskTitle: z
    .string({ required_error: 'taskTitle is required' })
    .min(3,  'Task title must be at least 3 characters')
    .max(200, 'Task title must be at most 200 characters')
    .trim(),

  taskDesc: z
    .string({ required_error: 'taskDesc is required' })
    .min(10, 'Task description must be at least 10 characters')
    .trim(),

  hoursWorked: z
    .preprocess(
      val => (typeof val === 'string' ? parseFloat(val) : val),
      z
        .number({ invalid_type_error: 'hoursWorked must be a number' })
        .positive('hoursWorked must be greater than 0')
        .max(24, 'hoursWorked cannot exceed 24')
        .multipleOf(0.25, 'hoursWorked must be in 0.25-hour increments'), // e.g. 1.0, 1.25, 1.5
    ),

  learning: z
    .string({ required_error: 'learning is required' })
    .min(10, 'Learning outcome must be at least 10 characters')
    .trim(),

  challenges: z
    .string({ required_error: 'challenges is required' })
    .min(5, 'Challenges field must be at least 5 characters')
    .trim(),
});

// ── Edit a report (all fields optional — only pre-review edits allowed) ───────

export const editReportSchema = z
  .object({
    taskTitle:   z.string().min(3).max(200).trim().optional(),
    taskDesc:    z.string().min(10).trim().optional(),
    hoursWorked: z
      .preprocess(
        val => (typeof val === 'string' ? parseFloat(val) : val),
        z.number().positive().max(24).multipleOf(0.25),
      )
      .optional(),
    learning:   z.string().min(10).trim().optional(),
    challenges: z.string().min(5).trim().optional(),
  })
  .refine(obj => Object.values(obj).some(v => v !== undefined), {
    message: 'At least one field must be provided for update',
  });

// ── Mentor review (approve / reject with optional comment) ────────────────────

export const reviewReportSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    required_error: 'action is required',
    invalid_type_error: "action must be 'approve' or 'reject'",
  }),
  mentorComment: z
    .string()
    .max(1000, 'Mentor comment must be at most 1000 characters')
    .trim()
    .optional(),
});

// ── Paginated list query — shared by intern-self and mentor ───────────────────

export const reportListQuerySchema = z
  .object({
    page:   z.coerce.number().int().positive().default(1),
    limit:  z.coerce.number().int().positive().max(100).default(20),
    status: z.nativeEnum(ReportStatus).optional(),
    month:  z.coerce.number().int().min(1).max(12).optional(),
    year:   z.coerce.number().int().min(2020).max(2100).optional(),
  })
  .refine(
    ({ month, year }) => (month === undefined) === (year === undefined),
    { message: 'Both month and year must be provided together, or neither', path: ['month'] },
  );

// ── Admin query — all reports, fully filterable ───────────────────────────────

export const adminReportQuerySchema = z
  .object({
    page:     z.coerce.number().int().positive().default(1),
    limit:    z.coerce.number().int().positive().max(100).default(20),
    internId: z.string().optional(),
    mentorId: z.string().optional(),
    status:   z.nativeEnum(ReportStatus).optional(),
    from:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for 'from'").optional(),
    to:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for 'to'").optional(),
  })
  .refine(
    ({ from, to }) => {
      if (from && to) return new Date(from) <= new Date(to);
      return true;
    },
    { message: "'from' must be before or equal to 'to'", path: ['from'] },
  );

// ── Route params ──────────────────────────────────────────────────────────────

export const reportIdParamSchema = z.object({
  reportId: z.string().min(1, 'reportId is required'),
});

export const internUserIdParamSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type SubmitReportInput  = z.infer<typeof submitReportSchema>;
export type EditReportInput    = z.infer<typeof editReportSchema>;
export type ReviewReportInput  = z.infer<typeof reviewReportSchema>;
export type ReportListQuery    = z.infer<typeof reportListQuerySchema>;
export type AdminReportQuery   = z.infer<typeof adminReportQuerySchema>;
