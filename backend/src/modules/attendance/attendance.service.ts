// =============================================================================
// File: backend/src/modules/attendance/attendance.service.ts
// Purpose: All attendance business logic — check-in/out, summaries, reports
// Dependencies: prisma, app-error, pagination.util, attendance.schema types
//
// KEY DESIGN NOTES:
//   • internId in the Attendance table references InternProfile.id (NOT User.id)
//   • userId (from req.user.id) must be translated to internProfile.id internally
//   • Attendance status: PRESENT if ≥4h worked, HALF_DAY if 2–3.99h, PRESENT otherwise
//   • Unique constraint @@unique([internId, date]) prevents duplicate check-ins
// =============================================================================

import { Prisma, AttendanceStatus, InternStatus, Role } from '@prisma/client';
import { prisma }                   from '../../config/database';
import { AppError }                 from '../../utils/app-error';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { createNotification } from '../notifications/notification.service';
import type {
  AttendanceHistoryQuery,
  AdminAttendanceQuery,
} from './attendance.schema';

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a Date object at midnight UTC for the current UTC calendar date.
 *
 * WHY UTC, NOT LOCAL:
 *   MySQL's @db.Date column stores DATE values (e.g. '2026-06-11').
 *   When Prisma writes a JS Date to a DATE column it uses the UTC date part.
 *   When Prisma reads a DATE column back it returns <date>T00:00:00.000Z (UTC midnight).
 *   MySQL then compares DATE equality by expanding stored DATE to midnight UTC.
 *
 *   If we used local-timezone midnight (e.g. IST = UTC+5:30), the stored Date
 *   object is 2026-06-10T18:30:00Z, Prisma stores DATE '2026-06-10', but the
 *   WHERE clause sends DateTime '2026-06-10 18:30:00' which MySQL compares as
 *   '2026-06-10 00:00:00 ≠ 2026-06-10 18:30:00' → no match.
 *
 *   Using Date.UTC() ensures:
 *     create  → date = 2026-06-11T00:00:00.000Z → MySQL stores '2026-06-11'
 *     findUnique → date = 2026-06-11T00:00:00.000Z → MySQL: '2026-06-11 00:00:00 = 2026-06-11 00:00:00' ✓
 */
function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Safely converts a Prisma Decimal (possibly null) to a JS number rounded to
 * 2 decimal places. Uses String() to avoid dependency on decimal.js internals.
 */
function decimalToNumber(decimal: Prisma.Decimal | null): number {
  if (!decimal) return 0;
  return Math.round(parseFloat(String(decimal)) * 100) / 100;
}

/**
 * Calculates hours worked between two timestamps, rounded to 2 decimal places.
 */
function calcHoursWorked(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round((ms / (1_000 * 60 * 60)) * 100) / 100;
}

/**
 * Determines attendance status from hours worked.
 * ≥4h → PRESENT | 2–3.99h → HALF_DAY | <2h → HALF_DAY (still counted)
 */
function resolveStatus(hoursWorked: number): AttendanceStatus {
  return hoursWorked >= 4 ? AttendanceStatus.PRESENT : AttendanceStatus.HALF_DAY;
}

/**
 * Fetches an InternProfile by the owning User's ID.
 * Optionally enforces that the internship must be ACTIVE.
 *
 * @throws AppError.notFound  – no intern profile linked to this user
 * @throws AppError.forbidden – internship is not in ACTIVE status
 */
async function getProfileByUserId(userId: string, requireActive = false) {
  const profile = await prisma.internProfile.findUnique({
    where:  { userId },
    select: { id: true, status: true, requiredHrs: true, mentorId: true },
  });

  if (!profile) {
    throw AppError.notFound(
      'Intern profile not found. Complete your profile setup or contact the administrator.',
    );
  }

  if (requireActive && profile.status !== InternStatus.ACTIVE) {
    const msg: Record<string, string> = {
      PENDING:    'Your internship has not started yet. The administrator must activate your account first.',
      COMPLETED:  'Your internship is completed. Attendance records are now read-only.',
      TERMINATED: 'Your internship has been terminated. Please contact the administrator.',
    };
    throw AppError.forbidden(msg[profile.status] ?? 'Internship is not active.');
  }

  return profile;
}

/**
 * Fetches an InternProfile by the target intern's User ID and enforces
 * role-scoped access control:
 *   ADMIN  → any intern
 *   MENTOR → only interns where internProfile.mentorId === requesterId
 *
 * @throws AppError.notFound  – intern not found
 * @throws AppError.forbidden – mentor does not own this intern
 */
