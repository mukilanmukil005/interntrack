// =============================================================================
// File: frontend/src/pages/mentor/MentorInternsPage.tsx
// Purpose: Display assigned interns' academic overview with search capabilities
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getMentorSummary } from '../../services/mentor.service';
import type { MentorInternSummary } from '../../services/mentor.service';
import { AlertCircle, Search, Users } from 'lucide-react';

export const MentorInternsPage: React.FC = () => {
  const [interns, setInterns] = useState<MentorInternSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter search queries
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await getMentorSummary();
      setInterns(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch assigned interns summary details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, []);

  const filteredInterns = interns.filter((intern) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      intern.name.toLowerCase().includes(q) ||
      intern.email.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-100">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-400">Loading intern records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 text-rose-300 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white text-base">Error Loading Interns</h4>
          <p className="text-sm mt-1 leading-relaxed">{error}</p>
          <button 
            onClick={() => void fetchSummary()}
            className="mt-3.5 px-3 py-1.5 rounded-lg bg-rose-900/40 border border-rose-800 text-xs font-semibold text-white hover:bg-rose-900/60"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Assigned Interns</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse overall details, log metrics, and check active attendance ratios for your students.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search interns by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400">
          Showing {filteredInterns.length} of {interns.length} Interns
        </div>
      </div>

      {/* Interns Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-900/55 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                <th className="px-6 py-4">Intern Details</th>
                <th className="px-6 py-4 text-center">Attendance %</th>
                <th className="px-6 py-4 text-center">Syllabus Completion %</th>
                <th className="px-6 py-4 text-center">Daily Logs Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 text-sm">
              {filteredInterns.length > 0 ? (
                filteredInterns.map((intern) => (
                  <tr key={intern.internId} className="hover:bg-slate-900/50 transition-colors">
                    
                    {/* Name & Email Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {intern.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{intern.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{intern.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Attendance percentage indicator */}
                    <td className="px-6 py-4 text-center">
                      <div>
                        <span className={`font-extrabold text-sm ${
                          intern.attendancePercentage < 75 ? 'text-rose-400 font-bold' : 'text-slate-200'
                        }`}>
                          {intern.attendancePercentage}%
                        </span>
                        <div className="w-24 h-1.5 bg-slate-950 rounded-full mx-auto mt-2 overflow-hidden border border-slate-850">
                          <div 
                            className={`h-full rounded-full ${
                              intern.attendancePercentage < 75 ? 'bg-rose-500' : 'bg-indigo-550'
                            }`}
                            style={{ width: `${intern.attendancePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Project Completion percentage */}
                    <td className="px-6 py-4 text-center">
                      <div>
                        <span className="font-extrabold text-indigo-400 text-sm">
                          {intern.projectCompletionPercentage}%
                        </span>
                        <div className="w-24 h-1.5 bg-slate-950 rounded-full mx-auto mt-2 overflow-hidden border border-slate-850">
                          <div 
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${intern.projectCompletionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Submitted reports counter */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center font-extrabold px-2.5 py-1 rounded bg-slate-950 border border-slate-850 text-slate-350 text-xs">
                        {intern.reportsSubmittedCount} Logs
                      </span>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="h-8 w-8 text-slate-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-400">No interns found</p>
                        <p className="text-xs text-slate-500 mt-1">There are no records matching your query.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default MentorInternsPage;
