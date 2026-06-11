// =============================================================================
// File: backend/src/utils/math.util.ts
// Purpose: Shared mathematical helpers for precision calculations
// =============================================================================

/**
 * Rounds a percentage value to exactly 2 decimal places.
 * Uses Number.EPSILON to handle floating-point precision differences correctly.
 * e.g., 83.33333333333333 -> 83.33
 */
export function roundPercentage(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
