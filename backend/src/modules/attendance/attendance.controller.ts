// =============================================================================
// File: backend/src/modules/attendance/attendance.controller.ts
// Purpose: Thin Express route handlers — delegate to service, handle errors
// Dependencies: attendance.service.ts, response.util.ts
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import * as AttendanceService               from './attendance.service';
import { sendSuccess, sendCreated }         from '../../utils/response.util';
import type {
  AttendanceHistoryQuery,
  AdminAttendanceQuery,
  MonthlyQuery,
} from './attendance.schema';

// ── INTERN: Check-In ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/attendance/checkin
 * Role: INTERN
 */
export async function checkIn(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await AttendanceService.checkIn(req.user!.id);
    sendCreated(res, record, `Check-in recorded at ${new Date(record.checkIn).toLocaleTimeString()}`);
  } catch (err) {
    next(err);
  }
}

// ── INTERN: Check-Out ────────────────────────────────────────────────────────

/**
 * POST /api/v1/attendance/checkout
 * Role: INTERN
 */
export async function checkOut(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await AttendanceService.checkOut(req.user!.id);
    const hours  = record.hoursWorked ? parseFloat(String(record.hoursWorked)) : 0;
    sendSuccess(
      res,
      record,
      `Check-out recorded. You worked ${hours.toFixed(2)} hours today (Status: ${record.status})`,
    );
  } catch (err) {
    next(err);
  }
}

// ── INTERN: Today's Attendance ───────────────────────────────────────────────

/**
 * GET /api/v1/attendance/today
 * Role: INTERN
 */
export async function getToday(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await AttendanceService.getTodayAttendance(req.user!.id);
    const message = record
      ? record.checkOut
        ? 'Attendance completed for today'
        : 'Currently checked in — don\'t forget to check out!'
      : 'No check-in recorded yet today';
    sendSuccess(res, record, message);
  } catch (err) {
    next(err);
  }
}

// ── INTERN: Paginated History ─────────────────────────────────────────────────

/**
 * GET /api/v1/attendance/my?page=&limit=&month=&year=
 * Role: INTERN
 */
export async function getMyHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query  = req.query as unknown as AttendanceHistoryQuery;
    const result = await AttendanceService.getMyHistory(req.user!.id, query);
    sendSuccess(res, result.records, 'Attendance history retrieved', 200, result.pagination);
  } catch (err) {
    next(err);
  }
}

// ── INTERN: Overall Summary ───────────────────────────────────────────────────

/**
 * GET /api/v1/attendance/my/summary
 * Role: INTERN
 */
export async function getMySummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await AttendanceService.getMySummary(req.user!.id);
    sendSuccess(res, summary, 'Attendance summary retrieved');
  } catch (err) {
    next(err);
  }
}

// ── INTERN: Monthly Report ────────────────────────────────────────────────────

/**
 * GET /api/v1/attendance/my/monthly?month=6&year=2026
 * Role: INTERN
 */
export async function getMyMonthly(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { month, year } = req.query as unknown as MonthlyQuery;
    const report = await AttendanceService.getMyMonthlyReport(
      req.user!.id,
      Number(month),
      Number(year),
    );
    sendSuccess(res, report, `Monthly report for ${month}/${year} retrieved`);
  } catch (err) {
    next(err);
  }
}

// ── MENTOR + ADMIN: Intern Attendance History ─────────────────────────────────

/**
 * GET /api/v1/attendance/intern/:userId?page=&limit=&month=&year=
 * Role: ADMIN | MENTOR
 */
export async function getInternHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };
    const result = await AttendanceService.getInternHistory(
      userId,
      req.user!.id,
      req.user!.role,
      req.query as unknown as AttendanceHistoryQuery,
    );
    sendSuccess(res, result, 'Intern attendance history retrieved');
  } catch (err) {
    next(err);
  }
}

// ── MENTOR + ADMIN: Intern Attendance Summary ─────────────────────────────────

/**
 * GET /api/v1/attendance/intern/:userId/summary
 * Role: ADMIN | MENTOR
 */
export async function getInternSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };
    const result = await AttendanceService.getInternSummary(
      userId,
      req.user!.id,
      req.user!.role,
    );
    sendSuccess(res, result, 'Intern attendance summary retrieved');
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: All Records ────────────────────────────────────────────────────────

/**
 * GET /api/v1/attendance?internId=&from=&to=&status=&page=&limit=
 * Role: ADMIN
 */
export async function getAllAttendance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await AttendanceService.getAllAttendance(
      req.query as unknown as AdminAttendanceQuery,
    );
    sendSuccess(res, result.records, 'Attendance records retrieved', 200, result.pagination);
  } catch (err) {
    next(err);
  }
}
