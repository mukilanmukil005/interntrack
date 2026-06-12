// =============================================================================
// File: backend/src/modules/notifications/notification.service.ts
// Purpose: Business logic for sending, retrieving, and managing notifications
// =============================================================================

import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../utils/app-error';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import type { NotificationQuery } from './notification.schema';

// ── INTERNAL: Create Notification (Non-blocking) ────────────────────────────

/**
 * Creates a notification in the database for a specific user.
 * 
 * CRITICAL RULE:
 * Notification creation failures must NEVER cause the parent business operation to fail.
 * This function handles all errors internally, logs a warning, and returns safely.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType
): Promise<boolean> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
    return true;
  } catch (error: any) {
    // Log error as a warning and do not propagate to avoid breaking parent business transactions
    logger.warn(`Failed to create notification for user ID ${userId}: ${error?.message || error}`);
    return false;
  }
}

// ── USER: Retrieve Paginated Notifications ───────────────────────────────────

export async function getUserNotifications(userId: string, query: NotificationQuery) {
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  const where = { userId };

  const [records, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    records,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

// ── USER: Mark Single Notification as Read ───────────────────────────────────

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  // Enforce ownership: if it doesn't exist or is not owned by the user, return 404
  if (!notification || notification.userId !== userId) {
    throw AppError.notFound('Notification not found.');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

// ── USER: Mark All Notifications as Read ─────────────────────────────────────

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });
}

// ── USER: Get Count of Unread Notifications ──────────────────────────────────

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return { unreadCount: count };
}
