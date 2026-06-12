// =============================================================================
// File: backend/src/modules/projects/project.service.ts
// Purpose: Project management business logic — CRUD, milestones, progress, files
//
// KEY DESIGN NOTES:
//   • Project ownership maps via InternProfile.id and InternProfile.userId
//   • Dates for @db.Date fields use Date.UTC() to avoid local-timezone midnight skew
//   • Business rules enforce that 100% milestone progress stays IN_PROGRESS
//     until a mentor approves it.
//   • Deleting project files also cleans them up from local disk storage.
// =============================================================================

import path from 'path';
import fs from 'fs';
import { Prisma, ProjectStatus, MilestoneStatus, Role, NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { roundPercentage } from '../../utils/math.util';
import { createNotification } from '../notifications/notification.service';
import { logger } from '../../config/logger';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  ReviewMilestoneInput,
  ProjectQuery,
} from './project.schema';

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a YYYY-MM-DD string into a UTC midnight Date object.
 * Prevents timezone offset bugs.
 */
function parseDateUtc(dateStr: string): Date {
  const parts = dateStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Builds an absolute URL path for an uploaded file.
 */
function buildFileUrl(file: Express.Multer.File): string {
  return file.path.replace(/\\/g, '/');
}

/**
 * Safely deletes a file from disk.
 */
function safeDeleteFile(filePath: string | null | undefined): void {
  if (!filePath) return;
  try {
    const absPath = path.resolve(filePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  } catch {
    // Suppressed intentionally
  }
}

/**
 * Calculates overall completion percentage of a project.
 * Defined as the average completion percentage across all its milestones.
 */
function calculateCompletionPercentage(milestones: { completionPercentage: number }[]): number {
  if (!milestones || milestones.length === 0) return 0;
  const sum = milestones.reduce((acc, m) => acc + m.completionPercentage, 0);
  return roundPercentage(sum / milestones.length);
}

/**
 * Retrieves the project and verifies access control:
 *   ADMIN  → unrestricted access
 *   MENTOR → only assigned interns' projects
 *   INTERN → only own assigned project
 */
async function getProjectWithAccess(projectId: string, requesterId: string, requesterRole: Role) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      intern: {
        select: {
          id: true,
          userId: true,
          mentorId: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      milestones: { orderBy: { dueDate: 'asc' } },
      files: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!project) {
    throw AppError.notFound('Project not found.');
  }

  if (requesterRole === Role.INTERN) {
    if (project.intern.userId !== requesterId) {
      throw AppError.forbidden('Access denied. This is not your project.');
    }
  } else if (requesterRole === Role.MENTOR) {
    if (project.intern.mentorId !== requesterId) {
      throw AppError.forbidden('Access denied. This intern is not assigned to you.');
    }
  }

  return project;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── ADMIN: Create Project ─────────────────────────────────────────────────────

export async function createProject(input: CreateProjectInput) {
  // 1. Verify intern profile exists
  const internProfile = await prisma.internProfile.findUnique({
    where: { userId: input.internId },
    select: { id: true },
  });
  if (!internProfile) {
    throw AppError.notFound('Intern profile not found.');
  }

  // 2. Business Rule: One project per intern. Check for duplicate assignment
  const existing = await prisma.project.findFirst({
    where: { internId: internProfile.id },
    select: { id: true },
  });
  if (existing) {
    throw AppError.conflict('This intern already has a project assigned.');
  }

  const startDate = parseDateUtc(input.startDate);
  const endDate = parseDateUtc(input.endDate);

  if (startDate > endDate) {
    throw AppError.badRequest('startDate cannot be after endDate.');
  }

  const project = await prisma.project.create({
    data: {
      internId: internProfile.id,
      title: input.title,
      description: input.description,
      domain: input.domain,
      startDate,
      endDate,
      repoUrl: input.repoUrl ?? null,
      status: ProjectStatus.NOT_STARTED,
    },
    include: {
      intern: {
        select: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      milestones: true,
      files: true,
    },
  });

  return {
    ...project,
    completionPercentage: 0,
  };
}

// ── ADMIN: Update Project Metadata ────────────────────────────────────────────

export async function updateProject(id: string, input: UpdateProjectInput) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, internId: true },
  });

  if (!project) {
    throw AppError.notFound('Project not found.');
  }

  const data: Prisma.ProjectUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.domain !== undefined) data.domain = input.domain;
  if (input.repoUrl !== undefined) data.repoUrl = input.repoUrl;
  if (input.status !== undefined) data.status = input.status;
  if (input.mentorNotes !== undefined) data.mentorNotes = input.mentorNotes;

  if (input.startDate) data.startDate = parseDateUtc(input.startDate);
  if (input.endDate) data.endDate = parseDateUtc(input.endDate);

  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    throw AppError.badRequest('startDate cannot be after endDate.');
  }

  if (input.internId) {
    const internProfile = await prisma.internProfile.findUnique({
      where: { userId: input.internId },
      select: { id: true },
    });
    if (!internProfile) {
      throw AppError.notFound('Intern profile not found.');
    }

    if (internProfile.id !== project.internId) {
      const existing = await prisma.project.findFirst({
        where: { internId: internProfile.id, NOT: { id } },
        select: { id: true },
      });
      if (existing) {
        throw AppError.conflict('This intern already has another project assigned.');
      }
      data.intern = { connect: { id: internProfile.id } };
    }
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
    include: {
      intern: {
        select: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      milestones: true,
      files: true,
    },
  });

  return {
    ...updated,
    completionPercentage: calculateCompletionPercentage(updated.milestones),
  };
}

