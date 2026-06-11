// =============================================================================
// File: backend/src/modules/analytics/analytics.service.ts
// Purpose: Progress tracking and system-wide analytics computed dynamically
//
// KEY DESIGN NOTES:
//   • Strictly read-only operations — no writes or mutations.
//   • Prevention of N+1 database round-trips via single findMany queries + relation includes.
//   • Shared roundPercentage helper for rounding all values to 2 decimal places.
//   • Intervention calculation is evaluated cleanly in-memory.
//   • Consistently uses Date.UTC for dates difference to avoid timezone shifts.
// =============================================================================

import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { roundPercentage } from '../../utils/math.util';

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared in-memory calculations for a single intern's profile relations
 */
function computeSingleInternAnalytics(
  requiredHrs: number,
  startDate: Date | null,
  endDate: Date | null,
  attendance: { status: string; hoursWorked: any }[],
  dailyReports: { id: string }[],
  project: { status: string; milestones: { status: string; completionPercentage: number }[] } | null,
  weeklySubmissionCounts: number[]
) {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  // 1. Completed & Remaining Hours
  const completedHours = roundPercentage(
    attendance.reduce((sum, entry) => sum + Number(entry.hoursWorked || 0), 0)
  );
  const remainingHours = roundPercentage(Math.max(0, requiredHrs - completedHours));

  // 2. Attendance %
  let elapsedDays = 0;
  if (startDate) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : today;
    const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const endUtc = Date.UTC(
      Math.min(todayUtc, Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
    );
    const diffTime = endUtc - startUtc;
    elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))) + 1;
  }

  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const halfDayCount = attendance.filter(a => a.status === 'HALF_DAY').length;

  let attendancePercentage = 100.00;
  if (elapsedDays > 0) {
    const attendedValue = presentCount + 0.5 * halfDayCount;
    attendancePercentage = roundPercentage((attendedValue / elapsedDays) * 100);
    if (attendancePercentage > 100) attendancePercentage = 100.00;
  }

  // 3. Daily Reports
  const reportsSubmittedCount = dailyReports.length;
  const weeklySubmissionTrends = [
    { week: 'Week 1', count: weeklySubmissionCounts[0] || 0 },
    { week: 'Week 2', count: weeklySubmissionCounts[1] || 0 },
    { week: 'Week 3', count: weeklySubmissionCounts[2] || 0 },
    { week: 'Week 4', count: weeklySubmissionCounts[3] || 0 },
  ];

  // 4. Project & Milestones
  let projectStatus = 'NOT_ASSIGNED';
  let projectCompletionPercentage = 0.00;
  let milestonesCompleted = 0;
  let milestonesPending = 0;
  let milestoneCompletionRate = 0.00;

  if (project) {
    projectStatus = project.status;
    const milestones = project.milestones;

    if (milestones.length > 0) {
      const totalMilestoneProgress = milestones.reduce((sum, m) => sum + m.completionPercentage, 0);
      projectCompletionPercentage = roundPercentage(totalMilestoneProgress / milestones.length);

      milestonesCompleted = milestones.filter(m => m.status === 'COMPLETED').length;
      milestonesPending = milestones.length - milestonesCompleted;
      milestoneCompletionRate = roundPercentage((milestonesCompleted / milestones.length) * 100);
    }
  }

  return {
    requiredHours: requiredHrs,
    completedHours,
    remainingHours,
    attendancePercentage,
    reportsSubmittedCount,
    weeklySubmissionTrends,
    projectStatus,
    projectCompletionPercentage,
    milestonesCompletedCount: milestonesCompleted,
    milestonesPendingCount: milestonesPending,
    milestoneCompletionRate,
  };
}

/**
 * Evaluates reports submitted within the last 4 weeks binned by 7-day increments
 */
