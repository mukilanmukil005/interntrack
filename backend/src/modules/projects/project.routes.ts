// =============================================================================
// File: backend/src/modules/projects/project.routes.ts
// Purpose: Express router for all /api/v1/projects endpoints
//
// ROUTE ORDER (critical — static paths must precede dynamic /:projectId paths):
//   INTERN routes:
//     GET    /my                              Get own assigned project
//     PATCH  /my/milestones/:milestoneId/progress  Update milestone progress %
//     POST   /my/files/:projectId             Upload file (multipart)
//     DELETE /my/files/:projectId/:fileId     Delete file
//
//   MENTOR routes:
//     GET    /mentor/interns                  Get projects of assigned interns
//     PATCH  /:projectId/milestones/:milestoneId/review Mentor review milestone
//
//   ADMIN routes:
//     POST   /                                Create project
//     GET    /                                Get all projects (paginated)
//     PATCH  /:projectId                      Edit project metadata
//     POST   /:projectId/milestones           Create milestone
//     PATCH  /:projectId/milestones/:milestoneId Edit milestone
//     DELETE /:projectId/milestones/:milestoneId Delete milestone
//
//   SHARED (ADMIN, MENTOR, INTERN) routes:
//     GET    /:projectId                      Get project detail by ID
// =============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  adminOnly,
  mentorOnly,
  internOnly,
} from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadProjectFile as uploadProjectFileMiddleware } from '../../middleware/upload.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  updateMilestoneProgressSchema,
  reviewMilestoneSchema,
  projectQuerySchema,
  projectIdParamSchema,
  milestoneIdParamSchema,
  fileIdParamSchema,
  projectMilestoneParamSchema,
} from './project.schema';
import * as projectController from './project.controller';

const router = Router();

// ── INTERN-ONLY ROUTES ───────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/projects/my
 * @access INTERN
 * @desc   View assigned project with milestones, files, and completion percentage.
 */
router.get(
  '/my',
  authenticate,
  internOnly,
  projectController.getMyProject,
);

/**
 * @route  PATCH /api/v1/projects/my/milestones/:milestoneId/progress
 * @access INTERN
 * @desc   Update milestone completion percentage. Status transitions automatically.
 *         COMPLETED milestones are locked.
 */
router.patch(
  '/my/milestones/:milestoneId/progress',
  authenticate,
  internOnly,
  validate(milestoneIdParamSchema, 'params'),
  validate(updateMilestoneProgressSchema, 'body'),
  projectController.updateMilestoneProgress,
);

/**
 * @route  POST /api/v1/projects/my/files/:projectId
 * @access INTERN
 * @type   multipart/form-data
 * @desc   Upload project-related files (PDF, DOCX, images up to 10MB).
 */
router.post(
  '/my/files/:projectId',
  authenticate,
  internOnly,
  validate(projectIdParamSchema, 'params'),
  uploadProjectFileMiddleware,
  projectController.uploadProjectFile,
);

/**
 * @route  DELETE /api/v1/projects/my/files/:projectId/:fileId
 * @access INTERN
 * @desc   Delete an uploaded project file. Removes from database and local disk.
 */
router.delete(
  '/my/files/:projectId/:fileId',
  authenticate,
  internOnly,
  validate(projectIdParamSchema, 'params'),
  validate(fileIdParamSchema, 'params'),
  projectController.deleteProjectFile,
);

// ── MENTOR-ONLY ROUTES ───────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/projects/mentor/interns
 * @access MENTOR
 * @desc   View projects of assigned interns only (paginated, filterable).
 */
router.get(
  '/mentor/interns',
  authenticate,
  mentorOnly,
  validate(projectQuerySchema, 'query'),
  projectController.getMentorInternProjects,
);

/**
 * @route  PATCH /api/v1/projects/:projectId/milestones/:milestoneId/review
 * @access MENTOR
 * @desc   Review milestone progress, add comments, approve completion.
 */
router.patch(
  '/:projectId/milestones/:milestoneId/review',
  authenticate,
  mentorOnly,
  validate(projectMilestoneParamSchema, 'params'),
  validate(reviewMilestoneSchema, 'body'),
  projectController.reviewMilestone,
);

// ── ADMIN-ONLY ROUTES ────────────────────────────────────────────────────────

/**
 * @route  POST /api/v1/projects
 * @access ADMIN
 * @desc   Create a project and assign it to an intern (prevents duplicate assignments).
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  validate(createProjectSchema, 'body'),
  projectController.createProject,
);

/**
 * @route  GET /api/v1/projects
 * @access ADMIN
 * @desc   View all projects in the system (paginated, filterable).
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  validate(projectQuerySchema, 'query'),
  projectController.getAllProjects,
);

/**
 * @route  PATCH /api/v1/projects/:projectId
 * @access ADMIN
 * @desc   Edit project metadata (e.g., domain, dates, assignment).
 */
router.patch(
  '/:projectId',
  authenticate,
  adminOnly,
  validate(projectIdParamSchema, 'params'),
  validate(updateProjectSchema, 'body'),
  projectController.updateProject,
);

/**
 * @route  POST /api/v1/projects/:projectId/milestones
 * @access ADMIN
 * @desc   Create a milestone for a project.
 */
router.post(
  '/:projectId/milestones',
  authenticate,
  adminOnly,
  validate(projectIdParamSchema, 'params'),
  validate(createMilestoneSchema, 'body'),
  projectController.createMilestone,
);

/**
 * @route  PATCH /api/v1/projects/:projectId/milestones/:milestoneId
 * @access ADMIN
 * @desc   Edit milestone details.
 */
router.patch(
  '/:projectId/milestones/:milestoneId',
  authenticate,
  adminOnly,
  validate(projectMilestoneParamSchema, 'params'),
  validate(updateMilestoneSchema, 'body'),
  projectController.updateMilestone,
);

/**
 * @route  DELETE /api/v1/projects/:projectId/milestones/:milestoneId
 * @access ADMIN
 * @desc   Delete a milestone from a project.
 */
router.delete(
  '/:projectId/milestones/:milestoneId',
  authenticate,
  adminOnly,
  validate(projectMilestoneParamSchema, 'params'),
  projectController.deleteMilestone,
);

// ── SHARED (ADMIN, MENTOR, INTERN) ROUTES ────────────────────────────────────

/**
 * @route  GET /api/v1/projects/:projectId
 * @access ADMIN | MENTOR (assigned) | INTERN (assigned)
 * @desc   Get project details. Enforces strict role-scoped access checks.
 */
router.get(
  '/:projectId',
  authenticate,
  validate(projectIdParamSchema, 'params'),
  projectController.getProjectById,
);

export default router;
