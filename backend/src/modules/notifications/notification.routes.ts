// =============================================================================
// File: backend/src/modules/notifications/notification.routes.ts
// Purpose: Express router for all /api/v1/notifications endpoints
//
// ROUTE ORDER (critical — static paths must precede dynamic /:notificationId paths):
//   GET    /unread-count
//   PATCH  /read-all
//   GET    /
//   PATCH  /:notificationId/read
// =============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { notificationQuerySchema, notificationIdParamSchema } from './notification.schema';
import * as notificationController from './notification.controller';

const router = Router();

// Apply authentication middleware globally to all routes in this router
router.use(authenticate);

/**
 * @route  GET /api/v1/notifications/unread-count
 * @access Authenticated Users
 * @desc   Get the unread notifications count for the logged-in user.
 */
router.get(
  '/unread-count',
  notificationController.getUnreadCount,
);

/**
 * @route  PATCH /api/v1/notifications/read-all
 * @access Authenticated Users
 * @desc   Mark all notifications as read for the logged-in user.
 */
router.patch(
  '/read-all',
  notificationController.markAllAsRead,
);

/**
 * @route  GET /api/v1/notifications
 * @access Authenticated Users
 * @query  page, limit
 * @desc   Get paginated list of notifications for the logged-in user.
 */
router.get(
  '/',
  validate(notificationQuerySchema, 'query'),
  notificationController.getUserNotifications,
);

/**
 * @route  PATCH /api/v1/notifications/:notificationId/read
 * @access Authenticated Users
 * @desc   Mark a single notification as read. Enforces ownership check.
 */
router.patch(
  '/:notificationId/read',
  validate(notificationIdParamSchema, 'params'),
  notificationController.markAsRead,
);

export default router;
