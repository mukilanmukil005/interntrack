// =============================================================================
// File: backend/src/utils/pagination.util.ts
// Purpose: Parse and build pagination metadata for list endpoints
// =============================================================================

import { PaginationMeta, PaginationParams } from '../types/common.types';

/**
 * Parses raw query string values into validated pagination params.
 *
 * @param rawPage  - Raw `page` query param (e.g. "2")
 * @param rawLimit - Raw `limit` query param (e.g. "20")
 * @param maxLimit - Hard cap on items per page (default: 100)
 */
export function parsePagination(
  rawPage?: string,
  rawLimit?: string,
  maxLimit = 100,
): PaginationParams {
  const page = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.parseInt(rawLimit ?? '10', 10) || 10),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Builds the pagination metadata object included in list responses.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
