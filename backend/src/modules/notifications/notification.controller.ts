// =============================================================================
// File: backend/src/modules/notifications/notification.controller.ts
// Purpose: Thin controller layer routing Express requests to the notification service
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response.util';
import * as notificationService from './notification.service';

// ── GET: Paginated Notifications ─────────────────────────────────────────────

export async function getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await notificationService.getUserNotifications(req.user!.id, req.query as any);
    sendSuccess(res, data.records, 'Notifications retrieved successfully', 200, data.pagination);
  } catch (error) {
    next(error);
  }
}

// ── GET: Unread Notifications Count ──────────────────────────────────────────

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await notificationService.getUnreadCount(req.user!.id);
    sendSuccess(res, data, 'Unread notification count retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// ── PATCH: Mark Single Notification as Read ──────────────────────────────────

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notificationId = req.params.notificationId as string;
    await notificationService.markAsRead(req.user!.id, notificationId);
    sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

// ── PATCH: Mark All Notifications as Read ────────────────────────────────────

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
}