async function fetchWeeklySubmissionCounts(internProfileId: string): Promise<number[]> {
  const today = new Date();
  const counts: number[] = [];

  for (let i = 0; i < 4; i++) {
    const daysEnd = (i + 1) * 7 - 1;
    const daysStart = i * 7;

    const dateStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysEnd));
    const dateEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysStart, 23, 59, 59, 999));

    const count = await prisma.dailyReport.count({
      where: {
        internId: internProfileId,
        date: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
    });
    counts.push(count);
  }

  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── INTERN: Get Personal Progress Dashboard ───────────────────────────────────

export async function getInternAnalytics(userId: string) {
  const profile = await prisma.internProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      requiredHrs: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!profile) {
    throw AppError.notFound('Intern profile not found.');
  }

  const [attendance, dailyReports, project, weeklyCounts] = await Promise.all([
    prisma.attendance.findMany({
      where: { internId: profile.id },
      select: { status: true, hoursWorked: true, date: true },
    }),
    prisma.dailyReport.findMany({
      where: { internId: profile.id },
      select: { id: true },
    }),
    prisma.project.findFirst({
      where: { internId: profile.id },
      include: {
        milestones: { select: { status: true, completionPercentage: true } },
      },
    }),
    fetchWeeklySubmissionCounts(profile.id),
  ]);

  return computeSingleInternAnalytics(
    profile.requiredHrs,
    profile.startDate,
    profile.endDate,
    attendance as any,
    dailyReports,
    project,
    weeklyCounts
  );
}

// ── MENTOR: Get Summary list of Assigned Interns ──────────────────────────────

export async function getMentorAnalyticsSummary(mentorUserId: string) {
  const interns = await prisma.internProfile.findMany({
    where: { mentorId: mentorUserId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      attendance: {
        select: {
          status: true,
          hoursWorked: true,
          date: true,
        },
      },
      projects: {
        include: {
          milestones: {
            select: {
              completionPercentage: true,
            },
          },
        },
      },
      dailyReports: {
        select: {
          id: true,
        },
      },
    },
  });

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  return interns.map(intern => {
    // Attendance %
    let elapsedDays = 0;
    if (intern.startDate) {
      const start = new Date(intern.startDate);
      const end = intern.endDate ? new Date(intern.endDate) : today;
      const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
      const endUtc = Date.UTC(
        Math.min(todayUtc, Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
      );
      const diffTime = endUtc - startUtc;
      elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))) + 1;
    }

    const presentCount = intern.attendance.filter(a => a.status === 'PRESENT').length;
    const halfDayCount = intern.attendance.filter(a => a.status === 'HALF_DAY').length;

    let attendancePercentage = 100.00;
    if (elapsedDays > 0) {
      const attendedValue = presentCount + 0.5 * halfDayCount;
      attendancePercentage = roundPercentage((attendedValue / elapsedDays) * 100);
      if (attendancePercentage > 100) attendancePercentage = 100.00;
    }

    // Project Completion %
    let projectCompletionPercentage = 0.00;
    const project = intern.projects[0];
    if (project && project.milestones.length > 0) {
      const sum = project.milestones.reduce((acc, m) => acc + m.completionPercentage, 0);
      projectCompletionPercentage = roundPercentage(sum / project.milestones.length);
    }

    return {
      internId: intern.userId,
      name: `${intern.user.firstName} ${intern.user.lastName}`,
      email: intern.user.email,
      attendancePercentage,
      projectCompletionPercentage,
      reportsSubmittedCount: intern.dailyReports.length,
    };
  });
}

// ── MENTOR: Get Progress detail of specific Assigned Intern ────────────────────