// ── ADMIN: Get All Projects ───────────────────────────────────────────────────

export async function getAllProjects(query: ProjectQuery) {
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  const where: Prisma.ProjectWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.domain) where.domain = { contains: query.domain };

  if (query.internId) {
    const profile = await prisma.internProfile.findFirst({
      where: { userId: query.internId },
      select: { id: true },
    });
    if (!profile) {
      return { records: [], pagination: buildPaginationMeta(page, limit, 0) };
    }
    where.internId = profile.id;
  }

  const [records, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        intern: {
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        milestones: true,
      },
    }),
    prisma.project.count({ where }),
  ]);

  const mappedRecords = records.map(p => ({
    ...p,
    completionPercentage: calculateCompletionPercentage(p.milestones),
  }));

  return {
    records: mappedRecords,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

// ── ADMIN: Create Milestone ───────────────────────────────────────────────────

export async function createMilestone(projectId: string, input: CreateMilestoneInput) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    throw AppError.notFound('Project not found.');
  }

  const dueDate = parseDateUtc(input.dueDate);

  return prisma.milestone.create({
    data: {
      projectId,
      title: input.title,
      description: input.description ?? null,
      dueDate,
      status: MilestoneStatus.PENDING,
      completionPercentage: 0,
    },
  });
}

// ── ADMIN: Update Milestone ───────────────────────────────────────────────────

export async function updateMilestone(projectId: string, milestoneId: string, input: UpdateMilestoneInput) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: { id: true, projectId: true },
  });

  if (!milestone || milestone.projectId !== projectId) {
    throw AppError.notFound('Milestone not found in this project.');
  }

  const data: Prisma.MilestoneUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.completionPercentage !== undefined) data.completionPercentage = input.completionPercentage;
  if (input.mentorFeedback !== undefined) data.mentorFeedback = input.mentorFeedback;
  if (input.dueDate) data.dueDate = parseDateUtc(input.dueDate);

  return prisma.milestone.update({
    where: { id: milestoneId },
    data,
  });
}

// ── ADMIN: Delete Milestone ───────────────────────────────────────────────────

export async function deleteMilestone(projectId: string, milestoneId: string) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: { id: true, projectId: true },
  });

  if (!milestone || milestone.projectId !== projectId) {
    throw AppError.notFound('Milestone not found in this project.');
  }

  await prisma.milestone.delete({
    where: { id: milestoneId },
  });
}

// ── INTERN: Get Own Project ───────────────────────────────────────────────────

export async function getMyProject(userId: string) {
  const profile = await prisma.internProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw AppError.notFound('Intern profile not found.');
  }

  const project = await prisma.project.findFirst({
    where: { internId: profile.id },
    include: {
      milestones: { orderBy: { dueDate: 'asc' } },
      files: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!project) {
    throw AppError.notFound('No project has been assigned to you yet.');
  }

  return {
    ...project,
    completionPercentage: calculateCompletionPercentage(project.milestones),
  };
}

// ── INTERN: Update Milestone Progress ─────────────────────────────────────────

export async function updateMilestoneProgress(userId: string, milestoneId: string, percentage: number) {
  const profile = await prisma.internProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw AppError.notFound('Intern profile not found.');
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: { select: { internId: true } },
    },
  });

  if (!milestone || milestone.project.internId !== profile.id) {
    throw AppError.notFound('Milestone not found or is not associated with your project.');
  }

  // Business Rule: COMPLETED milestones cannot be edited by interns
  if (milestone.status === MilestoneStatus.COMPLETED) {
    throw AppError.forbidden('This milestone has already been completed and approved by your mentor. It cannot be modified.');
  }

  // Business Rule: Progress-based status transitions
  let newStatus: MilestoneStatus;
  if (percentage === 0) {
    newStatus = MilestoneStatus.PENDING;
  } else {
    // Even if percentage is 100%, it remains IN_PROGRESS until a mentor approves it.
    newStatus = MilestoneStatus.IN_PROGRESS;
  }

  return prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      completionPercentage: percentage,
      status: newStatus,
    },
  });
}

