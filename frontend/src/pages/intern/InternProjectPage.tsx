// =============================================================================
// File: frontend/src/pages/intern/InternProjectPage.tsx
// Purpose: View assigned project metadata, status, milestones, and repositories
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyProject } from '../../services/intern.service';
import type { Project } from '../../services/intern.service';
import {
  FolderGit2,
  Calendar,
  ExternalLink,
  BookOpen,
  TrendingUp,
  MessageSquare,
  FileText,
  AlertCircle,
  Clock,
  ListTodo
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const InternProjectPage: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await getMyProject();
        setProject(data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        // If 404 or other project-not-found errors occur, show helpful assigned message
        if (err.response?.status === 404) {
          setProject(null);
        } else {
          setError('Could not fetch project details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    void loadProject();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Loading project detail...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white">Error Loading Project</h4>
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
        <FolderGit2 className="h-12 w-12 text-slate-600 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-200">No Project Assigned</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Your internship workspace has not been assigned a specific development project yet. Please check back later or contact your mentor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
              {project.domain}
            </span>
            <span
              className={`text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded border ${
                project.status === 'COMPLETED'
                  ? 'text-emerald-450 bg-emerald-950/40 border-emerald-900/30'
                  : project.status === 'IN_PROGRESS'
                  ? 'text-sky-400 bg-sky-950/40 border-sky-900/30'
                  : project.status === 'ON_HOLD'
                  ? 'text-amber-400 bg-amber-950/40 border-amber-900/30'
                  : 'text-slate-400 bg-slate-800/40 border-slate-700/30'
              }`}
            >
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            {project.title}
          </h1>
        </div>

        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 self-start md:self-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:text-white hover:border-slate-700 text-xs font-semibold transition-all focus:outline-none"
          >
            Repository Link <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Project Description, Details, Mentor Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Description */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-emerald-400" />
              Project Details
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Term Period</span>
                  <span className="text-slate-300 font-semibold">
                    {formatDate(project.startDate)} — {formatDate(project.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Overall Completion</span>
                  <span className="text-slate-300 font-semibold">{project.completionPercentage}% Complete</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mentor Notes */}
          {project.mentorNotes && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-emerald-450" />
                Mentor Feedback & Notes
              </h3>
              <div className="p-4.5 rounded-xl bg-slate-950 border border-slate-850">
                <p className="text-sm text-slate-350 italic leading-relaxed whitespace-pre-wrap">
                  "{project.mentorNotes}"
                </p>
              </div>
            </div>
          )}

          {/* Milestones timeline */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <ListTodo className="h-4.5 w-4.5 text-emerald-450" />
                Milestones & Timeline
              </h3>
              <Link
                to="/intern/progress"
                className="text-xs font-semibold text-emerald-450 hover:underline"
              >
                Update Progress
              </Link>
            </div>

            {project.milestones && project.milestones.length > 0 ? (
              <div className="relative border-l border-slate-800 ml-3.5 pl-6.5 space-y-6">
                {project.milestones
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((m) => {
                    const isCompleted = m.status === 'COMPLETED';
                    const isInProgress = m.status === 'IN_PROGRESS';
                    return (
                      <div key={m.id} className="relative group">
                        {/* Timeline dot icon */}
                        <div
                          className={`absolute -left-[37px] top-0.5 h-5 w-5 rounded-full border-4 flex items-center justify-center ${
                            isCompleted
                              ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                              : isInProgress
                              ? 'bg-slate-950 border-emerald-550/40 text-emerald-500'
                              : 'bg-slate-950 border-slate-800 text-slate-650'
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isInProgress
                                ? 'bg-emerald-400'
                                : 'bg-slate-700'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <h4 className="font-semibold text-slate-250 group-hover:text-slate-100 transition-colors">
                              {m.title}
                            </h4>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                              <Clock className="h-3 w-3" /> Due {formatDate(m.dueDate)}
                            </span>
                          </div>

                          {m.description && (
                            <p className="text-xs text-slate-450 mt-1 max-w-xl leading-relaxed">
                              {m.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2.5">
                            {/* Status badge */}
                            <span
                              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                isCompleted
                                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'
                                  : isInProgress
                                  ? 'text-sky-400 bg-sky-950/40 border-sky-900/30'
                                  : 'text-slate-400 bg-slate-800/40 border-slate-700/30'
                              }`}
                            >
                              {m.status.replace('_', ' ')}
                            </span>

                            {/* Mini progress indicator */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-bold">
                                {m.completionPercentage}% Complete
                              </span>
                              <div className="h-1.5 w-16 bg-slate-850 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${m.completionPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Mentor specific feedback */}
                          {m.mentorFeedback && (
                            <div className="mt-3 p-3 bg-slate-900/80 border border-slate-850 rounded-xl">
                              <span className="block text-[9px] font-bold text-slate-500 uppercase">
                                Mentor Note
                              </span>
                              <p className="text-xs text-slate-350 italic mt-0.5">
                                "{m.mentorFeedback}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-center py-6 text-xs text-slate-500">
                No milestones defined for this project.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Key Stats, Fast File Access */}
        <div className="space-y-6">
          {/* Key Stats Block */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-200">Execution Progress</h3>
            
            <div className="space-y-4.5">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                  <span>Development Completion</span>
                  <span className="text-emerald-400 font-bold">{project.completionPercentage}%</span>
                </div>
                <div className="h-2.5 bg-slate-955 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-550"
                    style={{ width: `${project.completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Total Milestones</span>
                  <span className="text-base font-extrabold text-slate-200">
                    {project.milestones?.length ?? 0}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Completed</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {project.milestones?.filter((m) => m.status === 'COMPLETED').length ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Files */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200">Project Files</h3>
              <Link
                to="/intern/files"
                className="text-xs font-semibold text-emerald-450 hover:underline"
              >
                Manage Files
              </Link>
            </div>

            {project.files && project.files.length > 0 ? (
              <div className="space-y-2.5">
                {project.files.map((f) => (
                  <a
                    key={f.id}
                    href={f.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all group"
                  >
                    <FileText className="h-4.5 w-4.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    <span className="flex-grow truncate font-medium">{f.fileName}</span>
                    <ExternalLink className="h-3 w-3 text-slate-550 flex-shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-550 text-xs">
                No uploaded files. Link documentation and deliverable assets in the files portal.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternProjectPage;
