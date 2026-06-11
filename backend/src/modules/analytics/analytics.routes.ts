// =============================================================================
// File: backend/src/modules/analytics/analytics.routes.ts
// Purpose: Express router for all /api/v1/analytics endpoints
//
// ROUTE ORDER:
//   Static routes must precede parameter-based routes.
//
//   INTERN routes:
//     GET /intern/me
//
//   MENTOR routes:
//     GET /mentor/summary
//     GET /mentor/intervention
//     GET /mentor/intern/:internId
//
//   ADMIN routes:
//     GET /admin/overview
// =============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { adminOnly, mentorOnly, internOnly } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { internIdParamSchema } from './analytics.schema';
import * as analyticsController from './analytics.controller';

const router = Router();

// ── INTERN ROUTES ────────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/analytics/intern/me
 * @access INTERN
 * @desc   Get authenticated intern's personal progress analytics.
 */
router.get(
  '/intern/me',
  authenticate,
  internOnly,
  analyticsController.getInternSelfAnalytics,
);

// ── MENTOR ROUTES ────────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/analytics/mentor/summary
 * @access MENTOR
 * @desc   Get summary overview of all interns assigned to the authenticated mentor.
 */
router.get(
  '/mentor/summary',
  authenticate,
  mentorOnly,
  analyticsController.getMentorSummary,
);

/**
 * @route  GET /api/v1/analytics/mentor/intervention
 * @access MENTOR
 * @desc   List assigned interns flagged as requiring intervention (attendance or project delay).
 */
router.get(
  '/mentor/intervention',
  authenticate,
  mentorOnly,
  analyticsController.getMentorInterventionList,
);

/**
 * @route  GET /api/v1/analytics/mentor/intern/:internId
 * @access MENTOR
 * @desc   Get detailed progress tracking metrics for a specific assigned intern.
 *         Throws 403 if the intern is not assigned to the mentor.
 */
router.get(
  '/mentor/intern/:internId',
  authenticate,
  mentorOnly,
  validate(internIdParamSchema, 'params'),
  analyticsController.getMentorInternProgress,
);

// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/analytics/admin/overview
 * @access ADMIN
 * @desc   Get system-wide overview statistics (active counts, college stats, mentor performance, etc).
 */
router.get(
  '/admin/overview',
  authenticate,
  adminOnly,
  analyticsController.getAdminOverview,
);

export default router;
