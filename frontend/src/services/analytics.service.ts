// =============================================================================
// File: frontend/src/services/analytics.service.ts
// Purpose: Fetch system-wide computed metrics for the admin overview
// =============================================================================

import { api } from './api';

export interface AdminOverviewData {
  activeInternCount: number;
  completedInternshipCount: number;
  internshipCompletionRate: number;
  averageAttendancePercentage: number;
  collegeStats: {
    college: string;
    count: number;
  }[];
  mentorPerformanceSummary: {
    mentorName: string;
    assignedInternCount: number;
    averageProjectCompletionPercentage: number;
  }[];
}

export const getAdminOverview = async (): Promise<AdminOverviewData> => {
  const response = await api.get('/analytics/admin/overview');
  return response.data.data;
};
