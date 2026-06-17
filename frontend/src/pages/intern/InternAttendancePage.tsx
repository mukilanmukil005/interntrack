// =============================================================================
// File: frontend/src/pages/intern/InternAttendancePage.tsx
// Purpose: Check-in/out workspace controls, active sessions timer, history logs
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  getAttendanceSummary,
  getAttendanceHistory,
  checkIn,
  checkOut
} from '../../services/intern.service';
import type { AttendanceSummary, AttendanceRecord } from '../../services/intern.service';
import {
  Play,
  Square,
  AlertCircle,
  FileSpreadsheet,
  Hourglass,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const InternAttendancePage: React.FC = () => {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Timer states
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  const loadSummary = async () => {
    try {
      const sumData = await getAttendanceSummary();
      setSummary(sumData);
      setError(null);
      return sumData;
    } catch (err) {
      console.error(err);
      setError('Could not download your attendance report.');
      return null;
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const histData = await getAttendanceHistory({ page, limit });
      const normalizedData = (histData.data ?? []).map((rec) => ({
        ...rec,
        hoursWorked: rec.hoursWorked !== null ? Number(rec.hoursWorked || 0) : null,
      }));
      setHistory(normalizedData);
      setTotalPages(histData.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await loadSummary();
    await loadHistory();
    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!loading) {
      void loadHistory();
    }
  }, [page]);

  // Live timer logic
  useEffect(() => {
    const todayRec = summary?.todayRecord;
    const isCheckedIn = summary?.currentlyCheckedIn;

    if (isCheckedIn && todayRec?.checkIn) {
      const startTime = new Date(todayRec.checkIn).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diff);
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [summary]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      await checkIn();
      await loadSummary();
      await loadHistory();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Check-in failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      await checkOut();
      await loadSummary();
      await loadHistory();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Check-out failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatElapsed = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Loading attendance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white">Attendance Access Error</h4>
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

  const isCheckedIn = summary?.currentlyCheckedIn ?? false;
  const todayRecord = summary?.todayRecord;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Attendance Portal
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform check-in actions, track daily working sessions, and review total logged internship hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Session Clock-in Portal */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[350px]">
          {/* Decorative background circle */}
          <div
            className={`absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${
              isCheckedIn ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          />

          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest mb-6">
            Workforce Logger
          </h3>

          {/* Digital Timer */}
          <div className="space-y-1.5 mb-6">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {isCheckedIn ? 'Active Work Session' : 'Shift Inactive'}
            </span>
            <div
              className={`text-4xl font-mono font-extrabold tracking-wider ${
                isCheckedIn ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
              }`}
            >
              {isCheckedIn ? formatElapsed(elapsedSeconds) : '00:00:00'}
            </div>
            {isCheckedIn && todayRecord && (
              <span className="text-[10px] text-slate-500 block">
                Checked in at {formatTime(todayRecord.checkIn)}
              </span>
            )}
          </div>

          {/* Action Trigger Button */}
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="h-28 w-28 rounded-full bg-emerald-650 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-emerald-950/40 border-4 border-slate-950 hover:border-emerald-700/20 flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              <Play className="h-5 w-5 fill-current" />
              Check In
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="h-28 w-28 rounded-full bg-rose-650 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-rose-950/40 border-4 border-slate-950 hover:border-rose-700/20 flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              <Square className="h-5 w-5 fill-current" />
              Check Out
            </button>
          )}

          {/* Additional details underneath button */}
          <div className="mt-8 text-xs text-slate-450 max-w-[200px]">
            {!isCheckedIn
              ? 'Make sure to clock in when you begin your learning activities for the day.'
              : 'Remember to check out when you finish to finalize your logged working hours.'}
          </div>
        </div>

        {/* Right Column: Metrics Dashboard Summary */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Overview Status
              </span>
              <h4 className="text-2xl font-extrabold text-white">
                {summary?.attendancePercentage ?? 0}%
              </h4>
              <p className="text-xs text-slate-450 leading-relaxed pt-1">
                Completed {summary?.presentDays ?? 0} active days out of {summary?.totalDays ?? 0}{' '}
                cohort requirements.
              </p>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${summary?.attendancePercentage ?? 0}%` }}
              />
            </div>
          </div>

          <div className="p-5.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Accumulated Hours
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-500 block uppercase">Completed</span>
                <span className="text-lg font-extrabold text-slate-200">
                  {summary?.completedHours ?? 0} hrs
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-500 block uppercase">Remaining</span>
                <span className="text-lg font-extrabold text-emerald-450">
                  {summary?.remainingHours ?? 0} hrs
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between font-semibold">
              <span>Program Requirement:</span>
              <span className="text-slate-350">{summary?.requiredHours ?? 0} Hours</span>
            </div>
          </div>

          {/* Large text info row */}
          <div className="sm:col-span-2 p-5.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl text-xs space-y-2">
            <span className="font-bold text-slate-300 block flex items-center gap-1.5">
              <Hourglass className="h-4 w-4 text-emerald-450" /> Shift Structure & Time Tracking
            </span>
            <p className="text-slate-450 leading-relaxed">
              Attendance percentages are calculated based on registered PRESENT and HALF_DAY status indicators. Daily targets are evaluated dynamically from checked hours. Submitting activity logs requires checking in on the target work dates.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Historical Logs */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-450" />
          Attendance History
        </h3>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[300px] flex flex-col justify-between relative">
          {historyLoading && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="h-6 w-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
                  <th className="px-6 py-4">Status Indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50 text-sm">
                {history.length > 0 ? (
                  history.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-905/40 transition-colors">
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
                        {rec.hoursWorked !== null ? `${(Number(rec.hoursWorked) || 0).toFixed(2)}h` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                            rec.status === 'PRESENT'
                              ? 'text-emerald-450 bg-emerald-950/30 border-emerald-900/20'
                              : 'text-amber-400 bg-amber-950/30 border-amber-900/20'
                          }`}
                        >
                          {rec.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-550">
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
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-350 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-350 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 disabled:cursor-not-allowed transition-all"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternAttendancePage;
