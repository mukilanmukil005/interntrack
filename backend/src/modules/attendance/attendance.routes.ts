// =============================================================================
// File: backend/src/modules/attendance/attendance.routes.ts
// Purpose: Express router for all /api/v1/attendance endpoints
//
// ROUTE ORDER (critical — static paths must precede dynamic /:param paths):
//   1. POST /checkin            – intern only
//   2. POST /checkout           – intern only
//   3. GET  /today              – intern only
//   4. GET  /my                 – intern only
//   5. GET  /my/summary         – intern only
//   6. GET  /my/monthly         – intern only
//   7. GET  /intern/:userId     – admin + mentor
//   8. GET  /intern/:userId/summary  – admin + mentor
//   9. GET  /                   – admin only (catch-all)
// =============================================================================

import { Router } from 'express';
import { authenticate }              from '../../middleware/auth.middleware';
import {
  adminOnly,
  internOnly,
  adminOrMentor,
}                                    from '../../middleware/rbac.middleware';
import { validate }                  from '../../middleware/validate.middleware';
import {
  attendanceHistoryQuerySchema,
  monthlyQuerySchema,
  adminAttendanceQuerySchema,
}                                    from './attendance.schema';
import * as AttendanceController     from './attendance.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// INTERN-ONLY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/v1/attendance/checkin
 * @access INTERN
 * @desc   Record today's check-in timestamp. Fails if already checked in.
 */
router.post(
  '/checkin',
  authenticate,
  internOnly,
  AttendanceController.checkIn,
);

/**
 * @route  POST /api/v1/attendance/checkout
 * @access INTERN
 * @desc   Record today's check-out. Calculates hoursWorked and sets status.
 */
router.post(
  '/checkout',
  authenticate,
  internOnly,
  AttendanceController.checkOut,
);

/**
 * @route  GET /api/v1/attendance/today
 * @access INTERN
 * @desc   Returns today's attendance record (or null if not checked in yet).
 */
router.get(
  '/today',
  authenticate,
  internOnly,
  AttendanceController.getToday,
);

/**
 * @route  GET /api/v1/attendance/my
 * @access INTERN
 * @query  page, limit, month?, year?  (month+year must both be provided or neither)
 * @desc   Paginated attendance history for the authenticated intern.
 */
router.get(
  '/my',
  authenticate,
  internOnly,
  validate(attendanceHistoryQuerySchema, 'query'),
  AttendanceController.getMyHistory,
);

/**
 * @route  GET /api/v1/attendance/my/summary
 * @access INTERN
 * @desc   Aggregate stats: totals, hours, attendance %, current check-in status.
 */
router.get(
  '/my/summary',
  authenticate,
  internOnly,
  AttendanceController.getMySummary,
);

/**
 * @route  GET /api/v1/attendance/my/monthly
 * @access INTERN
 * @query  month (1–12), year (2020–2100) — BOTH required
 * @desc   Full monthly report with per-day records and aggregated totals.
 */
router.get(
  '/my/monthly',
  authenticate,
  internOnly,
  validate(monthlyQuerySchema, 'query'),
  AttendanceController.getMyMonthly,
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN + MENTOR ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/attendance/intern/:userId
 * @access ADMIN | MENTOR
 * @param  userId — the intern's User ID (UUID)
 * @query  page, limit, month?, year?
 * @desc   ADMIN: view any intern. MENTOR: only their assigned interns.
 */
router.get(
  '/intern/:userId',
  authenticate,
  adminOrMentor,
  validate(attendanceHistoryQuerySchema, 'query'),
  AttendanceController.getInternHistory,
);

/**
 * @route  GET /api/v1/attendance/intern/:userId/summary
 * @access ADMIN | MENTOR
 * @param  userId — the intern's User ID (UUID)
 * @desc   Attendance summary stats for a specific intern.
 */
router.get(
  '/intern/:userId/summary',
  authenticate,
  adminOrMentor,
  AttendanceController.getInternSummary,
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/attendance
 * @access ADMIN
 * @query  internId?, from? (YYYY-MM-DD), to? (YYYY-MM-DD), status?, page, limit
 * @desc   All attendance records across all interns, fully filterable.
 *         internId is the intern's User ID (not InternProfile ID).
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  validate(adminAttendanceQuerySchema, 'query'),
  AttendanceController.getAllAttendance,
);

export default router;
