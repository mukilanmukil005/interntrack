// =============================================================================
// File: backend/src/types/common.types.ts
// Purpose: Shared API response and pagination TypeScript interfaces
// =============================================================================

/**
 * Standard success response envelope.
 */
export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

/**
 * Standard error response envelope.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

/**
 * Pagination metadata included in list responses.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parsed and validated pagination query parameters.
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}
