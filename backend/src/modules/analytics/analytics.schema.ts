// =============================================================================
// File: backend/src/modules/analytics/analytics.schema.ts
// Purpose: Zod validation schemas for analytics endpoints
// =============================================================================

import { z } from 'zod';

export const internIdParamSchema = z.object({
  internId: z.string().uuid('internId must be a valid UUID'),
});

export type InternIdParam = z.infer<typeof internIdParamSchema>;
