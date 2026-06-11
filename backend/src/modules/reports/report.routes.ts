// =============================================================================
// File: backend/src/modules/reports/report.routes.ts
// Purpose: Express router for all /api/v1/reports endpoints
//
// ROUTE ORDER (critical — static paths must precede dynamic /:param paths):
//   INTERN routes:
//     POST   /              submit new report (multipart)
//     GET    /my            own report list
//     GET    /:reportId     own single report  ← dynamic, comes after all statics
//     PATCH  /:reportId     edit own report    ← dynamic
//     DELETE /:reportId/attachment
//
//   MENTOR routes:
//     GET    /mentor/pending          review queue
//     GET    /mentor/:reportId        single report (mentor view)
//     POST   /:reportId/review        approve/reject
//     GET    /intern/:userId          intern's reports
//
//   ADMIN routes:
//     GET    /                        all reports, filterable
//
// Multer middleware sits BEFORE Zod validate for multipart routes so that
// req.body is populated from form fields before schema validation runs.
// =============================================================================

import { Router } from 'express';
import { authenticate }           from '../../middleware/auth.middleware';
import {
  adminOnly,
  mentorOnly,
  internOnly,
  adminOrMentor,
}                                 from '../../middleware/rbac.middleware';
import { validate }               from '../../middleware/validate.middleware';
import { uploadReportAttachment } from '../../middleware/upload.middleware';
import {
  submitReportSchema,
  editReportSchema,
  reviewReportSchema,
  reportListQuerySchema,
  adminReportQuerySchema,
}                                 from './report.schema';
import * as ReportController      from './report.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// INTERN-ONLY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/v1/reports
 * @access INTERN
 * @type   multipart/form-data
 * @fields date, taskTitle, taskDesc, hoursWorked, learning, challenges, attachment?
 * @desc   Submit a new daily report. One report per day (UTC). Attachment optional.
 *         ⚠️ Soft-warns if report hours exceed attendance hours — never blocks.
 */
router.post(
  '/',
  authenticate,
  internOnly,
  uploadReportAttachment,           // multer parses multipart → sets req.file + req.body
  validate(submitReportSchema, 'body'),
  ReportController.submitReport,
);

/**
 * @route  GET /api/v1/reports/my
 * @access INTERN
 * @query  page, limit, status?, month?, year?
 * @desc   Paginated list of the intern's own reports.
 */
router.get(
  '/my',
  authenticate,
  internOnly,
  validate(reportListQuerySchema, 'query'),
  ReportController.getMyReports,
);

/**
 * @route  PATCH /api/v1/reports/:reportId
 * @access INTERN
 * @type   multipart/form-data
 * @desc   Edit own report. Blocked once mentor reviews (status != PENDING).
 */
router.patch(
  '/:reportId',
  authenticate,
  internOnly,
  uploadReportAttachment,
  validate(editReportSchema, 'body'),
  ReportController.editReport,
);

/**
 * @route  DELETE /api/v1/reports/:reportId/attachment
 * @access INTERN
 * @desc   Remove the uploaded attachment from a PENDING report.
 */
router.delete(
  '/:reportId/attachment',
  authenticate,
  internOnly,
  ReportController.deleteAttachment,
);

/**
 * @route  GET /api/v1/reports/:reportId
 * @access INTERN
 * @desc   Get a single report belonging to the authenticated intern.
 *         NOTE: placed after /my to avoid route shadowing.
 */
router.get(
  '/:reportId',
  authenticate,
  internOnly,
  ReportController.getMyReport,
);

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR-ONLY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/reports/mentor/pending
 * @access MENTOR
 * @query  page, limit, month?, year?
 * @desc   Review queue — all PENDING reports from mentor's assigned interns.
 *         Pass ?status=APPROVED|REJECTED to see previously reviewed reports.
 */
router.get(
  '/mentor/pending',
  authenticate,
  mentorOnly,
  validate(reportListQuerySchema, 'query'),
  ReportController.getMentorPendingReports,
);

/**
 * @route  GET /api/v1/reports/mentor/:reportId
 * @access MENTOR
 * @desc   View a specific report. Enforces intern-mentor assignment check.
 */
router.get(
  '/mentor/:reportId',
  authenticate,
  mentorOnly,
  ReportController.getMentorReport,
);

/**
 * @route  POST /api/v1/reports/:reportId/review
 * @access MENTOR
 * @body   { action: 'approve' | 'reject', mentorComment?: string }
 * @desc   Approve or reject a pending report. Enforces intern-mentor assignment.
 */
router.post(
  '/:reportId/review',
  authenticate,
  mentorOnly,
  validate(reviewReportSchema, 'body'),
  ReportController.reviewReport,
);

/**
 * @route  GET /api/v1/reports/intern/:userId
 * @access MENTOR (own interns) | ADMIN (any intern)
 * @query  page, limit, status?, month?, year?
 * @desc   View all reports for a specific intern.
 *         MENTOR: restricted to assigned interns. ADMIN: unrestricted.
 */
router.get(
  '/intern/:userId',
  authenticate,
  adminOrMentor,
  validate(reportListQuerySchema, 'query'),
  ReportController.getMentorInternReports,
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/reports
 * @access ADMIN
 * @query  internId?, mentorId?, status?, from? (YYYY-MM-DD), to? (YYYY-MM-DD), page, limit
 * @desc   All reports with full filtering. internId and mentorId are User IDs.
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  validate(adminReportQuerySchema, 'query'),
  ReportController.getAllReports,
);

export default router;
