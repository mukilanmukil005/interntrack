// =============================================================================
// File: backend/src/server.ts
// Purpose: Application entry point — bootstraps the server with graceful shutdown
// Dependencies: app.ts, config/*, database.ts
// =============================================================================

import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';

/**
 * Ensure all required runtime directories exist before starting.
 */
function ensureDirectories(): void {
  const dirs = [
    path.resolve(env.UPLOAD_PATH, 'avatars'),
    path.resolve(env.UPLOAD_PATH, 'reports'),
    path.resolve(env.UPLOAD_PATH, 'projects'),
    path.resolve(env.UPLOAD_PATH, 'certificates'),
    ...(env.NODE_ENV === 'production' ? ['logs'] : []),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  }
}

/**
 * Bootstrap function — connects to DB, starts HTTP server, registers signal handlers.
 */
async function bootstrap(): Promise<void> {
  try {
    // 1. Ensure runtime directories
    ensureDirectories();

    // 2. Verify database connectivity
    await prisma.$connect();
    logger.info('✅ Database connection established');

    // 3. Create and start Express app
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info('');
      logger.info('🚀 InternTrack API Server started');
      logger.info(`   ├── Environment  : ${env.NODE_ENV}`);
      logger.info(`   ├── Port         : ${env.PORT}`);
      logger.info(`   ├── Frontend URL : ${env.FRONTEND_URL}`);
      logger.info(
        `   └── Health check : http://localhost:${env.PORT}/health`,
      );
      logger.info('');
    });

    // 4. Graceful shutdown handler
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`\n⚡ ${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('✅ HTTP server closed');

        // Disconnect from database
        await prisma.$disconnect();
        logger.info('✅ Database connection closed');
        logger.info('👋 Goodbye!\n');
        process.exit(0);
      });

      // Force shutdown after 10 seconds if server doesn't close
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    // 5. Handle unexpected errors
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('💥 Unhandled Promise Rejection:', { reason });
      process.exit(1);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('💥 Uncaught Exception:', { message: error.message, stack: error.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    await prisma.$disconnect().catch(() => null);
    process.exit(1);
  }
}

void bootstrap();
