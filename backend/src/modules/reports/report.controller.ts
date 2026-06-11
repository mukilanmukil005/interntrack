// =============================================================================
// File: backend/src/modules/reports/report.controller.ts
// Purpose: Thin Express route handlers — delegate to service, shape responses
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import * as ReportService                  from './report.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.util';
import type {
  SubmitReportInput,
  EditReportInput,
  ReviewReportInput,
  ReportListQuery,
  AdminReportQuery,
} from './report.schema';

// ── INTERN: Submit ────────────────────────────────────────────────────────────

/**
 * POST /api/v1/reports
 * Content-Type: multipart/form-data
 * Role: INTERN
 *
 * Body fields (text): date, taskTitle, taskDesc, hoursWorked, learning, challenges
 * Body file (optional): attachment (field name = 'attachment')
 */
export async function submitReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as SubmitReportInput;
    const file  = req.file as Express.Multer.File | undefined;

    const { report, warning } = await ReportService.submitReport(req.user!.id, input, file);

    const message = warning
      ? `Report submitted successfully. ⚠️ Warning: ${warning}`
      : 'Daily report submitted successfully';

    sendCreated(res, { report, warning: warning ?? null }, message);
  } catch (err) {
    next(err);
  }
}

// ── INTERN: Edit ──────────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/reports/:reportId
 * Content-Type: multipart/form-data
 * Role: INTERN
 * Restriction: Only PENDING reports can be edited
 */
export async function editReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { reportId } = req.params as { reportId: string };
    const input        = req.body as EditReportInput;
    const file         = req.file as Express.Multer.File | undefined;

    const { report, warning } = await ReportService.editReport(
      req.user!.id,
      reportId,
      input,
      file,
    );

    const message = warning
      ? `Report updated. ⚠️ Warning: ${warning}`
      : 'Report updated successfully';

    sendSuccess(res, { report, warning: warning ?? null }, message);
  } catch (err) {
    next(err);
  }
}

// ── INTERN: Delete attachment ─────────────────────────────────────────────────

/**
 * DELETE /api/v1/reports/:reportId/attachment
 * Role: INTERN
 */
export async function deleteAttachment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { reportId } = req.params as { reportId: string };
    await ReportService.deleteReportAttachment(req.user!.id, reportId);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

// ── INTERN: Get own report ────────────────────────────────────────────────────

/**
 * GET /api/v1/reports/:reportId
 * Role: INTERN
 */
export async function getMyReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { reportId } = req.params as { reportId: string };
    const report = await ReportService.getMyReport(req.user!.id, reportId);
    sendSuccess(res, report, 'Report retrieved');
  } catch (err) {
    next(err);
  }
}

// ── INTERN: List own reports ──────────────────────────────────────────────────

/**
 * GET /api/v1/reports/my?page=&limit=&status=&month=&year=
 * Role: INTERN
 */
export async function getMyReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query  = req.query as unknown as ReportListQuery;
    const result = await ReportService.getMyReports(req.user!.id, query);
    sendSuccess(res, result.records, 'Reports retrieved', 200, result.pagination);
  } catch (err) {
    next(err);
  }
}

// ── MENTOR: Review (approve / reject) ────────────────────────────────────────

/**
 * POST /api/v1/reports/:reportId/review
 * Role: MENTOR
 * Body: { action: 'approve' | 'reject', mentorComment?: string }
 */
export async function reviewReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { reportId } = req.params as { reportId: string };
    const input        = req.body as ReviewReportInput;

    const report = await ReportService.reviewReport(req.user!.id, reportId, input);

    const action = input.action === 'approve' ? 'approved' : 'rejected';
    sendSuccess(res, report, `Report ${action} successfully`);
  } catch (err) {
    next(err);
  }
}

// ── MENTOR: View specific intern's reports ────────────────────────────────────

/**
 * GET /api/v1/reports/intern/:userId?page=&limit=&status=&month=&year=
 * Role: MENTOR
 */
export async function getMentorInternReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };
    const query      = req.query as unknown as ReportListQuery;

    const result = await ReportService.getMentorInternReports(req.user!.id, userId, query);
    sendSuccess(res, result, 'Intern reports retrieved');
  } catch (err) {
    next(err);
  }
}

// ── MENTOR: View single report ────────────────────────────────────────────────

/**
 * GET /api/v1/reports/mentor/:reportId
 * Role: MENTOR
 */
export async function getMentorReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { reportId } = req.params as { reportId: string };
    const report = await ReportService.getMentorReport(req.user!.id, reportId);
    sendSuccess(res, report, 'Report retrieved');
  } catch (err) {
    next(err);
  }
}

// ── MENTOR: Pending reports queue ─────────────────────────────────────────────

/**
 * GET /api/v1/reports/mentor/pending?page=&limit=&month=&year=
 * Role: MENTOR
 * Returns all pending reports from assigned interns (review queue)
 */
export async function getMentorPendingReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query  = req.query as unknown as ReportListQuery;
    const result = await ReportService.getMentorPendingReports(req.user!.id, query);
    sendSuccess(res, result.records, 'Pending reports retrieved', 200, result.pagination);
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: All reports ────────────────────────────────────────────────────────

/**
 * GET /api/v1/reports?internId=&mentorId=&status=&from=&to=&page=&limit=
 * Role: ADMIN
 */
export async function getAllReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query  = req.query as unknown as AdminReportQuery;
    const result = await ReportService.getAllReports(query);
    sendSuccess(res, result.records, 'All reports retrieved', 200, result.pagination);
  } catch (err) {
    next(err);
  }
}
