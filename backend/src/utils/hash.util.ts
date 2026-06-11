// =============================================================================
// File: backend/src/utils/hash.util.ts
// Purpose: bcrypt password hashing and comparison helpers
// Dependencies: bcrypt, env.ts
// =============================================================================

import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Hashes a plain-text password using bcrypt.
 * Cost factor is read from BCRYPT_ROUNDS env var (default: 12).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * Compares a plain-text password with a bcrypt hash.
 * Returns true if they match.
 */
export async function comparePassword(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
