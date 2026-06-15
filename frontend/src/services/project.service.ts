// =============================================================================
// File: frontend/src/services/project.service.ts
// Purpose: Fetch and manage project and milestone data
// =============================================================================

import { api } from './api';

export interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
  startDate: string;
  endDate: string;
  repoUrl?: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  completionPercentage: number;
  internId: string;
  mentorNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  intern?: {
    id: string;
    college: string;
    domain: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
  milestones?: Milestone[];
  files?: ProjectFile[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completionPercentage: number;
  mentorFeedback?: string | null;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  domain: string;
  startDate: string;
  endDate: string;
  internId: string;
  repoUrl?: string | null;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  domain?: string;
  startDate?: string;
  endDate?: string;
  internId?: string;
  repoUrl?: string | null;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  mentorNotes?: string | null;
}

export interface CreateMilestonePayload {
  title: string;
  description?: string | null;
  dueDate: string;
}

export interface UpdateMilestonePayload {
  title?: string;
  description?: string | null;
  dueDate?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completionPercentage?: number;
  mentorFeedback?: string | null;
}

export interface GetProjectsParams {
  page?: number;
  limit?: number;
  status?: string;
  domain?: string;
  internId?: string;
}

export const getProjects = async (
  params?: GetProjectsParams
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
  const response = await api.get('/projects', { params });

  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

export const getProjectById = async (projectId: string): Promise<Project> => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data.data;
};

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const response = await api.post('/projects', payload);
  return response.data.data;
};

export const updateProject = async (projectId: string, payload: UpdateProjectPayload): Promise<Project> => {
  const response = await api.patch(`/projects/${projectId}`, payload);
  return response.data.data;
};

export const createMilestone = async (projectId: string, payload: CreateMilestonePayload): Promise<Milestone> => {
  const response = await api.post(`/projects/${projectId}/milestones`, payload);
  return response.data.data;
};

export const updateMilestone = async (projectId: string, milestoneId: string, payload: UpdateMilestonePayload): Promise<Milestone> => {
  const response = await api.patch(`/projects/${projectId}/milestones/${milestoneId}`, payload);
  return response.data.data;
};

export const deleteMilestone = async (projectId: string, milestoneId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
};
