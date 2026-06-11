// =============================================================================
// File: backend/src/middleware/upload.middleware.ts
// Purpose: Multer file upload configurations for each upload context
// Dependencies: multer, env.ts, app-error.ts
// =============================================================================

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

/** Creates directory if it doesn't exist */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Returns a disk storage engine scoped to a subdirectory of the upload path */
function createDiskStorage(subDir: string): multer.StorageEngine {
  const uploadDir = path.resolve(env.UPLOAD_PATH, subDir);
  ensureDir(uploadDir);

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${timestamp}-${randomSuffix}${ext}`);
    },
  });
}

/** Rejects files with disallowed MIME types */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Allowed types: JPEG, PNG, PDF, DOCX',
        400,
        'INVALID_FILE_TYPE',
      ),
    );
  }
}

const sharedLimits = { fileSize: env.MAX_FILE_SIZE };

// ── Named upload instances ──────────────────────────────────────────────────

/** For user profile avatars (images only, single file, field: 'avatar') */
export const uploadAvatar = multer({
  storage: createDiskStorage('avatars'),
  fileFilter,
  limits: sharedLimits,
}).single('avatar');

/** For daily report attachments (single file, field: 'attachment') */
export const uploadReportAttachment = multer({
  storage: createDiskStorage('reports'),
  fileFilter,
  limits: sharedLimits,
}).single('attachment');

/** For project file uploads (single file, field: 'file') */
export const uploadProjectFile = multer({
  storage: createDiskStorage('projects'),
  fileFilter,
  limits: sharedLimits,
}).single('file');
