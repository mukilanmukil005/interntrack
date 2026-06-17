// =============================================================================
// File: frontend/src/pages/intern/InternOverviewPage.tsx
// Purpose: Intern dashboard landing — attendance %, project completion, reports,
//          upcoming milestones, and recent activity feed.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getAttendanceSummary,
  getMyProject,
  getMyReports,
} from '../../services/intern.service';
import type { AttendanceSummary, DailyReport, Project } from '../../services/intern.service';
import { StatsCard } from '../../components/admin/StatsCard';
import {
  CalendarCheck,
  TrendingUp,
  FileText,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const InternOverviewPage: React.FC = () => {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [att, proj, reps] = await Promise.all([
          getAttendanceSummary().catch(() => null),
          getMyProject().catch(() => null),
          getMyReports({ page: 1, limit: 5 }).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0, hasNext: false, hasPrev: false } })),
        ]);

        setAttendance(att);
        setProject(proj);
        setReports(reps.data);
        setReportTotal(reps.pagination.total);

        // Count reports awaiting mentor feedback
        const pendingRes = await getMyReports({ status: 'PENDING', limit: 1 }).catch(() => ({ pagination: { total: 0, page: 1, limit: 1, totalPages: 0, hasNext: false, hasPrev: false }, data: [] }));
        setPendingFeedback(pendingRes.pagination.total);

        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load overview data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Loading your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white">Overview Error</h4>
          <p className="text-sm text-rose-300 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1.5 rounded-lg bg-rose-900/40 border border-rose-800 text-xs font-semibold text-white hover:bg-rose-900/60"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Upcoming milestones — PENDING or IN_PROGRESS, sorted by dueDate
  const upcomingMilestones = (project?.milestones ?? [])
    .filter((m) => m.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Here's your internship snapshot for today.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Attendance"
          value={`${attendance?.attendancePercentage ?? 0}%`}
          icon={<CalendarCheck className="h-5 w-5" />}
          description={`${attendance?.presentDays ?? 0} present / ${attendance?.totalDays ?? 0} total days`}
          trend={attendance?.currentlyCheckedIn ? 'Checked In' : 'Not Checked In'}
          trendColor={attendance?.currentlyCheckedIn ? 'green' : 'neutral'}
        />
        <StatsCard
          title="Project Completion"
          value={`${project?.completionPercentage ?? 0}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          description={project ? project.title : 'No project assigned'}
          trend={project?.status ?? '—'}
          trendColor="neutral"
        />
        <StatsCard
          title="Reports Submitted"
          value={reportTotal}
          icon={<FileText className="h-5 w-5" />}
          description="Total daily logs submitted"
          trend="Lifetime"
          trendColor="neutral"
        />
        <StatsCard
          title="Awaiting Feedback"
          value={pendingFeedback}
          icon={<MessageSquare className="h-5 w-5" />}
          description="Reports pending mentor review"
          trend={pendingFeedback > 0 ? 'Pending' : 'All Reviewed'}
          trendColor={pendingFeedback > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Milestones */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-200">Upcoming Milestones</h3>
            </div>
            <Link
              to="/intern/progress"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingMilestones.length > 0 ? (
            <div className="space-y-3">
              {upcomingMilestones.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-200 line-clamp-1">{m.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Due {formatDate(m.dueDate)}</p>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex-shrink-0 ${
                        m.status === 'IN_PROGRESS'
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'
                          : 'text-slate-400 bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{m.completionPercentage}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${m.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {project ? 'All milestones are completed! 🎉' : 'No project assigned yet.'}
              </p>
              {!project && (
                <p className="text-xs mt-1">Contact your administrator to get started.</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-200">Recent Activity</h3>
            </div>
            <Link
              to="/intern/reports"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              All Reports <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{r.taskTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(r.date)} · {r.hoursWorked}h</p>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex-shrink-0 ${
                        r.status === 'APPROVED'
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'
                          : r.status === 'REJECTED'
                          ? 'text-rose-400 bg-rose-950/40 border-rose-900/30'
                          : 'text-amber-400 bg-amber-950/40 border-amber-900/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reports submitted yet.</p>
              <Link
                to="/intern/reports"
                className="mt-2 inline-block text-xs font-semibold text-indigo-400 hover:underline"
              >
                Submit Your First Report
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternOverviewPage;
