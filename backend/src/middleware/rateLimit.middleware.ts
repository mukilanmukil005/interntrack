// =============================================================================
// File: backend/src/middleware/rateLimit.middleware.ts
// Purpose: Express rate limiters for auth and general API endpoints
// Dependencies: express-rate-limit
// =============================================================================

import rateLimit from 'express-rate-limit';

/** Shared error body for rate limit responses */
function rateLimitMessage(retryAfterSeconds: number) {
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
    },
  };
}

/**
 * Strict limiter for authentication endpoints (login, register, refresh).
 * 10 requests per IP per minute.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1_000, // 1 minute
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage(60),
  skipSuccessfulRequests: false,
});

/**
 * General API limiter for all other endpoints.
 * 200 requests per IP per minute.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1_000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage(60),
  skipSuccessfulRequests: true, // Don't count successful requests
});
