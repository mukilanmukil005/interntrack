// =============================================================================
// File: backend/src/modules/reports/report.service.ts
// Purpose: Daily report business logic — submit, edit, review, list
//
// KEY DESIGN NOTES:
//   • internId references InternProfile.id (NOT User.id) — same pattern as attendance
//   • Dates for @db.Date fields use Date.UTC() to avoid local-timezone midnight skew
//   • Soft validation: hours-vs-attendance warn, but never blocks submission
//   • Mentor authorization mirrors attendance: internProfile.mentorId === mentor's userId
//   • Edit is blocked once status is APPROVED or REJECTED (post-review lock)
//   • attachmentUrl is built from the uploaded file's path (relative to UPLOAD_PATH)
// =============================================================================

import path                              from 'path';
import fs                                from 'fs';
import { Prisma, ReportStatus, Role }    from '@prisma/client';
import { prisma }                        from '../../config/database';
import { AppError }                      from '../../utils/app-error';
import {
  parsePagination,
  buildPaginationMeta,
}                                        from '../../utils/pagination.util';
import type {
  SubmitReportInput,
  EditReportInput,
  ReviewReportInput,
  ReportListQuery,
  AdminReportQuery,
}                                        from './report.schema';

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a YYYY-MM-DD string into a UTC midnight Date object.
 * This matches how Prisma stores @db.Date columns (UTC midnight) and prevents
 * the local-timezone midnight skew that caused the Phase 4 /today bug.
 */
function parseReportDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const year  = Number(parts[0]);
  const month = Number(parts[1]);
  const day   = Number(parts[2]);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Returns today as a UTC midnight Date (used for soft-validation cross-checks).
 */
function getTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Builds an absolute URL path for an uploaded file.
 * Stored as a relative path so the app stays portable across environments.
 * e.g. "uploads/reports/1720001234567-123456789.pdf"
 */
function buildAttachmentUrl(file: Express.Multer.File): string {
  // Normalize to forward-slashes for URL compatibility
  return file.path.replace(/\\/g, '/');
}

/**
 * Safely deletes an uploaded file from disk (used when overwriting an attachment).
 * Never throws — errors are silently ignored to avoid blocking the main flow.
 */
