// =============================================================================
// File: frontend/src/services/intern.service.ts
// Purpose: Encapsulate all intern-specific API interactions.
//          Normalizes backend responses before returning to components.
// =============================================================================

import { api } from './api';
import type { Project, Milestone, ProjectFile } from './project.service';

// ── Re-export shared types for convenience ────────────────────────────────────
export type { Project, Milestone, ProjectFile };

// ── Attendance ────────────────────────────────────────────────────────────────

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  halfDays: number;
  totalHoursWorked: number;
  requiredHours: number;
  completedHours: number;
  remainingHours: number;
  attendancePercentage: number;
  currentlyCheckedIn: boolean;
  todayRecord: {
    checkIn: string;
    checkOut: string | null;
  } | null;
}

export interface AttendanceRecord {
  id: string;
  internId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  hoursWorked: number | null;
  status: 'PRESENT' | 'HALF_DAY';
  createdAt: string;
}

export interface GetAttendanceHistoryParams {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
}

/** GET /api/v1/attendance/my/summary — attendance percentages, totals, live status */
export const getAttendanceSummary = async (): Promise<AttendanceSummary> => {
  const response = await api.get('/attendance/my/summary');
  return response.data.data;
};

/** GET /api/v1/attendance/my — paginated attendance history */
export const getAttendanceHistory = async (
  params?: GetAttendanceHistoryParams
): Promise<{
  data: AttendanceRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const response = await api.get('/attendance/my', { params });
  return {
    data: response.data.data ?? [],
    pagination: response.data.pagination,
  };
};

/** GET /api/v1/attendance/today — today's record (or null if not checked in) */
export const getTodayAttendance = async (): Promise<AttendanceRecord | null> => {
  const response = await api.get('/attendance/today');
  return response.data.data ?? null;
};

/** POST /api/v1/attendance/checkin */
export const checkIn = async (): Promise<AttendanceRecord> => {
  const response = await api.post('/attendance/checkin');
  return response.data.data;
};

/** POST /api/v1/attendance/checkout */
export const checkOut = async (): Promise<AttendanceRecord> => {
  const response = await api.post('/attendance/checkout');
  return response.data.data;
};

// ── Project ───────────────────────────────────────────────────────────────────

/** GET /api/v1/projects/my — intern's own assigned project with milestones+files */
export const getMyProject = async (): Promise<Project> => {
  const response = await api.get('/projects/my');
  return response.data.data;
};

// ── Milestone Progress ────────────────────────────────────────────────────────

/** PATCH /api/v1/projects/my/milestones/:milestoneId/progress */
export const updateMilestoneProgress = async (
  milestoneId: string,
  completionPercentage: number
): Promise<Milestone> => {
  const response = await api.patch(
    `/projects/my/milestones/${milestoneId}/progress`,
    { completionPercentage }
  );
  return response.data.data;
};

// ── Daily Reports ─────────────────────────────────────────────────────────────

export interface DailyReport {
  id: string;
  internId: string;
  date: string;
  taskTitle: string;
  taskDesc: string;
  hoursWorked: number;
  learning: string;
  challenges: string;
  attachmentUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  mentorComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface SubmitReportPayload {
  date: string;
  taskTitle: string;
  taskDesc: string;
  hoursWorked: number;
  learning: string;
  challenges: string;
}

export interface GetMyReportsParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  month?: number;
  year?: number;
}

/** GET /api/v1/reports/my — paginated list of own reports */
export const getMyReports = async (
  params?: GetMyReportsParams
): Promise<{
  data: DailyReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const response = await api.get('/reports/my', { params });
  return {
    data: response.data.data ?? [],
    pagination: response.data.pagination,
  };
};

/**
 * POST /api/v1/reports — submit a new daily report.
 * Backend uses multipart/form-data so we send FormData.
 */
export const submitReport = async (
  payload: SubmitReportPayload,
  attachment?: File
): Promise<{ report: DailyReport; warning?: string | null }> => {
  const form = new FormData();
  form.append('date', payload.date);
  form.append('taskTitle', payload.taskTitle);
  form.append('taskDesc', payload.taskDesc);
  form.append('hoursWorked', String(payload.hoursWorked));
  form.append('learning', payload.learning);
  form.append('challenges', payload.challenges);
  if (attachment) {
    form.append('attachment', attachment);
  }

  const response = await api.post('/reports', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

// ── Project Files ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/projects/my/files/:projectId — upload a file (multipart).
 * Returns the created ProjectFile record.
 */
export const uploadProjectFile = async (
  projectId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<ProjectFile> => {
  const form = new FormData();
  form.append('file', file);

  const response = await api.post(`/projects/my/files/${projectId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return response.data.data;
};

/** DELETE /api/v1/projects/my/files/:projectId/:fileId */
export const deleteProjectFile = async (
  projectId: string,
  fileId: string
): Promise<void> => {
  await api.delete(`/projects/my/files/${projectId}/${fileId}`);
};
