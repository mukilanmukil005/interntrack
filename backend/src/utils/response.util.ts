// =============================================================================
// File: backend/src/utils/response.util.ts
// Purpose: Standardized API response helpers
// Dependencies: express
// =============================================================================

import { Response } from 'express';
import { PaginationMeta } from '../types/common.types';

/**
 * Sends a 200 (or custom status) success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  pagination?: PaginationMeta,
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(pagination !== undefined && { pagination }),
  });
}

/**
 * Sends a 201 Created success response.
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message = 'Created successfully',
): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Sends a 204 No Content response.
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}
