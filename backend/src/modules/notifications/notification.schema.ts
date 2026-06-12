// =============================================================================
// File: backend/src/modules/notifications/notification.schema.ts
// Purpose: Zod validation schemas for all notification endpoints
// =============================================================================

import { z } from 'zod';

// ── Paginated List Query ──────────────────────────────────────────────────────

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ── Notification ID Parameter ─────────────────────────────────────────────────

export const notificationIdParamSchema = z.object({
  notificationId: z.string().uuid('notificationId must be a valid UUID'),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
