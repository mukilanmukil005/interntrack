// =============================================================================
// File: backend/src/modules/analytics/analytics.controller.ts
// Purpose: Route handlers mapping incoming HTTP requests to the analytics service
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response.util';
import * as analyticsService from './analytics.service';

// ── INTERN: Get own progress analytics ────────────────────────────────────────

export async function getInternSelfAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getInternAnalytics(req.user!.id);
    sendSuccess(res, data, 'Personal progress analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// ── MENTOR: Get summary of all assigned interns ───────────────────────────────

export async function getMentorSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getMentorAnalyticsSummary(req.user!.id);
    sendSuccess(res, data, 'Assigned interns analytics summary retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// ── MENTOR: Get detailed progress of a specific assigned intern ───────────────

export async function getMentorInternProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const internId = req.params.internId as string;
    const data = await analyticsService.getMentorInternProgress(req.user!.id, internId);
    sendSuccess(res, data, 'Intern progress analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// ── MENTOR: Get intervention list of assigned interns ─────────────────────────

export async function getMentorInterventionList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getMentorInterventionList(req.user!.id);
    sendSuccess(res, data, 'Assigned interns requiring intervention retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// ── ADMIN: Get system-wide overview analytics ────────────────────────────────

export async function getAdminOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getAdminOverview();
    sendSuccess(res, data, 'System-wide analytics overview retrieved successfully');
  } catch (error) {
    next(error);
  }
}
