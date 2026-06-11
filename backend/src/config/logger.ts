// =============================================================================
// File: backend/src/config/logger.ts
// Purpose: Winston structured logger + Express request-logging middleware
// Dependencies: winston, env.ts
// =============================================================================

import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { env } from './env';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// ── Development: human-readable colored output ────────────────────────────────
const devFormat = combine(
  errors({ stack: true }),
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0
        ? `\n  ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}`
        : '';
    const stackStr = stack ? `\n${String(stack)}` : '';
    return `[${timestamp as string}] ${level}: ${String(message)}${metaStr}${stackStr}`;
  }),
);

// ── Production: structured JSON ───────────────────────────────────────────────
const prodFormat = combine(errors({ stack: true }), timestamp(), json());

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
  exitOnError: false,
});

// ── HTTP request logger middleware ─────────────────────────────────────────────
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level =
      res.statusCode >= 500
        ? 'error'
        : res.statusCode >= 400
          ? 'warn'
          : 'info';

    logger[level](`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent') ?? 'unknown',
    });
  });

  next();
}
