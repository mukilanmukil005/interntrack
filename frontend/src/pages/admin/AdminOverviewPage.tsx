// =============================================================================
// File: frontend/src/pages/admin/AdminOverviewPage.tsx
// Purpose: Main Admin Dashboard Overview displaying platform analytics
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getAdminOverview } from '../../services/analytics.service';
import type { AdminOverviewData } from '../../services/analytics.service';
import { StatsCard } from '../../components/admin/StatsCard';
import { Users, CheckCircle2, Percent, UsersRound, Award, BookOpen, AlertCircle } from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const overview = await getAdminOverview();
        setData(overview);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch analytics. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    void fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-100">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-400">Loading system analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 text-rose-300 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white text-base">Connection Error</h4>
          <p className="text-sm mt-1 leading-relaxed">
            {error || 'An unexpected error occurred while loading dashboard statistics.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3.5 px-3 py-1.5 rounded-lg bg-rose-900/40 border border-rose-800 text-xs font-semibold text-white hover:bg-rose-900/60"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Find max count in colleges for relative progress calculations
  const maxCollegeCount = Math.max(...data.collegeStats.map(c => c.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">System Overview</h1>
        <p className="text-sm text-slate-400 mt-1">
          Dynamic progress summaries aggregated from active attendance logs and mentor evaluations.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Interns"
          value={data.activeInternCount}
          icon={<Users className="h-5 w-5" />}
          description="Interns checking in and completing daily reports."
          trend={`${data.activeInternCount} Active`}
          trendColor="green"
        />
        <StatsCard
          title="Completed Internships"
          value={data.completedInternshipCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          description="Syllabus targets achieved and validated."
          trend="Completed"
          trendColor="neutral"
        />
        <StatsCard
          title="Attendance Rate"
          value={`${data.averageAttendancePercentage}%`}
          icon={<Percent className="h-5 w-5" />}
          description="System-wide average check-in rate."
          trend="Computed"
          trendColor="neutral"
        />
        <StatsCard
          title="Syllabus Completion"
          value={`${data.internshipCompletionRate}%`}
          icon={<Award className="h-5 w-5" />}
          description="Internship completion success rate."
          trend="Aggregated"
          trendColor="neutral"
        />
      </div>

      {/* Main Breakdown Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: College Breakdown progress indicators */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">College Distribution</h3>
            </div>
            
            <div className="space-y-4">
              {data.collegeStats.length > 0 ? (
                data.collegeStats.map((collegeStat, idx) => {
                  const pct = Math.round((collegeStat.count / maxCollegeCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">{collegeStat.college}</span>
                        <span className="font-bold text-indigo-400">{collegeStat.count} Interns</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                        <div 
                          className="h-full bg-indigo-550 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 py-6 text-center">No college statistics available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Mentor Performance Summary Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <UsersRound className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Mentor Performance Summary</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-450 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Mentor Name</th>
                    <th className="pb-3 px-4 text-center">Assigned Interns</th>
                    <th className="pb-3 pl-4 text-right">Avg Project Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50 text-slate-300">
                  {data.mentorPerformanceSummary.length > 0 ? (
                    data.mentorPerformanceSummary.map((mentor, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/20">
                        <td className="py-3 pr-4 font-semibold text-slate-200">{mentor.mentorName}</td>
                        <td className="py-3 px-4 text-center font-bold">{mentor.assignedInternCount}</td>
                        <td className="py-3 pl-4 text-right font-extrabold text-indigo-400">
                          {mentor.averageProjectCompletionPercentage}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-500">
                        No mentor assignments recorded in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default AdminOverviewPage;