export async function getMentorInternProgress(mentorUserId: string, internId: string) {
  const profile = await prisma.internProfile.findUnique({
    where: { userId: internId },
    select: {
      id: true,
      mentorId: true,
      requiredHrs: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!profile) {
    throw AppError.notFound('Intern profile not found.');
  }

  // RBAC Assignment check
  if (profile.mentorId !== mentorUserId) {
    throw AppError.forbidden('Access denied. This intern is not assigned to you.');
  }

  const [attendance, dailyReports, project, weeklyCounts] = await Promise.all([
    prisma.attendance.findMany({
      where: { internId: profile.id },
      select: { status: true, hoursWorked: true, date: true },
    }),
    prisma.dailyReport.findMany({
      where: { internId: profile.id },
      select: { id: true },
    }),
    prisma.project.findFirst({
      where: { internId: profile.id },
      include: {
        milestones: { select: { status: true, completionPercentage: true } },
      },
    }),
    fetchWeeklySubmissionCounts(profile.id),
  ]);

  return computeSingleInternAnalytics(
    profile.requiredHrs,
    profile.startDate,
    profile.endDate,
    attendance as any,
    dailyReports,
    project,
    weeklyCounts
  );
}

// ── MENTOR: Intervention Candidates List ──────────────────────────────────────

export async function getMentorInterventionList(mentorUserId: string) {
  const interns = await prisma.internProfile.findMany({
    where: { mentorId: mentorUserId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      attendance: {
        select: {
          status: true,
        },
      },
      projects: {
        include: {
          milestones: {
            select: {
              completionPercentage: true,
            },
          },
        },
      },
    },
  });

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const interventionList: any[] = [];

  for (const intern of interns) {
    let elapsedDays = 0;
    let totalDays = 0;
    if (intern.startDate) {
      const start = new Date(intern.startDate);
      const end = intern.endDate ? new Date(intern.endDate) : today;
      const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
      const endUtc = Date.UTC(
        Math.min(todayUtc, Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
      );
      const diffTime = endUtc - startUtc;
      elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))) + 1;

      if (intern.endDate) {
        const fullDiffTime = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - startUtc;
        totalDays = Math.max(1, Math.floor(fullDiffTime / (1000 * 60 * 60 * 24)) + 1);
      }
    }

    // Attendance calculation
    const presentCount = intern.attendance.filter(a => a.status === 'PRESENT').length;
    const halfDayCount = intern.attendance.filter(a => a.status === 'HALF_DAY').length;

    let attendancePercentage = 100.00;
    if (elapsedDays > 0) {
      const attendedValue = presentCount + 0.5 * halfDayCount;
      attendancePercentage = roundPercentage((attendedValue / elapsedDays) * 100);
      if (attendancePercentage > 100) attendancePercentage = 100.00;
    }

    // Project Progress calculation
    let projectCompletionPercentage = 0.00;
    const project = intern.projects[0];
    if (project && project.milestones.length > 0) {
      const sum = project.milestones.reduce((acc, m) => acc + m.completionPercentage, 0);
      projectCompletionPercentage = roundPercentage(sum / project.milestones.length);
    }

    const reasons: string[] = [];

    // Rule 1: Low Attendance (< 75.00%)
    if (attendancePercentage < 75.00) {
      reasons.push(`Low Attendance (${attendancePercentage}%)`);
    }

    // Rule 2: Slow Project Progress (elapsed > 50% and project < 40%)
    const isDurationHalfElapsed = totalDays > 0 && (elapsedDays / totalDays) > 0.50;
    if (isDurationHalfElapsed && projectCompletionPercentage < 40.00) {
      const durationPercent = roundPercentage((elapsedDays / totalDays) * 100);
      reasons.push(`Slow Project Progress (${projectCompletionPercentage}% completed at ${durationPercent}% duration elapsed)`);
    }

    if (reasons.length > 0) {
      interventionList.push({
        internId: intern.userId,
        name: `${intern.user.firstName} ${intern.user.lastName}`,
        email: intern.user.email,
        attendancePercentage,
        projectCompletionPercentage,
        reasons,
      });
    }
  }

  return interventionList;
}

// ── ADMIN: System Overview Analytics ──────────────────────────────────────────

