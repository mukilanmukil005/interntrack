// =============================================================================
// File: frontend/src/pages/intern/InternReportsPage.tsx
// Purpose: Daily logs overview, status filtering, and report submission portal
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getMyReports, submitReport } from '../../services/intern.service';
import type { DailyReport, SubmitReportPayload } from '../../services/intern.service';
import {
  FileText,
  Plus,
  AlertCircle,
  FileDown,
  ChevronDown,
  ChevronUp,
  Calendar,
  X,
  Upload,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const InternReportsPage: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // New report form state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [hoursWorked, setHoursWorked] = useState(8);
  const [learning, setLearning] = useState('');
  const [challenges, setChallenges] = useState('');
  const [attachment, setAttachment] = useState<File | undefined>(undefined);

  // Expandable report cards
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await getMyReports(params);
      setReports(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve daily logs. Please check server connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, [page, statusFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDesc || !learning || !challenges) {
      setFormError('Please fill out all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      setFormWarning(null);

      const payload: SubmitReportPayload = {
        date,
        taskTitle,
        taskDesc,
        hoursWorked,
        learning,
        challenges,
      };

      const res = await submitReport(payload, attachment);
      
      if (res.warning) {
        setFormWarning(res.warning);
        // Do not close immediately so they see the warning
        // Refresh list
        void fetchReports();
      } else {
        // Success
        setShowModal(false);
        // Reset form
        setDate(new Date().toISOString().split('T')[0]);
        setTaskTitle('');
        setTaskDesc('');
        setHoursWorked(8);
        setLearning('');
        setChallenges('');
        setAttachment(undefined);
        // Refresh
        setPage(1);
        void fetchReports();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to submit report. Ensure details are correct.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Daily Activity Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit achievements, log hours, record learnings, and track feedback evaluations.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition-all focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          Submit Daily Log
        </button>
      </div>

      {/* Filters & Count bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-850">
        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-emerald-600/15 text-emerald-450 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Total Logs: <span className="text-slate-300">{total}</span>
        </span>
      </div>

      {/* Main content list */}
      {error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-300 text-sm flex gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : loading && reports.length === 0 ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => {
              const isExpanded = expandedIds[r.id] ?? false;
              return (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                          <Calendar className="h-3 w-3" /> {formatDate(r.date)} · {r.hoursWorked} hrs
                        </span>
                        <h3 className="font-bold text-slate-200 text-sm mt-1 line-clamp-1">
                          {r.taskTitle}
                        </h3>
                      </div>

                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex-shrink-0 ${
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

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {r.taskDesc}
                    </p>

                    {isExpanded && (
                      <div className="space-y-3.5 pt-3 border-t border-slate-850 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">
                            Key Learnings
                          </span>
                          <p className="text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                            {r.learning}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">
                            Challenges Faced
                          </span>
                          <p className="text-slate-350 mt-1 leading-relaxed whitespace-pre-wrap">
                            {r.challenges}
                          </p>
                        </div>

                        {r.attachmentUrl && (
                          <div className="pt-1">
                            <a
                              href={r.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-emerald-450 hover:border-emerald-500/35 transition-colors"
                            >
                              <FileDown className="h-3.5 w-3.5" /> Download Attachment
                            </a>
                          </div>
                        )}

                        {r.mentorComment && (
                          <div className="p-3 bg-slate-950 border border-emerald-950/40 rounded-xl">
                            <span className="text-[9px] font-bold text-emerald-450 uppercase block">
                              Mentor Feedback
                            </span>
                            <p className="text-slate-300 italic mt-1 leading-relaxed">
                              "{r.mentorComment}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleExpand(r.id)}
                    className="mt-4 flex items-center justify-center gap-1 w-full py-1.5 border border-slate-850 hover:border-slate-700 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-slate-450 hover:text-slate-200 transition-colors focus:outline-none"
                  >
                    {isExpanded ? (
                      <>
                        Collapse Detail <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Expand Detail <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination control */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-slate-850 text-xs font-semibold text-slate-500">
              <span>
                Page <span className="text-slate-300">{page}</span> of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 disabled:cursor-not-allowed transition-all"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <FileText className="h-10 w-10 text-slate-650 mx-auto mb-3 opacity-40" />
          <p className="text-slate-450 text-sm">No activity reports submitted for this filter.</p>
        </div>
      )}

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-850 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-450">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-bold text-white text-base">Submit Daily Activity Log</h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormWarning(null);
                  setFormError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-950/30 border border-rose-900/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-450 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formWarning && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-900/30 text-amber-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-450 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Report Lodged with Warnings:</span>
                    <span>{formWarning}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setFormWarning(null);
                      }}
                      className="mt-2 text-[10px] font-extrabold uppercase bg-amber-900/40 border border-amber-800 hover:bg-amber-905 px-2 py-1 rounded text-white"
                    >
                      Acknowledge & Close
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                    Date of Work *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                    Hours Worked *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="16"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(parseInt(e.target.value) || 8)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement authentication pages flow"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize the core tasks executed today..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                  Key Learnings *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="What new concepts, tools, or patterns did you gain today?"
                  value={learning}
                  onChange={(e) => setLearning(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                  Challenges Faced *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe roadblocks, logic bugs, or pending queries..."
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Attachment File Input */}
              {!formWarning && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                    Optional Attachment (PDF, Image, Archive)
                  </label>
                  <div className="border border-dashed border-slate-800 rounded-xl p-4.5 bg-slate-950 flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-400">
                      {attachment ? attachment.name : 'Select document file to attach'}
                    </span>
                    <input
                      type="file"
                      id="report-attachment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="report-attachment"
                      className="mt-2.5 cursor-pointer px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
                    >
                      Browse Files
                    </label>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              {!formWarning && (
                <div className="pt-2 border-t border-slate-850 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4.5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs font-semibold focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                  >
                    {submitting ? (
                      <>
                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternReportsPage;
