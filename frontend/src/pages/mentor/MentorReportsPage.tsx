// =============================================================================
// File: frontend/src/pages/mentor/MentorReportsPage.tsx
// Purpose: Manage evaluation review queue for daily reports submitted by interns
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getMentorPendingReports, reviewReport } from '../../services/mentor.service';
import type { DailyReport } from '../../services/mentor.service';
import { AlertCircle, CheckCircle2, XCircle, FileText, Calendar, Clock, Download, RefreshCw } from 'lucide-react';

interface Toast {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export const MentorReportsPage: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Status filter: PENDING or APPROVED or REJECTED
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review states mapped by report ID
  const [comments, setComments] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Local Toast States
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getMentorPendingReports({ 
        page, 
        limit, 
        status: statusFilter 
      });
      setReports(res.data);
      setTotal(res.pagination.total);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch daily reports queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, [page, statusFilter]);

  const handleReviewAction = async (reportId: string, action: 'approve' | 'reject') => {
    setActioningId(reportId);
    try {
      const comment = comments[reportId] || '';
      await reviewReport(reportId, { 
        action, 
        mentorComment: comment.trim() ? comment.trim() : null 
      });
      
      addToast(
        `Report successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
        'success'
      );
      
      // Clear comment for this card
      setComments((prev) => {
        const copy = { ...prev };
        delete copy[reportId];
        return copy;
      });

      // Refresh list
      void fetchReports();
      // Dispatch storage event to alert topbar of badge updates
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error?.message || `Failed to submit review action.`;
      addToast(msg, 'error');
    } finally {
      setActioningId(null);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      {/* Toast alerts container */}
      <div className="fixed top-4 right-4 z-50 space-y-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`p-4 rounded-xl border shadow-2xl flex items-center gap-3 transition-all transform animate-in slide-in-from-right duration-300 pointer-events-auto ${
              t.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-900/60 text-emerald-300' 
                : 'bg-rose-950/90 border-rose-900/60 text-rose-300'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            )}
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Daily Intern Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review logged hours, assess challenge notes, and provide feedback on daily outcomes.
          </p>
        </div>

        <button 
          onClick={() => void fetchReports()}
          className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
          Refresh Queue
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
          <button
            onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Awaiting Review
          </button>
          <button
            onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Approved Logs
          </button>
          <button
            onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rejected Logs
          </button>
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          Total logs in queue: <span className="text-slate-200">{total}</span>
        </div>
      </div>

      {/* Reports body container */}
      {error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-300 text-sm flex gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-100">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-medium text-slate-400">Loading daily log list...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div 
                key={report.id} 
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-6 justify-between relative overflow-hidden"
              >
                {/* Decorative left indicator based on status */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                  report.status === 'APPROVED' 
                    ? 'bg-emerald-500' 
                    : report.status === 'REJECTED' 
                    ? 'bg-rose-500' 
                    : 'bg-indigo-550'
                }`} />

                {/* Main Information Panel */}
                <div className="flex-grow space-y-4 min-w-0 pl-1">
                  
                  {/* Top intern name details */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">
                        Intern Profile
                      </span>
                      <h3 className="text-lg font-bold text-slate-200 mt-1">
                        {report.intern?.user.firstName} {report.intern?.user.lastName}
                      </h3>
                      <span className="text-xs text-slate-400">{report.intern?.user.email}</span>
                    </div>
                  </div>

                  {/* Dynamic logged meta parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-2 text-slate-350">
                      <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span>Log Date: <strong className="text-slate-250 font-semibold">{report.date}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-350">
                      <Clock className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span>Time Logged: <strong className="text-slate-250 font-semibold">{report.hoursWorked} hrs</strong></span>
                    </div>
                    {report.attachmentUrl && (
                      <div className="flex items-center gap-2 text-indigo-400 col-span-2 sm:col-span-1">
                        <Download className="h-4 w-4 flex-shrink-0" />
                        <a 
                          href={`http://localhost:5000${report.attachmentUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-bold hover:underline truncate"
                        >
                          View Attachment File
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Task scope */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Task Title</span>
                    <h4 className="text-sm font-bold text-slate-200">{report.taskTitle}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/60">
                      {report.taskDesc}
                    </p>
                  </div>

                  {/* Outcomes & Challenges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Learning Outcomes</span>
                      <p className="text-xs text-slate-350 leading-relaxed bg-slate-950/20 p-3 rounded-lg border border-slate-850/50">
                        {report.learning}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Challenges Met</span>
                      <p className="text-xs text-slate-350 leading-relaxed bg-slate-950/20 p-3 rounded-lg border border-slate-850/50">
                        {report.challenges}
                      </p>
                    </div>
                  </div>

                  {/* Review feedback displayed if already evaluated */}
                  {report.status !== 'PENDING' && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 mt-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {report.status === 'APPROVED' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-450" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-455" />
                        )}
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Evaluation Status: {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        <strong className="text-slate-400">Mentor Comment:</strong> {report.mentorComment || 'No feedback comment provided.'}
                      </p>
                      {report.reviewedAt && (
                        <span className="text-[9px] text-slate-500 block mt-2">
                          Evaluated: {new Date(report.reviewedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                </div>

                {/* Right Action panel for Pending evaluations */}
                {report.status === 'PENDING' && (
                  <div className="w-full md:w-72 flex-shrink-0 flex flex-col justify-between p-4.5 rounded-xl bg-slate-950 border border-slate-850 md:mt-0">
                    <div className="space-y-3">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">
                        LOG EVALUATION
                      </span>
                      <textarea
                        rows={3}
                        placeholder="Provide feedback comment for this daily log..."
                        value={comments[report.id] || ''}
                        onChange={(e) => setComments({ ...comments, [report.id]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-550 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                      />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => void handleReviewAction(report.id, 'approve')}
                        disabled={actioningId === report.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-emerald-950/20 transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => void handleReviewAction(report.id, 'reject')}
                        disabled={actioningId === report.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-rose-950/20 transition-all"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
              <FileText className="h-10 w-10 text-slate-650 mx-auto mb-3.5" />
              <p className="text-sm font-semibold text-slate-400">Evaluation queue is empty</p>
              <p className="text-xs text-slate-500 mt-1">There are no reports awaiting review under this filter status.</p>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border border-slate-850 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold text-slate-400 bg-slate-900/30">
              <span>
                Showing page <span className="text-slate-200">{page}</span> of <span className="text-slate-200">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 rounded-xl transition-all"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 rounded-xl transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
export default MentorReportsPage;
