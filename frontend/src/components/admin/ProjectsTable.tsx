// =============================================================================
// File: frontend/src/components/admin/ProjectsTable.tsx
// Purpose: Paginated list showing intern projects with status & progress metrics
// =============================================================================

import React from 'react';
import type { Project } from '../../services/project.service';
import { FolderGit2, Calendar, GitFork, Eye, Edit3, ArrowLeft, ArrowRight } from 'lucide-react';

interface ProjectsTableProps {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onViewDetails: (project: Project) => void;
  onEdit: (project: Project) => void;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  total,
  page,
  limit,
  onPageChange,
  onViewDetails,
  onEdit,
}) => {
  const totalPages = Math.ceil(total / limit) || 1;

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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between min-h-[400px]">
      
      {/* Scrollable Container */}
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
                  
                  {/* Title & Domain */}
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

                  {/* Intern profile info */}
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

                  {/* Start/End dates */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{project.startDate} to {project.endDate}</span>
                    </div>
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-450 hover:text-indigo-300 transition-colors mt-1 font-semibold"
                      >
                        <GitFork className="h-3 w-3" />
                        Repository
                      </a>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4">{getStatusBadge(project.status)}</td>

                  {/* Progress bar */}
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

                  {/* Table Row Action Panel */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetails(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="View Details & Milestones"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => onEdit(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-450 hover:bg-indigo-500/10 transition-colors"
                        title="Edit Project"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  No active projects found. Create a project to begin tracking milestones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-850 flex items-center justify-between gap-4 text-xs font-semibold text-slate-400 bg-slate-900/30">
        <span>
          Showing page <span className="text-slate-200">{page}</span> of <span className="text-slate-200">{totalPages}</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 rounded-lg text-slate-350 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 rounded-lg text-slate-350 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
export default ProjectsTable;
