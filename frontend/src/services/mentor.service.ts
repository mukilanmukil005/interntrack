// =============================================================================
// File: frontend/src/services/mentor.service.ts
// Purpose: Fetch and manage mentor-specific data and actions
// =============================================================================

import { api } from './api';
import type { Project, Milestone } from './project.service';

export interface MentorInternSummary {
  internId: string;
  name: string;
  email: string;
  attendancePercentage: number;
  projectCompletionPercentage: number;
  reportsSubmittedCount: number;
}

export interface MentorInterventionItem {
  internId: string;
  name: string;
  email: string;
  attendancePercentage: number;
  projectCompletionPercentage: number;
  reasons: string[];
}

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
  intern?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  month?: number;
  year?: number;
}

export interface ReviewReportPayload {
  action: 'approve' | 'reject';
  mentorComment?: string | null;
}

export interface GetMentorProjectsParams {
  page?: number;
  limit?: number;
  status?: string;
  domain?: string;
  internId?: string;
}

export interface ReviewMilestonePayload {
  status: 'COMPLETED' | 'IN_PROGRESS';
  mentorFeedback?: string | null;
}

/** Fetch summary details of all assigned interns. */
export const getMentorSummary = async (): Promise<MentorInternSummary[]> => {
  const response = await api.get('/analytics/mentor/summary');
  return response.data.data ?? [];
};

/** Fetch assigned interns requiring evaluation or attendance interventions. */
export const getMentorInterventions = async (): Promise<MentorInterventionItem[]> => {
  const response = await api.get('/analytics/mentor/intervention');
  return response.data.data ?? [];
};

/** Fetch daily reports queue awaiting review (or filter by status). */
export const getMentorPendingReports = async (
  params?: GetReportsParams
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
  const response = await api.get('/reports/mentor/pending', { params });
  return {
    data: response.data.data ?? [],
    pagination: response.data.pagination,
  };
};

/** Approve or Reject an intern's daily log submission. */
export const reviewReport = async (
  reportId: string,
  payload: ReviewReportPayload
): Promise<DailyReport> => {
  const response = await api.post(`/reports/${reportId}/review`, payload);
  return response.data.data;
};

/** Fetch project guidelines and progress indicators for assigned interns. */
export const getMentorInternProjects = async (
  params?: GetMentorProjectsParams
): Promise<{
  data: Project[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const response = await api.get('/projects/mentor/interns', { params });
  return {
    data: response.data.data ?? [],
    pagination: response.data.pagination,
  };
};

/** Submit a milestone review: approve completion or request revision with comments. */
export const reviewMilestone = async (
  projectId: string,
  milestoneId: string,
  payload: ReviewMilestonePayload
): Promise<Milestone> => {
  const response = await api.patch(
    `/projects/${projectId}/milestones/${milestoneId}/review`,
    payload
  );
  return response.data.data;
};
