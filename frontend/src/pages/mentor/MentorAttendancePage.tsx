// =============================================================================
// File: frontend/src/pages/mentor/MentorAttendancePage.tsx
// Purpose: Mentor controls for editing/reopening intern attendance logs
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getMentorSummary } from '../../services/mentor.service';
import type { MentorInternSummary } from '../../services/mentor.service';
import {
  getInternAttendanceHistory,
  editInternAttendance,
  reopenInternAttendance,
} from '../../services/mentor.service';
import {
  Calendar,
  Users,
  Edit2,
  RefreshCw,
  AlertCircle,
  X,
  Save,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const toDatetimeLocal = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

export const MentorAttendancePage: React.FC = () => {
  const [interns, setInterns] = useState<MentorInternSummary[]>([]);
  const [selectedInternId, setSelectedInternId] = useState<string>('');
  
  // History & Pagination
  const [records, setRecords] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit record states
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [isCheckOutNull, setIsCheckOutNull] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch interns list
  useEffect(() => {
    const fetchInterns = async () => {
      try {
        setLoading(true);
        const data = await getMentorSummary();
        setInterns(data);
        if (data.length > 0) {
          setSelectedInternId(data[0].internId);
        }
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load assigned interns.');
      } finally {
        setLoading(false);
      }
    };
    void fetchInterns();
  }, []);

  // Fetch selected intern history
  const fetchHistory = async () => {
    if (!selectedInternId) return;
    try {
      setHistoryLoading(true);
      const res = await getInternAttendanceHistory(selectedInternId, { page, limit });
      setRecords(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
      setActionError(null);
    } catch (err) {
      console.error(err);
      setActionError('Failed to retrieve attendance log history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInternId) {
      setPage(1);
      void fetchHistory();
    }
  }, [selectedInternId]);

  useEffect(() => {
    if (selectedInternId) {
      void fetchHistory();
    }
  }, [page]);

  const handleOpenEdit = (rec: any) => {
    setEditingRecord(rec);
    setEditCheckIn(toDatetimeLocal(rec.checkIn));
    setEditCheckOut(toDatetimeLocal(rec.checkOut));
    setIsCheckOutNull(!rec.checkOut);
    setCorrectionReason(rec.correctionReason || '');
    setActionError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !correctionReason.trim()) return;

    try {
      setSubmitting(true);
      setActionError(null);

      const payload = {
        checkIn: new Date(editCheckIn).toISOString(),
        checkOut: isCheckOutNull ? null : new Date(editCheckOut).toISOString(),
        correctionReason,
      };

      await editInternAttendance(editingRecord.id, payload);
      setEditingRecord(null);
      void fetchHistory();
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to edit attendance record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to reopen this attendance record? This clears checkout timestamps and allows the intern to checkout again.')) {
      return;
    }

    try {
      setHistoryLoading(true);
      setActionError(null);
      await reopenInternAttendance(recordId);
      void fetchHistory();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reopen attendance record.');
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Loading intern profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white">Access Error</h4>
          <p className="text-sm text-rose-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Intern Attendance Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review attendance sheets, modify checked timestamps, and reopen shifts for correction.
        </p>
      </div>

      {/* Selector Toolbar */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">
            Select Intern:
          </label>
          <div className="relative">
            <select
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {interns.map((i) => (
                <option key={i.internId} value={i.internId}>
                  {i.name} ({i.email})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </div>

        {totalRecords > 0 && (
          <span className="text-xs text-slate-500 font-semibold">
            Total Records: <span className="text-slate-350">{totalRecords}</span>
          </span>
        )}
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/30 text-rose-300 text-xs flex gap-2">
          <AlertCircle className="h-4 w-4 text-rose-450 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Historical List */}
      <div className="space-y-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[300px] flex flex-col justify-between relative">
          {historyLoading && (
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-4">Logged Date</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                  <th className="px-6 py-4">Hours Logged</th>
                  <th className="px-6 py-4">Correction Notes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50 text-sm">
                {records.length > 0 ? (
                  records.map((rec) => {
                    const isReopened = rec.reopenCount > 0;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-905/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-300">
                          {formatDate(rec.date)}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                          {formatTime(rec.checkIn)}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                          {formatTime(rec.checkOut)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-300">
                          {rec.hoursWorked !== null ? `${Number(rec.hoursWorked).toFixed(2)}h` : '—'}
                          {rec.status && (
                            <span className="ml-2 inline-block text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border text-slate-450 border-slate-800">
                              {rec.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-450 max-w-[200px] truncate" title={rec.correctionReason}>
                          {rec.correctionReason || '—'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all focus:outline-none"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          
                          <button
                            onClick={() => void handleReopen(rec.id)}
                            disabled={isReopened}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all focus:outline-none ${
                              isReopened
                                ? 'bg-slate-900/40 border-slate-850 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-750 text-indigo-400 hover:text-indigo-350'
                            }`}
                            title={isReopened ? 'Maximum 1 reopen per record reached' : 'Clear checkout to allow checking out again'}
                          >
                            <RefreshCw className="h-3 w-3" /> Reopen
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-550">
                      No attendance log records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* History Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-850 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-900/40">
              <span>
                Showing page <span className="text-slate-300">{page}</span> of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-350 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-850 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-350 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-850 disabled:cursor-not-allowed transition-all"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Correction Form Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-850 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-bold text-white text-base">Edit Attendance Record</h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                  Logged Date
                </label>
                <input
                  type="text"
                  disabled
                  value={formatDate(editingRecord.date)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                  Check In Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-slate-450">
                    Check Out Time
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCheckOutNull}
                      onChange={(e) => setIsCheckOutNull(e.target.checked)}
                      className="rounded border-slate-850 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                    Clear check-out
                  </label>
                </div>
                {!isCheckOutNull && (
                  <input
                    type="datetime-local"
                    required
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">
                  Reason for Correction *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Student forgot to check out on time..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-2 border-t border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-750 text-xs font-semibold focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-950/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                >
                  {submitting ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorAttendancePage;