// ── INTERN: Upload Project File ───────────────────────────────────────────────

export async function uploadProjectFile(userId: string, projectId: string, file: Express.Multer.File) {
  const profile = await prisma.internProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    safeDeleteFile(file.path);
    throw AppError.notFound('Intern profile not found.');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { internId: true },
  });

  if (!project || project.internId !== profile.id) {
    safeDeleteFile(file.path);
    throw AppError.forbidden('Access denied. You can only upload files to your own project.');
  }

  return prisma.projectFile.create({
    data: {
      projectId,
      fileName: file.originalname,
      fileUrl: buildFileUrl(file),
      fileSize: file.size,
      mimeType: file.mimetype,
    },
  });
}

// ── INTERN: Delete Project File ───────────────────────────────────────────────

export async function deleteProjectFile(userId: string, projectId: string, fileId: string) {
  const profile = await prisma.internProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw AppError.notFound('Intern profile not found.');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { internId: true },
  });

  if (!project || project.internId !== profile.id) {
    throw AppError.forbidden('Access denied. You can only manage files for your own project.');
  }

  const projectFile = await prisma.projectFile.findUnique({
    where: { id: fileId },
  });

  if (!projectFile || projectFile.projectId !== projectId) {
    throw AppError.notFound('File not found.');
  }

  // Clean up from local disk storage
  safeDeleteFile(projectFile.fileUrl);

  await prisma.projectFile.delete({
    where: { id: fileId },
  });
}

// ── MENTOR: List Projects of Assigned Interns ─────────────────────────────────

export async function getMentorInternProjects(mentorUserId: string, query: ProjectQuery) {
  const { page, limit, skip } = parsePagination(String(query.page), String(query.limit));

  // Find all intern profiles assigned to this mentor
  const assignedInterns = await prisma.internProfile.findMany({
    where: { mentorId: mentorUserId },
    select: { id: true },
  });

  const internIds = assignedInterns.map(p => p.id);
  if (internIds.length === 0) {
    return { records: [], pagination: buildPaginationMeta(page, limit, 0) };
  }

  const where: Prisma.ProjectWhereInput = {
    internId: { in: internIds },
  };

  if (query.status) where.status = query.status;
  if (query.domain) where.domain = { contains: query.domain };

  const [records, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        intern: {
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        milestones: true,
      },
    }),
    prisma.project.count({ where }),
  ]);

  const mappedRecords = records.map(p => ({
    ...p,
    completionPercentage: calculateCompletionPercentage(p.milestones),
  }));

  return {
    records: mappedRecords,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

// ── MENTOR: Review Milestone ──────────────────────────────────────────────────

export async function reviewMilestone(
  mentorUserId: string,
  projectId: string,
  milestoneId: string,
  input: ReviewMilestoneInput
) {
  // Enforce mentor access rights
  const project = await getProjectWithAccess(projectId, mentorUserId, Role.MENTOR);

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: { id: true, projectId: true, title: true },
  });

  if (!milestone || milestone.projectId !== projectId) {
    throw AppError.notFound('Milestone not found in this project.');
  }

  const updateData: Prisma.MilestoneUpdateInput = {
    status: input.status,
    mentorFeedback: input.mentorFeedback ?? null,
  };

  // If mentor approves completion, set completionPercentage to 100%
  if (input.status === MilestoneStatus.COMPLETED) {
    updateData.completionPercentage = 100;
  }

  const updatedMilestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: updateData,
  });

  // Trigger notification (non-blocking failure policy)
  try {
    const notificationTitle = input.status === MilestoneStatus.COMPLETED ? 'Milestone Approved' : 'Milestone Revision Required';
    const notificationMsg = input.status === MilestoneStatus.COMPLETED
      ? `Your milestone "${milestone.title}" has been approved.`
      : `Your milestone "${milestone.title}" requires revision. Feedback: ${input.mentorFeedback || 'None'}`;

    await createNotification(project.intern.userId, notificationTitle, notificationMsg, NotificationType.GENERAL);
  } catch (error) {
    logger.warn(`Failed to trigger milestone review notification: ${error}`);
  }

  return updatedMilestone;
}

// ── SHARED/ALL ROLES: Get Single Project by ID ────────────────────────────────

export async function getProjectById(projectId: string, requesterId: string, requesterRole: Role) {
  const project = await getProjectWithAccess(projectId, requesterId, requesterRole);

  return {
    ...project,
    completionPercentage: calculateCompletionPercentage(project.milestones),
  };
}
