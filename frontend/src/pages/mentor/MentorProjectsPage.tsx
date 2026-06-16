// =============================================================================
// File: frontend/src/pages/mentor/MentorProjectsPage.tsx
// Purpose: View assigned intern projects and review milestone progress / completion
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getMentorInternProjects, reviewMilestone } from '../../services/mentor.service';
import { getProjectById } from '../../services/project.service';
import type { Project } from '../../services/project.service';
import { 
  FolderGit2, 
  Calendar, 
  GitFork, 
  Eye, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Check
} from 'lucide-react';

interface Toast {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export const MentorProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Search filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected project for details drawer
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Milestone review form states
  const [reviewingMilestoneId, setReviewingMilestoneId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'COMPLETED' | 'IN_PROGRESS'>('COMPLETED');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // UI status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await getMentorInternProjects({
        page,
        limit,
        status: statusFilter || undefined,
      });

      // Client-side text search (title, domain, intern name)
      let data = res.data;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        data = res.data.filter((p) => 
          p.title.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q) ||
          (p.intern && `${p.intern.user.firstName} ${p.intern.user.lastName}`.toLowerCase().includes(q))
        );
      }

      setProjects(data);
      setTotal(res.pagination.total);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch assigned intern projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchProjects();
  };

  const handleLoadDetails = async (projectId: string) => {
    try {
      const detailed = await getProjectById(projectId);
      setSelectedProject(detailed);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch project milestone details.', 'error');
    }
  };

  const handleSubmitMilestoneReview = async (milestoneId: string) => {
    if (!selectedProject) return;
    setSubmittingReview(true);
    try {
      await reviewMilestone(selectedProject.id, milestoneId, {
        status: reviewStatus,
        mentorFeedback: reviewFeedback.trim() ? reviewFeedback.trim() : null
      });

      addToast('Milestone evaluation review submitted successfully.', 'success');
      
      // Reset form states
      setReviewingMilestoneId(null);
      setReviewFeedback('');
      
      // Auto refresh views
      void handleLoadDetails(selectedProject.id);
      void fetchProjects();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error?.message || 'Failed to submit milestone review.';
      addToast(msg, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/40 text-blue-400 border border-blue-900/30">
            In Progress
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/40 text-amber-400 border border-amber-900/30">
            On Hold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 text-slate-400 border border-slate-700/30">
            Not Started
          </span>
        );
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      {/* Toast alert system */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
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
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            )}
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Project Milestones</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track syllabus progress guidelines, evaluate target deadlines, and review milestone submissions.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            placeholder="Search projects, domains, or interns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-semibold">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      {error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-300 text-sm flex gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-100">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-medium text-slate-400">Loading intern projects...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between min-h-[350px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/55 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-4">Project / Domain</th>
                  <th className="px-6 py-4">Assigned Intern</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Progress</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50 text-sm">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                            <FolderGit2 className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 line-clamp-1">{project.title}</div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">{project.domain}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {project.intern ? (
                          <div>
                            <div className="font-semibold text-slate-250">
                              {project.intern.user.firstName} {project.intern.user.lastName}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[180px]">{project.intern.college}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          <span>{project.startDate.substring(0, 10)} to {project.endDate.substring(0, 10)}</span>
                        </div>
                        {project.repoUrl && (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-450 hover:text-indigo-300 transition-colors mt-1 font-semibold"
                          >
                            <GitFork className="h-3 w-3" />
                            Repository Link
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center w-full max-w-[120px] mx-auto">
                          <div className="flex justify-between w-full text-xs font-bold text-indigo-400 mb-1">
                            <span>{project.completionPercentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${project.completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => void handleLoadDetails(project.id)}
                          className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 text-xs font-semibold ml-auto"
                        >
                          <Eye className="h-4 w-4" />
                          Evaluate Milestones
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      No intern projects assigned in this database scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-850 flex items-center justify-between gap-4 text-xs font-semibold text-slate-400 bg-slate-900/30">
              <span>
                Showing page <span className="text-slate-200">{page}</span> of <span className="text-slate-200">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 rounded-lg text-slate-350"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 rounded-lg text-slate-350"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Side-Drawer Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => {
              setSelectedProject(null);
              setReviewingMilestoneId(null);
            }}
          ></div>

          {/* Drawer container panel */}
          <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto z-10 shadow-2xl p-6 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-6 border-b border-slate-850">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                    Project Milestones Scope
                  </span>
                  <h3 className="text-xl font-bold text-white mt-3 leading-tight">
                    {selectedProject.title}
                  </h3>
                  <p className="text-xs text-slate-450 mt-1 font-semibold">
                    Intern: {selectedProject.intern?.user.firstName} {selectedProject.intern?.user.lastName} ({selectedProject.intern?.college})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setReviewingMilestoneId(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-450 hover:text-slate-100 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scope details */}
              <div className="py-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">Scope Description</h4>
                  <p className="text-xs text-slate-350 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-850">
                    {selectedProject.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-450 block mb-1 uppercase tracking-wider font-bold text-[9px]">Timeline Dates</span>
                    <span className="text-slate-200 font-semibold">{selectedProject.startDate.substring(0, 10)} to {selectedProject.endDate.substring(0, 10)}</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-450 block mb-1 uppercase tracking-wider font-bold text-[9px]">Completion Progress</span>
                    <span className="text-indigo-400 font-extrabold text-sm">{selectedProject.completionPercentage}% Complete</span>
                  </div>
                </div>

                {/* Milestones list section */}
                <div className="pt-4 border-t border-slate-850">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-4">Milestones Evaluation</h4>
                  
                  <div className="space-y-4">
                    {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                      selectedProject.milestones.map((milestone) => {
                        const isUnderReview = reviewingMilestoneId === milestone.id;
                        return (
                          <div 
                            key={milestone.id} 
                            className="p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-colors space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {milestone.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-450 flex-shrink-0" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                  )}
                                  <span className="font-semibold text-slate-200 text-sm leading-tight">
                                    {milestone.title}
                                  </span>
                                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/20 px-1.5 py-0.5 rounded border border-indigo-900/10">
                                    {milestone.completionPercentage}%
                                  </span>
                                </div>
                                {milestone.description && (
                                  <p className="text-xs text-slate-400 leading-relaxed pr-6">
                                    {milestone.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[10px]">
                                  <span className="text-slate-450 font-semibold">
                                    Due Date: {milestone.dueDate.substring(0, 10)}
                                  </span>
                                  {milestone.mentorFeedback && (
                                    <span className="text-slate-450 font-semibold flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3 text-indigo-400" />
                                      Feedback: <span className="text-slate-300 italic">"{milestone.mentorFeedback}"</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Review Action Trigger Button */}
                              {!isUnderReview && (
                                <button
                                  onClick={() => {
                                    setReviewingMilestoneId(milestone.id);
                                    setReviewStatus(milestone.status === 'COMPLETED' ? 'COMPLETED' : 'COMPLETED');
                                    setReviewFeedback(milestone.mentorFeedback || '');
                                  }}
                                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 hover:border-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                                >
                                  Evaluate
                                </button>
                              )}
                            </div>

                            {/* Milestone Inline Review Form */}
                            {isUnderReview && (
                              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-3 animate-in slide-in-from-top-1.5 duration-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                                    Submit Milestone Review
                                  </span>
                                  <button 
                                    onClick={() => setReviewingMilestoneId(null)}
                                    className="text-slate-400 hover:text-slate-200"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                      Evaluation Status
                                    </label>
                                    <select
                                      value={reviewStatus}
                                      onChange={(e) => setReviewStatus(e.target.value as any)}
                                      className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-slate-200 text-xs focus:outline-none"
                                    >
                                      <option value="COMPLETED">Approve (Completed)</option>
                                      <option value="IN_PROGRESS">Request Revision (In Progress)</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                    Evaluation Feedback
                                  </label>
                                  <textarea
                                    rows={2}
                                    placeholder="Enter milestone evaluation notes / comments..."
                                    value={reviewFeedback}
                                    onChange={(e) => setReviewFeedback(e.target.value)}
                                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-550 text-xs focus:outline-none resize-none"
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setReviewingMilestoneId(null)}
                                    className="px-3 py-1.5 rounded border border-slate-800 hover:bg-slate-850 text-[10px] font-bold text-slate-450 uppercase transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submittingReview}
                                    onClick={() => void handleSubmitMilestoneReview(milestone.id)}
                                    className="px-3.5 py-1.5 rounded bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 transition-all"
                                  >
                                    {submittingReview ? (
                                      <>
                                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Submitting
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3.5 w-3.5" />
                                        Submit
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6 bg-slate-950 rounded-xl border border-slate-850">
                        No milestones defined for this project.
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default MentorProjectsPage;