export async function getAdminOverview() {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const [activeCount, completedCount, totalCount, collegeGroups, mentors, interns] = await Promise.all([
    prisma.internProfile.count({ where: { status: 'ACTIVE' } }),
    prisma.internProfile.count({ where: { status: 'COMPLETED' } }),
    prisma.internProfile.count(),
    prisma.internProfile.groupBy({
      by: ['college'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.user.findMany({
      where: { role: 'MENTOR' },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.internProfile.findMany({
      select: {
        mentorId: true,
        startDate: true,
        endDate: true,
        status: true,
        attendance: { select: { status: true } },
        projects: {
          include: {
            milestones: { select: { completionPercentage: true } },
          },
        },
      },
    }),
  ]);

  // 1. Internship Completion Rate
  const internshipCompletionRate = totalCount > 0
    ? roundPercentage((completedCount / totalCount) * 100)
    : 0.00;

  // 2. College Statistics
  const collegeStats = collegeGroups.map(g => ({
    college: g.college,
    count: g._count.id,
  }));

  // 3. Process Active Interns' Attendance
  let totalActiveAttendanceSum = 0;
  let activeWithDatesCount = 0;

  // Track mentor performance aggregates in-memory
  const mentorProjectsMap: Record<string, number[]> = {};
  const mentorInternCountMap: Record<string, number> = {};

  for (const intern of interns) {
    let elapsedDays = 0;
    if (intern.startDate) {
      const start = new Date(intern.startDate);
      const end = intern.endDate ? new Date(intern.endDate) : today;
      const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
      const endUtc = Date.UTC(
        Math.min(todayUtc, Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
      );
      const diffTime = endUtc - startUtc;
      elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))) + 1;
    }

    const presentCount = intern.attendance.filter(a => a.status === 'PRESENT').length;
    const halfDayCount = intern.attendance.filter(a => a.status === 'HALF_DAY').length;

    let attendancePercentage = 100.00;
    if (elapsedDays > 0) {
      const attendedValue = presentCount + 0.5 * halfDayCount;
      attendancePercentage = (attendedValue / elapsedDays) * 100;
      if (attendancePercentage > 100) attendancePercentage = 100.00;
    }

    if (intern.status === 'ACTIVE') {
      totalActiveAttendanceSum += attendancePercentage;
      activeWithDatesCount++;
    }

    // Aggregate Mentor project completions
    if (intern.mentorId) {
      mentorInternCountMap[intern.mentorId] = (mentorInternCountMap[intern.mentorId] || 0) + 1;

      const project = intern.projects[0];
      if (project && project.milestones.length > 0) {
        const sum = project.milestones.reduce((acc, m) => acc + m.completionPercentage, 0);
        const projectCompletionPercentage = sum / project.milestones.length;

        const arr = mentorProjectsMap[intern.mentorId] || [];
        arr.push(projectCompletionPercentage);
        mentorProjectsMap[intern.mentorId] = arr;
      }
    }
  }

  const averageAttendancePercentage = activeWithDatesCount > 0
    ? roundPercentage(totalActiveAttendanceSum / activeWithDatesCount)
    : 100.00;

  // 4. Mentor Performance Summary
  const mentorPerformanceSummary = mentors.map(m => {
    const assignedCount = mentorInternCountMap[m.id] || 0;
    const projectPercentages = mentorProjectsMap[m.id] || [];
    const avgProjectCompletion = projectPercentages.length > 0
      ? roundPercentage(projectPercentages.reduce((a, b) => a + b, 0) / projectPercentages.length)
      : 0.00;

    return {
      mentorName: `${m.firstName} ${m.lastName}`,
      assignedInternCount: assignedCount,
      averageProjectCompletionPercentage: avgProjectCompletion,
    };
  });

  return {
    activeInternCount: activeCount,
    completedInternshipCount: completedCount,
    averageAttendancePercentage,
    collegeStats,
    mentorPerformanceSummary,
    internshipCompletionRate,
  };
}