async function getProfileWithAccess(
  internUserId: string,
  requesterId:  string,
  requesterRole: Role,
) {
  const profile = await prisma.internProfile.findFirst({
    where:  { userId: internUserId },
    select: {
      id:          true,
      status:      true,
      requiredHrs: true,
      mentorId:    true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!profile) throw AppError.notFound('Intern not found.');

  if (requesterRole === Role.MENTOR && profile.mentorId !== requesterId) {
    throw AppError.forbidden('This intern is not assigned to you.');
  }

  return profile;
}

/**
 * Builds a reusable attendance summary object from raw Prisma records.
 * Used by both getMySummary and getInternSummary.
 */
function buildSummary(
  records: Array<{
    status:      AttendanceStatus;
    hoursWorked: Prisma.Decimal | null;
    checkIn:     Date;
    checkOut:    Date | null;
  }>,
  requiredHrs: number,
  todayRecord: { checkIn: Date; checkOut: Date | null } | null,
) {
  const presentDays       = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
  const halfDays          = records.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
  const totalDays         = records.length;
  const totalHoursWorked  = Math.round(
    records.reduce((sum, r) => sum + decimalToNumber(r.hoursWorked), 0) * 100,
  ) / 100;
  const completedHours   = totalHoursWorked;
  const remainingHours   = Math.max(0, Math.round((requiredHrs - completedHours) * 100) / 100);

  // Weighted percentage: full-day = 1, half-day = 0.5
  const attendancePercentage =
    totalDays > 0
      ? Math.round(((presentDays + halfDays * 0.5) / totalDays) * 10_000) / 100
      : 0;

  const currentlyCheckedIn = !!(todayRecord?.checkIn && !todayRecord.checkOut);

  return {
    totalDays,
    presentDays,
    halfDays,
    totalHoursWorked: completedHours,
    requiredHours:    requiredHrs,
    completedHours,
    remainingHours,
    attendancePercentage,
    currentlyCheckedIn,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── INTERN: Check-In ─────────────────────────────────────────────────────────

/**
 * Records a check-in for the current intern.
 *
 * Guards:
 *   • Internship must be ACTIVE
 *   • No duplicate check-in for the same calendar day
 */
export async function checkIn(userId: string) {
  const profile = await getProfileByUserId(userId, true);
  const today   = getTodayDate();

  const existing = await prisma.attendance.findUnique({
    where: { unique_intern_date: { internId: profile.id, date: today } },
    select: { id: true, checkOut: true },
  });

  if (existing) {
    throw AppError.conflict(
      existing.checkOut
        ? 'Attendance already completed for today.'
        : 'You are already checked in. Please check out before checking in again.',
    );
  }

  return prisma.attendance.create({
    data: {
      internId: profile.id,
      date:     today,
      checkIn:  new Date(),
      status:   AttendanceStatus.PRESENT,
    },
  });
}

// ── INTERN: Check-Out ────────────────────────────────────────────────────────

/**
 * Records a check-out for the current intern.
 * Automatically calculates hoursWorked and resolves the attendance status.
 *
 * Guards:
 *   • Internship must be ACTIVE
 *   • Must have checked in today first
 *   • Cannot check out twice
 */
export async function checkOut(userId: string) {
  const profile = await getProfileByUserId(userId, true);
  const today   = getTodayDate();

  const existing = await prisma.attendance.findUnique({
    where:  { unique_intern_date: { internId: profile.id, date: today } },
  });

  if (!existing) {
    throw AppError.badRequest('You have not checked in today. Please check in first.');
  }

  if (existing.checkOut) {
    throw AppError.conflict('Attendance already completed for today.');
  }

  const now          = new Date();
  const hoursWorked  = calcHoursWorked(existing.checkIn, now);
  const status       = resolveStatus(hoursWorked);

  const updated = await prisma.attendance.update({
    where: { id: existing.id },
    data:  { checkOut: now, hoursWorked, status },
  });

  const decimalHours = decimalToNumber(updated.hoursWorked);
  if (decimalHours > 5) {
    // 1. Intern Notification
    await createNotification(
      userId,
      'Attendance Warning',
      'You exceeded the recommended daily attendance duration of 5 hours.',
      'ATTENDANCE_REMINDER'
    ).catch(() => {});

    // 2. Mentor Notification
    if (profile.mentorId) {
      await createNotification(
        profile.mentorId,
        'Intern Attendance Warning',
        'Assigned intern exceeded the recommended daily attendance duration of 5 hours.',
        'ATTENDANCE_REMINDER'
      ).catch(() => {});
    }
  }

  return updated;
}

// ── INTERN: Today's Record ───────────────────────────────────────────────────

/**
 * Returns today's attendance record for the current intern, or null if
 * no check-in has been recorded yet.
 */
export async function getTodayAttendance(userId: string) {
  const profile = await getProfileByUserId(userId);
  const today   = getTodayDate();

  return prisma.attendance.findUnique({
    where: { unique_intern_date: { internId: profile.id, date: today } },
  });
}

// ── INTERN: Paginated History ─────────────────────────────────────────────────

/**
 * Returns the intern's own paginated attendance history.
 * Optionally filtered by month and year (both required together if used).
 */
export async function getMyHistory(userId: string, query: AttendanceHistoryQuery) {
  const profile              = await getProfileByUserId(userId);
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  const where: Prisma.AttendanceWhereInput = { internId: profile.id };

  if (query.month !== undefined && query.year !== undefined) {
    // Date.UTC() ensures range bounds are UTC midnight, matching how MySQL DATE
    // values are stored and compared. Date.UTC(y, m, 0) = last day of month m-1.
    where.date = {
      gte: new Date(Date.UTC(query.year, query.month - 1, 1)),
      lte: new Date(Date.UTC(query.year, query.month,     0)), // last day of month
    };
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.attendance.count({ where }),
  ]);

  return { records, pagination: buildPaginationMeta(page, limit, total) };
}

// ── INTERN: Overall Summary + Attendance Percentage ──────────────────────────

/**
 * Returns aggregate attendance stats for the current intern:
 * total days, present/half-day counts, total hours, remaining hours,
 * weighted attendance percentage, and live check-in status.
 */
export async function getMySummary(userId: string) {
  const profile = await getProfileByUserId(userId);
  const today   = getTodayDate();

  const [records, todayRecord] = await Promise.all([
    prisma.attendance.findMany({
      where:  { internId: profile.id },
      select: { status: true, hoursWorked: true, checkIn: true, checkOut: true },
    }),
    prisma.attendance.findUnique({
      where:  { unique_intern_date: { internId: profile.id, date: today } },
      select: { checkIn: true, checkOut: true },
    }),
  ]);

  return {
    ...buildSummary(records, profile.requiredHrs, todayRecord),
    todayRecord,
  };
}

// ── INTERN: Monthly Report ────────────────────────────────────────────────────

/**
 * Returns a detailed monthly attendance report for the current intern,
 * including per-day records and aggregated totals for the specified month.
 */
export async function getMyMonthlyReport(userId: string, month: number, year: number) {
  const profile = await getProfileByUserId(userId);

  // Date.UTC() keeps bounds at UTC midnight — must match how @db.Date is stored.
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate   = new Date(Date.UTC(year, month,     0)); // 0th day of next month = last day of this month

  const records = await prisma.attendance.findMany({
    where:   { internId: profile.id, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' },
  });

  const presentDays      = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
  const halfDays         = records.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
  const totalHoursWorked = Math.round(
    records.reduce((sum, r) => sum + decimalToNumber(r.hoursWorked), 0) * 100,
  ) / 100;

  return {
    month,
    year,
    totalDays: records.length,
    presentDays,
    halfDays,
    totalHoursWorked,
    records,
  };
}

// ── MENTOR + ADMIN: Specific Intern's History ─────────────────────────────────

/**
 * Returns a specific intern's paginated attendance history.
 *   ADMIN  → can view any intern
 *   MENTOR → can only view their assigned interns
 */
export async function getInternHistory(
  internUserId:  string,
  requesterId:   string,
  requesterRole: Role,
  query:         AttendanceHistoryQuery,
) {
  const profile              = await getProfileWithAccess(internUserId, requesterId, requesterRole);
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  const where: Prisma.AttendanceWhereInput = { internId: profile.id };

  if (query.month !== undefined && query.year !== undefined) {
    where.date = {
      gte: new Date(Date.UTC(query.year, query.month - 1, 1)),
      lte: new Date(Date.UTC(query.year, query.month,     0)),
    };
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.attendance.count({ where }),
  ]);

  return {
    intern:     { ...profile.user, internStatus: profile.status },
    records,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

// ── MENTOR + ADMIN: Specific Intern's Summary ────────────────────────────────

/**
 * Returns aggregate attendance stats for a specific intern.
 *   ADMIN  → unrestricted
 *   MENTOR → restricted to their assigned interns
 */
export async function getInternSummary(
  internUserId:  string,
  requesterId:   string,
  requesterRole: Role,
) {
  const profile = await getProfileWithAccess(internUserId, requesterId, requesterRole);
  const today   = getTodayDate();

  const [records, todayRecord] = await Promise.all([
    prisma.attendance.findMany({
      where:  { internId: profile.id },
      select: { status: true, hoursWorked: true, checkIn: true, checkOut: true },
    }),
    prisma.attendance.findUnique({
      where:  { unique_intern_date: { internId: profile.id, date: today } },
      select: { checkIn: true, checkOut: true },
    }),
  ]);

  return {
    intern:      { ...profile.user, internStatus: profile.status },
    summary:     buildSummary(records, profile.requiredHrs, todayRecord),
    todayRecord,
  };
}

// ── ADMIN: All Records (filterable) ──────────────────────────────────────────

/**
 * Returns all attendance records across all interns.
 * Supports filtering by: internId (User ID), date range, status.
 * Each record includes embedded intern + user display name.
 *
 * NOTE: internId filter uses the intern's User ID (not InternProfile ID)
 * because that is how the admin identifies users.
 */
export async function getAllAttendance(query: AdminAttendanceQuery) {
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  const where: Prisma.AttendanceWhereInput = {};

  // Translate intern User ID → InternProfile ID for the WHERE clause
  if (query.internId) {
    const internProfile = await prisma.internProfile.findFirst({
      where:  { userId: query.internId },
      select: { id: true },
    });
    if (!internProfile) {
      // Intern not found — return empty result set gracefully
      return { records: [], pagination: buildPaginationMeta(page, limit, 0) };
    }
    where.internId = internProfile.id;
  }

  if (query.from ?? query.to) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (query.from) dateFilter.gte = new Date(query.from);
    if (query.to)   dateFilter.lte = new Date(query.to);
    where.date = dateFilter;
  }

  if (query.status) {
    where.status = query.status;
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { date: 'desc' },
      include: {
        intern: {
          select: {
            userId: true,
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return { records, pagination: buildPaginationMeta(page, limit, total) };
}

// ── MENTOR: Edit Attendance Record ──────────────────────────────────────────

export async function editAttendance(
  recordId: string,
  requesterId: string,
  requesterRole: Role,
  payload: {
    checkIn?: string;
    checkOut?: string | null;
    correctionReason: string;
  }
) {
  const record = await prisma.attendance.findUnique({
    where: { id: recordId },
    include: {
      intern: true,
    },
  });

  if (!record) {
    throw AppError.notFound('Attendance record not found.');
  }

  if (requesterRole === Role.MENTOR && record.intern.mentorId !== requesterId) {
    throw AppError.forbidden('This intern is not assigned to you.');
  }

  const updates: any = {
    correctionReason: payload.correctionReason,
  };

  const newCheckIn = payload.checkIn ? new Date(payload.checkIn) : record.checkIn;
  const newCheckOut = payload.checkOut === null ? null : payload.checkOut ? new Date(payload.checkOut) : record.checkOut;

  updates.checkIn = newCheckIn;
  updates.checkOut = newCheckOut;

  if (newCheckIn && newCheckOut) {
    updates.hoursWorked = calcHoursWorked(newCheckIn, newCheckOut);
    updates.status = resolveStatus(updates.hoursWorked);
  } else {
    updates.hoursWorked = null;
    updates.status = AttendanceStatus.PRESENT;
  }

  const updated = await prisma.attendance.update({
    where: { id: recordId },
    data: updates,
  });

  const formattedDate = record.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  await createNotification(
    record.intern.userId,
    'Attendance Record Updated',
    `Your attendance for ${formattedDate} has been edited by your mentor. Reason: ${payload.correctionReason}`,
    'GENERAL'
  ).catch(() => {});

  return updated;
}

// ── MENTOR: Reopen Attendance Record ────────────────────────────────────────

export async function reopenAttendance(
  recordId: string,
  requesterId: string,
  requesterRole: Role
) {
  const record = await prisma.attendance.findUnique({
    where: { id: recordId },
    include: {
      intern: true,
    },
  });

  if (!record) {
    throw AppError.notFound('Attendance record not found.');
  }

  if (requesterRole === Role.MENTOR && record.intern.mentorId !== requesterId) {
    throw AppError.forbidden('This intern is not assigned to you.');
  }

  if (record.reopenCount >= 1) {
    throw AppError.badRequest('Maximum 1 reopen per attendance record.');
  }

  const updated = await prisma.attendance.update({
    where: { id: recordId },
    data: {
      checkOut: null,
      hoursWorked: null,
      status: AttendanceStatus.PRESENT,
      reopenCount: {
        increment: 1
      }
    },
  });

  const formattedDate = record.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  await createNotification(
    record.intern.userId,
    'Attendance Session Reopened',
    `Your attendance session for ${formattedDate} has been reopened. You may check out again.`,
    'ATTENDANCE_REMINDER'
  ).catch(() => {});

  return updated;
}
