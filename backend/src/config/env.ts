// =============================================================================
// File: backend/src/config/env.ts
// Purpose: Validate and export all environment variables with Zod
// Dependencies: zod, dotenv
// =============================================================================

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(5000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // CORS
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // File uploads
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(10_485_760), // 10MB

  // Security
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌ Invalid environment variables:\n');
  const errors = result.error.flatten().fieldErrors;
  for (const [field, messages] of Object.entries(errors)) {
    console.error(`  ${field}: ${(messages ?? []).join(', ')}`);
  }
  console.error('\nCheck your .env file against .env.example\n');
  process.exit(1);
}

export const env = Object.freeze(result.data);

export type Env = typeof env;
