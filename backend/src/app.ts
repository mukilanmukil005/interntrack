// =============================================================================
// File: backend/src/app.ts
// Purpose: Express application factory — creates and configures the app instance
// Dependencies: All middleware, all route modules
// =============================================================================

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { requestLogger } from './config/logger';
import { authLimiter, generalLimiter } from './middleware/rateLimit.middleware';
import { errorMiddleware } from './middleware/error.middleware';

// ── Route modules (add new modules here as phases progress) ───────────────────
import authRoutes        from './modules/auth/auth.routes';
import attendanceRoutes  from './modules/attendance/attendance.routes';
import reportRoutes      from './modules/reports/report.routes';
import projectRoutes     from './modules/projects/project.routes';
import analyticsRoutes   from './modules/analytics/analytics.routes';

/**
 * Creates and returns a fully configured Express application.
 * Kept separate from `server.ts` to allow clean testing without starting a server.
 */
export function createApp(): Application {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(
    helmet({
      // Allow cross-origin access to uploaded static files
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Serve uploaded files statically ─────────────────────────────────────────
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), 'uploads'), {
      maxAge: '1d',
      etag: true,
    }),
  );

  // ── HTTP request logging ─────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Rate limiting (applied before routes) ────────────────────────────────────
  // Auth limiter: 10 req/min (stricter)
  app.use('/api/v1/auth', authLimiter);
  // General limiter: 200 req/min
  app.use('/api', generalLimiter);

  // ── Health check (no auth required) ─────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      service: 'interntrack-api',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ── API routes ───────────────────────────────────────────────────────────────
  app.use('/api/v1/auth',       authRoutes);
  app.use('/api/v1/attendance', attendanceRoutes);
  app.use('/api/v1/reports',    reportRoutes);
  app.use('/api/v1/projects',   projectRoutes);
  app.use('/api/v1/analytics',  analyticsRoutes);
  // Future phases will add:
  // app.use('/api/v1/users',         usersRoutes);
  // app.use('/api/v1/programs',      programsRoutes);
  // app.use('/api/v1/reports',       reportsRoutes);
  // app.use('/api/v1/projects',      projectsRoutes);
  // app.use('/api/v1/certificates',  certificatesRoutes);
  // app.use('/api/v1/notifications', notificationsRoutes);
  // app.use('/api/v1/analytics',     analyticsRoutes);

  // ── 404 catch-all ───────────────────────────────────────────────────────────
  app.use('*', (_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
      },
    });
  });

  // ── Global error handler (MUST be last) ─────────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
