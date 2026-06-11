// =============================================================================
// File: backend/src/modules/projects/project.controller.ts
// Purpose: Thin Express route handlers for project and milestone operations
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../utils/response.util';
import { AppError } from '../../utils/app-error';
import * as projectService from './project.service';

// ── ADMIN: Create Project ─────────────────────────────────────────────────────

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.createProject(req.body);
    sendCreated(res, project, 'Project created successfully');
  } catch (error) {
    next(error);
  }
}

// ── ADMIN: Update Project Metadata ────────────────────────────────────────────

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const project = await projectService.updateProject(projectId, req.body);
    sendSuccess(res, project, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
}

// ── ADMIN: Get All Projects ───────────────────────────────────────────────────

export async function getAllProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await projectService.getAllProjects(req.query as any);
    sendSuccess(res, data.records, 'Projects retrieved successfully', 200, data.pagination);
  } catch (error) {
    next(error);
  }
}

// ── ADMIN: Create Milestone ───────────────────────────────────────────────────

export async function createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const milestone = await projectService.createMilestone(projectId, req.body);
    sendCreated(res, milestone, 'Milestone created successfully');
  } catch (error) {
    next(error);
  }
}

// ── ADMIN: Update Milestone ───────────────────────────────────────────────────

export async function updateMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const milestoneId = req.params.milestoneId as string;
    const milestone = await projectService.updateMilestone(projectId, milestoneId, req.body);
    sendSuccess(res, milestone, 'Milestone updated successfully');
  } catch (error) {
    next(error);
  }
}

// ── ADMIN: Delete Milestone ───────────────────────────────────────────────────

export async function deleteMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const milestoneId = req.params.milestoneId as string;
    await projectService.deleteMilestone(projectId, milestoneId);
    sendSuccess(res, null, 'Milestone deleted successfully');
  } catch (error) {
    next(error);
  }
}

// ── INTERN: Get Own Project ───────────────────────────────────────────────────

export async function getMyProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.getMyProject(req.user!.id);
    sendSuccess(res, project, 'Project details retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// ── INTERN: Update Milestone Progress ─────────────────────────────────────────

export async function updateMilestoneProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const milestoneId = req.params.milestoneId as string;
    const { completionPercentage } = req.body;
    const milestone = await projectService.updateMilestoneProgress(req.user!.id, milestoneId, completionPercentage);
    sendSuccess(res, milestone, 'Milestone progress updated successfully');
  } catch (error) {
    next(error);
  }
}

// ── INTERN: Upload Project File ───────────────────────────────────────────────

export async function uploadProjectFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    if (!req.file) {
      throw AppError.badRequest('No file uploaded.');
    }
    const file = await projectService.uploadProjectFile(req.user!.id, projectId, req.file);
    sendCreated(res, file, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
}

// ── INTERN: Delete Project File ───────────────────────────────────────────────

export async function deleteProjectFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const fileId = req.params.fileId as string;
    await projectService.deleteProjectFile(req.user!.id, projectId, fileId);
    sendSuccess(res, null, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
}

// ── MENTOR: List Projects of Assigned Interns ─────────────────────────────────

export async function getMentorInternProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await projectService.getMentorInternProjects(req.user!.id, req.query as any);
    sendSuccess(res, data.records, 'Projects retrieved successfully', 200, data.pagination);
  } catch (error) {
    next(error);
  }
}

// ── MENTOR: Review Milestone ──────────────────────────────────────────────────

export async function reviewMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const milestoneId = req.params.milestoneId as string;
    const milestone = await projectService.reviewMilestone(req.user!.id, projectId, milestoneId, req.body);
    sendSuccess(res, milestone, 'Milestone review submitted successfully');
  } catch (error) {
    next(error);
  }
}

// ── SHARED/ALL ROLES: Get Single Project by ID ────────────────────────────────

export async function getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const project = await projectService.getProjectById(projectId, req.user!.id, req.user!.role);
    sendSuccess(res, project, 'Project retrieved successfully');
  } catch (error) {
    next(error);
  }
}
