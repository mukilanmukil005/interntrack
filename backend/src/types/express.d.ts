// =============================================================================
// File: backend/src/types/express.d.ts
// Purpose: Augment Express Request with authenticated user payload
// Dependencies: @prisma/client
// =============================================================================

import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by `authenticate` middleware after a valid JWT is verified.
       * Undefined on public/unauthenticated routes.
       */
      user?: {
        id: string;
        email: string;
        role: Role;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export {};