function safeDeleteFile(filePath: string | null | undefined): void {
  if (!filePath) return;
  try {
    const absPath = path.resolve(filePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  } catch {
    // Non-critical — log in production; swallowed here intentionally
  }
}

/**
 * Fetches the intern's InternProfile by their User ID.
 * Throws 404 if no profile exists.
 */
async function getInternProfile(userId: string) {
  const profile = await prisma.internProfile.findUnique({
    where:  { userId },
    select: { id: true, mentorId: true, requiredHrs: true, status: true },
  });
  if (!profile) {
    throw AppError.notFound(
      'Intern profile not found. Complete your profile or contact the administrator.',
    );
  }
  return profile;
}

/**
 * Fetches an intern's InternProfile and enforces RBAC:
 *   ADMIN  → unrestricted access
 *   MENTOR → only interns where internProfile.mentorId === mentor's User.id
 */
async function getInternProfileWithAccess(
  internUserId:  string,
  requesterId:   string,
  requesterRole: Role,
) {
  const profile = await prisma.internProfile.findFirst({
    where:  { userId: internUserId },
    select: {
      id:       true,
      mentorId: true,
      status:   true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  if (!profile) throw AppError.notFound('Intern not found.');

  if (requesterRole === Role.MENTOR && profile.mentorId !== requesterId) {
    throw AppError.forbidden('This intern is not assigned to you.');
  }

  return profile;
}

/**
 * Soft-validates report hours against the intern's attendance hours for the
 * same date. Returns a warning string if hours exceed attendance, or null.
 * NEVER throws — caller decides whether to surface the warning.
 */
async function checkHoursWarning(
  internProfileId: string,
  dateUtc:         Date,
  reportHours:     number,
): Promise<string | null> {
  try {
    const attendance = await prisma.attendance.findUnique({
      where:  { unique_intern_date: { internId: internProfileId, date: dateUtc } },
      select: { hoursWorked: true },
    });

    if (!attendance?.hoursWorked) return null;

    const attendanceHours = parseFloat(String(attendance.hoursWorked));
    if (reportHours > attendanceHours) {
      return `Report hours (${reportHours}h) exceed attendance hours (${attendanceHours}h) for this date.`;
    }
    return null;
  } catch {
    return null; // Soft validation — never block on error
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── INTERN: Submit a new daily report ────────────────────────────────────────

/**
 * Creates a new daily report for the authenticated intern.
 *
 * Guards:
 *   • One report per intern per calendar day (UTC)
 *   • Report date cannot be in the future
 *   • Soft-warns if report hours > attendance hours (does NOT block)
 *
 * @returns { report, warning? }
 */
export async function submitReport(
  userId: string,
  input:  SubmitReportInput,
  file?:  Express.Multer.File,
) {
  const profile = await getInternProfile(userId);
  const dateUtc = parseReportDate(input.date);
  const today   = getTodayUtc();

  // Guard: no future-dated reports
  if (dateUtc > today) {
    // Clean up uploaded file if date is rejected
    safeDeleteFile(file?.path);
    throw AppError.badRequest('Report date cannot be in the future.');
  }

  // Guard: one report per day
  const existing = await prisma.dailyReport.findFirst({
    where: { internId: profile.id, date: dateUtc },
    select: { id: true },
  });
  if (existing) {
    safeDeleteFile(file?.path);
    throw AppError.conflict(
      `A report for ${input.date} already exists. You can only submit one report per day.`,
    );
  }

  // Soft validation: warn if hours exceed attendance
  const warning = await checkHoursWarning(profile.id, dateUtc, input.hoursWorked);

  const report = await prisma.dailyReport.create({
    data: {
      internId:      profile.id,
      date:          dateUtc,
      taskTitle:     input.taskTitle,
      taskDesc:      input.taskDesc,
      hoursWorked:   input.hoursWorked,
      learning:      input.learning,
      challenges:    input.challenges,
      attachmentUrl: file ? buildAttachmentUrl(file) : null,
      status:        ReportStatus.PENDING,
    },
  });

  return { report, warning };
}

// ── INTERN: Edit own report (pre-review only) ─────────────────────────────────

/**
 * Updates an existing report that the intern owns.
 *
 * Guards:
 *   • Report must belong to this intern
 *   • Report must still be PENDING (not yet reviewed)
 *   • If a new attachment is uploaded, the old one is deleted from disk
 */
export async function editReport(
  userId:   string,
  reportId: string,
  input:    EditReportInput,
  file?:    Express.Multer.File,
) {
  const profile = await getInternProfile(userId);

  const report = await prisma.dailyReport.findUnique({
    where:  { id: reportId },
    select: { id: true, internId: true, status: true, attachmentUrl: true, date: true, hoursWorked: true },
  });

  if (!report) throw AppError.notFound('Report not found.');

  // Ownership check
  if (report.internId !== profile.id) {
    safeDeleteFile(file?.path);
    throw AppError.forbidden('You can only edit your own reports.');
  }

  // Post-review lock
  if (report.status !== ReportStatus.PENDING) {
    safeDeleteFile(file?.path);
    throw AppError.forbidden(
      `Report has already been ${report.status.toLowerCase()} by your mentor. Editing is no longer allowed.`,
    );
  }

  // Soft validation if hours changed
  let warning: string | null = null;
  if (input.hoursWorked !== undefined) {
    warning = await checkHoursWarning(
      profile.id,
      report.date,
      input.hoursWorked,
    );
  }

  // If a new file is uploaded, delete the old one
  let newAttachmentUrl: string | undefined;
  if (file) {
    safeDeleteFile(report.attachmentUrl);
    newAttachmentUrl = buildAttachmentUrl(file);
  }

  const updated = await prisma.dailyReport.update({
    where: { id: reportId },
    data: {
      ...(input.taskTitle     !== undefined && { taskTitle:   input.taskTitle }),
      ...(input.taskDesc      !== undefined && { taskDesc:    input.taskDesc }),
      ...(input.hoursWorked   !== undefined && { hoursWorked: input.hoursWorked }),
      ...(input.learning      !== undefined && { learning:    input.learning }),
      ...(input.challenges    !== undefined && { challenges:  input.challenges }),
      ...(newAttachmentUrl    !== undefined && { attachmentUrl: newAttachmentUrl }),
    },
  });

  return { report: updated, warning };
}

// ── INTERN: Delete attachment from own report ─────────────────────────────────

/**
 * Removes the attachment from a report.
 * Only allowed while status is PENDING.
 */
export async function deleteReportAttachment(userId: string, reportId: string) {
  const profile = await getInternProfile(userId);

  const report = await prisma.dailyReport.findUnique({
    where:  { id: reportId },
    select: { id: true, internId: true, status: true, attachmentUrl: true },
  });

  if (!report)                          throw AppError.notFound('Report not found.');
  if (report.internId !== profile.id)   throw AppError.forbidden('You can only edit your own reports.');
  if (report.status !== ReportStatus.PENDING) {
    throw AppError.forbidden('Cannot remove attachment after mentor review.');
  }
  if (!report.attachmentUrl)            throw AppError.notFound('This report has no attachment.');

  safeDeleteFile(report.attachmentUrl);

  await prisma.dailyReport.update({
    where: { id: reportId },
    data:  { attachmentUrl: null },
  });
}

// ── INTERN: Get single report ─────────────────────────────────────────────────

export async function getMyReport(userId: string, reportId: string) {
  const profile = await getInternProfile(userId);

  const report = await prisma.dailyReport.findUnique({ where: { id: reportId } });

  if (!report)                        throw AppError.notFound('Report not found.');
  if (report.internId !== profile.id) throw AppError.forbidden('Access denied.');

  return report;
}

// ── INTERN: Paginated history of own reports ──────────────────────────────────

export async function getMyReports(userId: string, query: ReportListQuery) {
  const profile               = await getInternProfile(userId);
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  const where: Prisma.DailyReportWhereInput = { internId: profile.id };

  if (query.status) where.status = query.status;

  if (query.month !== undefined && query.year !== undefined) {
    where.date = {
      gte: new Date(Date.UTC(query.year, query.month - 1, 1)),
      lte: new Date(Date.UTC(query.year, query.month,     0)),
    };
  }

  const [records, total] = await Promise.all([
    prisma.dailyReport.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.dailyReport.count({ where }),
  ]);

  return { records, pagination: buildPaginationMeta(page, limit, total) };
}

// ── MENTOR: Review a report (approve / reject) ────────────────────────────────

/**
 * Mentor approves or rejects a report.
 *
 * Guards:
 *   • Report must exist
 *   • Report's intern must be assigned to this mentor
 *   • Report must currently be PENDING
 */
export async function reviewReport(
  mentorUserId: string,
  reportId:     string,
  input:        ReviewReportInput,
) {
  const report = await prisma.dailyReport.findUnique({
    where:   { id: reportId },
    include: { intern: { select: { mentorId: true } } },
  });

  if (!report) throw AppError.notFound('Report not found.');

  // Mentor authorization: intern's mentorId must match reviewer's userId
  if (report.intern.mentorId !== mentorUserId) {
    throw AppError.forbidden('This intern is not assigned to you.');
  }

  if (report.status !== ReportStatus.PENDING) {
    throw AppError.conflict(
      `Report has already been ${report.status.toLowerCase()}. It cannot be reviewed again.`,
    );
  }

  const newStatus = input.action === 'approve'
    ? ReportStatus.APPROVED
    : ReportStatus.REJECTED;

  return prisma.dailyReport.update({
    where: { id: reportId },
    data: {
      status:        newStatus,
      mentorComment: input.mentorComment ?? null,
      reviewedAt:    new Date(),
    },
  });
}

// ── MENTOR: View reports from assigned interns ────────────────────────────────

export async function getMentorInternReports(
  mentorUserId:  string,
  internUserId:  string,
  query:         ReportListQuery,
) {
  const profile               = await getInternProfileWithAccess(internUserId, mentorUserId, Role.MENTOR);
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  const where: Prisma.DailyReportWhereInput = { internId: profile.id };

  if (query.status) where.status = query.status;

  if (query.month !== undefined && query.year !== undefined) {
    where.date = {
      gte: new Date(Date.UTC(query.year, query.month - 1, 1)),
      lte: new Date(Date.UTC(query.year, query.month,     0)),
    };
  }

  const [records, total] = await Promise.all([
    prisma.dailyReport.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.dailyReport.count({ where }),
  ]);

  return {
    intern:     { ...profile.user, internStatus: profile.status },
    records,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

// ── MENTOR: View single report (must be assigned intern) ──────────────────────

export async function getMentorReport(mentorUserId: string, reportId: string) {
  const report = await prisma.dailyReport.findUnique({
    where:   { id: reportId },
    include: { intern: { select: { mentorId: true } } },
  });

  if (!report) throw AppError.notFound('Report not found.');

  if (report.intern.mentorId !== mentorUserId) {
    throw AppError.forbidden('This report does not belong to your assigned interns.');
  }

  return report;
}

// ── MENTOR: View all pending reports across assigned interns ──────────────────

export async function getMentorPendingReports(mentorUserId: string, query: ReportListQuery) {
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  // Find all interns assigned to this mentor
  const assignedInternIds = await prisma.internProfile.findMany({
    where:  { mentorId: mentorUserId },
    select: { id: true },
  });

  const internIds = assignedInternIds.map(p => p.id);
  if (internIds.length === 0) {
    return { records: [], pagination: buildPaginationMeta(page, limit, 0) };
  }

  const where: Prisma.DailyReportWhereInput = {
    internId: { in: internIds },
    status:   query.status ?? ReportStatus.PENDING,
  };

  if (query.month !== undefined && query.year !== undefined) {
    where.date = {
      gte: new Date(Date.UTC(query.year, query.month - 1, 1)),
      lte: new Date(Date.UTC(query.year, query.month,     0)),
    };
  }

  const [records, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { date: 'desc' },
      include: {
        intern: {
          select: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    prisma.dailyReport.count({ where }),
  ]);

  return { records, pagination: buildPaginationMeta(page, limit, total) };
}

// ── ADMIN: All reports (fully filterable) ─────────────────────────────────────

/**
 * Returns all reports across all interns.
 * Supports filtering by internId (User ID), mentorId (User ID), status, date range.
 *
 * NOTE: internId and mentorId filters use User IDs (admin-facing identifiers).
 * The service translates to InternProfile IDs internally.
 */
export async function getAllReports(query: AdminReportQuery) {
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  const where: Prisma.DailyReportWhereInput = {};

  // Translate intern User ID → InternProfile ID
  if (query.internId) {
    const profile = await prisma.internProfile.findFirst({
      where:  { userId: query.internId },
      select: { id: true },
    });
    if (!profile) {
      return { records: [], pagination: buildPaginationMeta(page, limit, 0) };
    }
    where.internId = profile.id;
  }

  // Translate mentor User ID → all their interns' InternProfile IDs
  if (query.mentorId) {
    const mentorInterns = await prisma.internProfile.findMany({
      where:  { mentorId: query.mentorId },
      select: { id: true },
    });
    const mentorInternIds = mentorInterns.map(p => p.id);
    if (mentorInternIds.length === 0) {
      return { records: [], pagination: buildPaginationMeta(page, limit, 0) };
    }
    // Merge with internId filter if both are provided
    where.internId = where.internId
      ? { in: [where.internId as string].filter(id => mentorInternIds.includes(id)) }
      : { in: mentorInternIds };
  }

  if (query.status) where.status = query.status;

  if (query.from ?? query.to) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    // ISO date strings (YYYY-MM-DD) are parsed as UTC midnight by Date constructor
    if (query.from) dateFilter.gte = new Date(query.from);
    if (query.to)   dateFilter.lte = new Date(query.to);
    where.date = dateFilter;
  }

  const [records, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { date: 'desc' },
      include: {
        intern: {
          select: {
            userId: true,
            user:   { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    prisma.dailyReport.count({ where }),
  ]);

  return { records, pagination: buildPaginationMeta(page, limit, total) };
}
