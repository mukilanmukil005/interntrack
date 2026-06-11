// =============================================================================
// File: backend/src/modules/projects/project.schema.ts
// Purpose: Zod validation schemas for all project and milestone endpoints
// =============================================================================

import { z } from 'zod';
import { ProjectStatus, MilestoneStatus } from '@prisma/client';

// ── Project Creation (Admin) ──────────────────────────────────────────────────

export const createProjectSchema = z.object({
  title: z
    .string({ required_error: 'title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),

  description: z
    .string({ required_error: 'description is required' })
    .min(10, 'Description must be at least 10 characters')
    .trim(),

  domain: z
    .string({ required_error: 'domain is required' })
    .min(2, 'Domain must be at least 2 characters')
    .max(200, 'Domain must be at most 200 characters')
    .trim(),

  startDate: z
    .string({ required_error: 'startDate is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format'),

  endDate: z
    .string({ required_error: 'endDate is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format'),

  internId: z
    .string({ required_error: 'internId is required' })
    .uuid('internId must be a valid UUID'),

  repoUrl: z
    .string()
    .url('repoUrl must be a valid URL')
    .max(500, 'repoUrl must be at most 500 characters')
    .trim()
    .nullable()
    .optional(),
});

// ── Project Editing (Admin) ────────────────────────────────────────────────────

export const updateProjectSchema = z
  .object({
    title: z.string().min(3).max(200).trim().optional(),
    description: z.string().min(10).trim().optional(),
    domain: z.string().min(2).max(200).trim().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format').optional(),
    internId: z.string().uuid('internId must be a valid UUID').optional(),
    repoUrl: z.string().url('repoUrl must be a valid URL').max(500).trim().nullable().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    mentorNotes: z.string().trim().nullable().optional(),
  })
  .refine(
    obj => Object.values(obj).some(v => v !== undefined),
    { message: 'At least one field must be provided for update' }
  );

// ── Milestone Creation (Admin) ────────────────────────────────────────────────

export const createMilestoneSchema = z.object({
  title: z
    .string({ required_error: 'title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),

  description: z
    .string()
    .trim()
    .nullable()
    .optional(),

  dueDate: z
    .string({ required_error: 'dueDate is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be in YYYY-MM-DD format'),
});

// ── Milestone Editing (Admin) ──────────────────────────────────────────────────

export const updateMilestoneSchema = z
  .object({
    title: z.string().min(3).max(200).trim().optional(),
    description: z.string().trim().nullable().optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be in YYYY-MM-DD format').optional(),
    status: z.nativeEnum(MilestoneStatus).optional(),
    completionPercentage: z
      .preprocess(
        val => (typeof val === 'string' ? parseInt(val, 10) : val),
        z.number().int().min(0).max(100)
      )
      .optional(),
    mentorFeedback: z.string().trim().nullable().optional(),
  })
  .refine(
    obj => Object.values(obj).some(v => v !== undefined),
    { message: 'At least one field must be provided for update' }
  );

// ── Milestone Progress Update (Intern) ──────────────────────────────────────────

export const updateMilestoneProgressSchema = z.object({
  completionPercentage: z
    .preprocess(
      val => (typeof val === 'string' ? parseInt(val, 10) : val),
      z
        .number({ required_error: 'completionPercentage is required' })
        .int()
        .min(0, 'Percentage cannot be less than 0')
        .max(100, 'Percentage cannot be greater than 100')
    ),
});

// ── Milestone Review (Mentor) ───────────────────────────────────────────────────

export const reviewMilestoneSchema = z.object({
  status: z.enum([MilestoneStatus.COMPLETED, MilestoneStatus.IN_PROGRESS], {
    required_error: 'status is required',
    invalid_type_error: 'status must be COMPLETED or IN_PROGRESS',
  }),
  mentorFeedback: z
    .string()
    .max(1000, 'Mentor feedback must be at most 1000 characters')
    .trim()
    .nullable()
    .optional(),
});

// ── Project Query Filter Schema (Admin & Mentor) ────────────────────────────────

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(ProjectStatus).optional(),
  domain: z.string().trim().optional(),
  internId: z.string().optional(),
});

// ── Route parameters ────────────────────────────────────────────────────────────

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid('projectId must be a valid UUID'),
});

export const milestoneIdParamSchema = z.object({
  milestoneId: z.string().uuid('milestoneId must be a valid UUID'),
});

export const fileIdParamSchema = z.object({
  fileId: z.string().uuid('fileId must be a valid UUID'),
});

// ── Inferred Types ──────────────────────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type UpdateMilestoneProgressInput = z.infer<typeof updateMilestoneProgressSchema>;
export type ReviewMilestoneInput = z.infer<typeof reviewMilestoneSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
