// =============================================================================
// File: frontend/src/pages/mentor/MentorOverviewPage.tsx
// Purpose: Mentor Dashboard main landing overview with quick analytics and activity logs
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getMentorSummary, getMentorInterventions, getMentorPendingReports } from '../../services/mentor.service';
import type { MentorInterventionItem, DailyReport } from '../../services/mentor.service';
import { StatsCard } from '../../components/admin/StatsCard';
import { Users, CheckSquare, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MentorOverviewPage: React.FC = () => {
  const [internCount, setInternCount] = useState<number>(0);
  const [interventionCount, setInterventionCount] = useState<number>(0);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [recentReports, setRecentReports] = useState<DailyReport[]>([]);
  const [interventions, setInterventions] = useState<MentorInterventionItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        const [summary, flagged, reports] = await Promise.all([
          getMentorSummary(),
          getMentorInterventions(),
          getMentorPendingReports({ page: 1, limit: 5 })
        ]);

        setInternCount(summary.length);
        setInterventionCount(flagged.length);
        setInterventions(flagged);
        setPendingReportsCount(reports.pagination.total);
        setRecentReports(reports.data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load mentor overview analytics.');
      } finally {
        setLoading(false);
      }
    };
    void fetchOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-100">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-400">Loading overview statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 text-rose-300 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white text-base">Overview Error</h4>
          <p className="text-sm mt-1 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3.5 px-3 py-1.5 rounded-lg bg-rose-900/40 border border-rose-800 text-xs font-semibold text-white hover:bg-rose-900/60"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Mentor Evaluation Hub</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor assigned intern progress, audit daily learning outcomes, and flag intervention cases.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Assigned Interns"
          value={internCount}
          icon={<Users className="h-5 w-5" />}
          description="Interns currently allocated for evaluation."
          trend="Assigned"
          trendColor="neutral"
        />
        <StatsCard
          title="Pending Daily Reports"
          value={pendingReportsCount}
          icon={<CheckSquare className="h-5 w-5" />}
          description="Daily logs awaiting mentor evaluation."
          trend={`${pendingReportsCount} Pending`}
          trendColor={pendingReportsCount > 0 ? 'green' : 'neutral'}
        />
        <StatsCard
          title="Interventions Flagged"
          value={interventionCount}
          icon={<AlertCircle className="h-5 w-5" />}
          description="Interns below attendance or milestone thresholds."
          trend="Alerts Active"
          trendColor={interventionCount > 0 ? 'red' : 'neutral'}
        />
      </div>

      {/* Main Grid: Pending Action Items and Intervention Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Card: Recent activity - Pending daily reports */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Recent Intern Activity</h3>
              </div>
              {pendingReportsCount > 5 && (
                <Link 
                  to="/mentor/reports" 
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-305 transition-colors font-bold"
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="space-y-4">
              {recentReports.length > 0 ? (
                recentReports.map((report) => (
                  <div 
                    key={report.id} 
                    className="p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                        {report.intern?.user.firstName} {report.intern?.user.lastName}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{report.taskTitle}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{report.taskDesc}</p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500">
                        <span>Date: {report.date}</span>
                        <span>•</span>
                        <span>Hours: {report.hoursWorked} hrs</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-500">No pending reports awaiting review.</p>
                  <Link 
                    to="/mentor/reports" 
                    className="mt-2 inline-block text-xs font-semibold text-indigo-400 hover:underline"
                  >
                    Manage Daily Logs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Intervention Alerts */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                <AlertCircle className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Intervention Candidates</h3>
            </div>

            <div className="space-y-4">
              {interventions.length > 0 ? (
                interventions.map((flagged) => (
                  <div 
                    key={flagged.internId}
                    className="p-4 rounded-xl bg-slate-950 border border-rose-900/30/80 bg-rose-950/5/20 flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{flagged.name}</h4>
                        <span className="text-xs text-slate-500">{flagged.email}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/30">
                        Action Required
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-850">
                        <span className="text-[10px] text-slate-450 block font-semibold uppercase tracking-wider mb-0.5">Attendance</span>
                        <span className={`font-bold ${flagged.attendancePercentage < 75 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {flagged.attendancePercentage}%
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-850">
                        <span className="text-[10px] text-slate-450 block font-semibold uppercase tracking-wider mb-0.5">Project Complete</span>
                        <span className="font-bold text-slate-350">{flagged.projectCompletionPercentage}%</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-slate-400">Intervention Reasons:</span>
                      <ul className="list-disc pl-4 text-slate-400 space-y-0.5">
                        {flagged.reasons.map((reason, idx) => (
                          <li key={idx} className="text-rose-300/90">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-sm">Excellent! No interns currently flagged for interventions.</p>
                  <p className="text-xs mt-1">Syllabus completions and check-ins match guidelines.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default MentorOverviewPage;
