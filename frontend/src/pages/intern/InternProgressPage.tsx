// =============================================================================
// File: frontend/src/pages/intern/InternProgressPage.tsx
// Purpose: Interactive control to update milestone completion percentages
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getMyProject, updateMilestoneProgress } from '../../services/intern.service';
import type { Project, Milestone } from '../../services/intern.service';
import {
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  MessageSquare
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const InternProgressPage: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track edits locally before saving
  // maps milestoneId -> completionPercentage
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  // maps milestoneId -> boolean (isSaving)
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  // Success states
  const [successIds, setSuccessIds] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMyProject();
      setProject(data);
      if (data.milestones) {
        // Sort milestones by due date
        const sorted = [...data.milestones].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        setMilestones(sorted);
        // Initialize editing state
        const initialEdits: Record<string, number> = {};
        sorted.forEach((m) => {
          initialEdits[m.id] = m.completionPercentage;
        });
        setEditValues(initialEdits);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setProject(null);
      } else {
        setError('Failed to load project milestones.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSliderChange = (milestoneId: string, value: number) => {
    setEditValues((prev) => ({
      ...prev,
      [milestoneId]: value,
    }));
    // Clear success message when user edits again
    if (successIds[milestoneId]) {
      setSuccessIds((prev) => ({ ...prev, [milestoneId]: false }));
    }
  };

  const handleSaveProgress = async (milestoneId: string) => {
    const pct = editValues[milestoneId];
    if (pct === undefined) return;

    try {
      setSavingIds((prev) => ({ ...prev, [milestoneId]: true }));
      const updatedMilestone = await updateMilestoneProgress(milestoneId, pct);
      
      // Update local milestones state
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? updatedMilestone : m))
      );

      // Trigger success confirmation
      setSuccessIds((prev) => ({ ...prev, [milestoneId]: true }));
      setTimeout(() => {
        setSuccessIds((prev) => ({ ...prev, [milestoneId]: false }));
      }, 4000);

      // Refresh overall project details (since overall percentage might have changed)
      const freshProj = await getMyProject().catch(() => null);
      if (freshProj) {
        setProject(freshProj);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update milestone progress. Please check connection and try again.');
    } finally {
      setSavingIds((prev) => ({ ...prev, [milestoneId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Loading tracking dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white">Tracking Error</h4>
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

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4 bg-slate-900 border border-slate-800 rounded-3xl mt-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-200">No Project Assigned</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Your milestones will display here as soon as a project is assigned by your mentor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Milestone Tracking
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Provide status updates to your mentor by adjusting development completion indicators.
        </p>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones list with slider updates */}
        <div className="lg:col-span-2 space-y-4">
          {milestones.length > 0 ? (
            milestones.map((m) => {
              const currentVal = editValues[m.id] ?? m.completionPercentage;
              const isSaving = savingIds[m.id] ?? false;
              const isSuccess = successIds[m.id] ?? false;
              const hasChanged = currentVal !== m.completionPercentage;

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-250">{m.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>Due {formatDate(m.dueDate)}</span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border self-start ${
                        m.status === 'COMPLETED'
                          ? 'text-emerald-450 bg-emerald-950/40 border-emerald-900/30'
                          : m.status === 'IN_PROGRESS'
                          ? 'text-sky-400 bg-sky-950/40 border-sky-900/30'
                          : 'text-slate-400 bg-slate-800/40 border-slate-700/30'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Interactive Slider */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
                        <Sliders className="h-3.5 w-3.5 text-slate-650" /> Completion Ratio
                      </span>
                      <span className="text-emerald-400 font-bold text-sm">{currentVal}%</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={currentVal}
                        onChange={(e) => handleSliderChange(m.id, parseInt(e.target.value))}
                        disabled={isSaving}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      />

                      <button
                        onClick={() => handleSaveProgress(m.id)}
                        disabled={!hasChanged || isSaving}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all focus:outline-none ${
                          hasChanged
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isSaving ? (
                          <>
                            <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            Update
                          </>
                        )}
                      </button>
                    </div>

                    {isSuccess && (
                      <p className="text-[10px] text-emerald-400 font-semibold animate-fade-in flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3" /> Progress updated successfully.
                      </p>
                    )}
                  </div>

                  {/* Mentor feedback note if available */}
                  {m.mentorFeedback && (
                    <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-xl flex gap-2">
                      <MessageSquare className="h-4 w-4 text-emerald-450 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">
                          Mentor Feedback
                        </span>
                        <p className="text-xs text-slate-350 italic mt-0.5">
                          "{m.mentorFeedback}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center py-10 text-slate-500">
              No milestones defined for this project.
            </p>
          )}
        </div>

        {/* Sidebar Project Overall Stats */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-200">Execution Overview</h3>
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-xs text-slate-550 block mb-0.5">Project</span>
              <span className="font-bold text-slate-200 block text-sm line-clamp-1">
                {project.title}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Calculated Completion</span>
                <span className="text-emerald-400 font-bold">
                  {project.completionPercentage}%
                </span>
              </div>
              <div className="h-2 bg-slate-955 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${project.completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="text-[9px] font-bold text-slate-550 block uppercase">
                  Milestones
                </span>
                <span className="text-xl font-extrabold text-slate-200 mt-1 block">
                  {milestones.length}
                </span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="text-[9px] font-bold text-slate-550 block uppercase">
                  Finished
                </span>
                <span className="text-xl font-extrabold text-emerald-450 mt-1 block">
                  {milestones.filter((m) => m.status === 'COMPLETED').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternProgressPage;
