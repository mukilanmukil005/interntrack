// =============================================================================
// File: backend/src/config/database.ts
// Purpose: Prisma Client singleton — prevents multiple connections in hot reload
// Dependencies: @prisma/client, env.ts
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
    errorFormat: 'minimal',
  });
}

/**
 * Prisma singleton.
 * In development, the singleton is stored on `globalThis` to survive hot-reloads.
 * In production, a fresh instance is created once.
 */
export const prisma: PrismaClient =
  globalThis.__prismaClient ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}
