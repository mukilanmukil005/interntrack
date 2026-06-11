// =============================================================================
// File: backend/src/middleware/validate.middleware.ts
// Purpose: Zod schema validation middleware for request body, query, and params
// Dependencies: zod
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';

type RequestTarget = 'body' | 'query' | 'params';

/**
 * Returns middleware that validates a specific part of the request using a Zod schema.
 * On success, replaces `req[target]` with the parsed (and coerced) data.
 * On failure, passes a ZodError to next() for the error middleware to format.
 *
 * @param schema - A Zod object schema to validate against
 * @param target - Which part of the request to validate (default: 'body')
 */
export function validate(schema: ZodType<unknown>, target: RequestTarget = 'body') {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      // Replace with Zod-coerced/transformed values
      (req as unknown as Record<string, unknown>)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err); // handled by errorMiddleware
      } else {
        next(err);
      }
    }
  };
}
