// =============================================================================
// File: frontend/src/pages/admin/AdminProjectsPage.tsx
// Purpose: Manage projects, milestones, and details for interns
// =============================================================================

import React, { useState, useEffect } from 'react';
import type { Project, Milestone } from '../../services/project.service';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  createMilestone, 
  updateMilestone, 
  deleteMilestone 
} from '../../services/project.service';
import { ProjectsTable } from '../../components/admin/ProjectsTable';
import { MilestoneModal } from '../../components/admin/MilestoneModal';
import { 
  Plus, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3
} from 'lucide-react';

export const AdminProjectsPage: React.FC = () => {
  // Lists & pagination
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Search and filter inputs
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // UI state loadings
  const [error, setError] = useState<string | null>(null);

  // Modal control states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  
  // Milestone modal state
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<Milestone | null>(null);

  // Delete milestone confirmation dialog state
  const [deleteMilestoneConfirmOpen, setDeleteMilestoneConfirmOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(null);

  // Project Forms state
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDomain, setProjDomain] = useState('');
  const [projStartDate, setProjStartDate] = useState('');
  const [projEndDate, setProjEndDate] = useState('');
  const [projInternId, setProjInternId] = useState('');
  const [projRepoUrl, setProjRepoUrl] = useState('');
  const [projStatus, setProjStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'>('NOT_STARTED');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchProjectsList = async () => {
    try {
      const res = await getProjects({
        page,
        limit,
        status: statusFilter || undefined,
      });
      
      // Clientside search filter for project title, domain, or intern name
      let filtered = res.data;
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        filtered = res.data.filter(p => 
          p.title.toLowerCase().includes(query) || 
          p.domain.toLowerCase().includes(query) ||
          (p.intern && (p.intern.user.firstName + ' ' + p.intern.user.lastName).toLowerCase().includes(query))
        );
      }

      setProjects(filtered);
      setTotal(res.pagination.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects. Please check connection.');
    }
  };

  useEffect(() => {
    void fetchProjectsList();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchProjectsList();
  };

  // ── Project Details view loader ──────────────────────────────────────────────
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleLoadDetails = async (project: Project) => {
    try {
      const detailed = await getProjectById(project.id);
      setSelectedProject(detailed);
    } catch (err: any) {
      console.error(err);
      alert('Failed to load project details.');
    }
  };

  // ── Project Create action ───────────────────────────────────────────────────
  const openCreateModal = () => {
    setProjTitle('');
    setProjDesc('');
    setProjDomain('');
    setProjStartDate('');
    setProjEndDate('');
    setProjInternId('');
    setProjRepoUrl('');
    setFormError(null);
    setCreateModalOpen(true);
  };

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!projTitle.trim() || !projDesc.trim() || !projDomain.trim() || !projStartDate.trim() || !projEndDate.trim() || !projInternId.trim()) {
      setFormError('All fields marked * are required.');
      return;
    }

    setFormSubmitting(true);
    try {
      await createProject({
        title: projTitle.trim(),
        description: projDesc.trim(),
        domain: projDomain.trim(),
        startDate: projStartDate.trim(),
        endDate: projEndDate.trim(),
        internId: projInternId.trim(),
        repoUrl: projRepoUrl.trim() ? projRepoUrl.trim() : null,
      });
      setCreateModalOpen(false);
      void fetchProjectsList();
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error.message || 'Failed to create project.');
      } else {
        setFormError('Failed to create project. Verify Intern Profile UUID exists and has no other projects assigned.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Project Edit action ─────────────────────────────────────────────────────
  const openEditModal = (project: Project) => {
    setProjectToEdit(project);
    setProjTitle(project.title);
    setProjDesc(project.description);
    setProjDomain(project.domain);
    setProjStartDate(project.startDate.substring(0, 10));
    setProjEndDate(project.endDate.substring(0, 10));
    setProjInternId(project.internId);
    setProjRepoUrl(project.repoUrl || '');
    setProjStatus(project.status);
    setFormError(null);
    setEditProjectModalOpen(true);
  };

  const handleEditProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToEdit) return;
    setFormError(null);

    setFormSubmitting(true);
    try {
      await updateProject(projectToEdit.id, {
        title: projTitle.trim(),
        description: projDesc.trim(),
        domain: projDomain.trim(),
        startDate: projStartDate.trim(),
        endDate: projEndDate.trim(),
        internId: projInternId.trim(),
        repoUrl: projRepoUrl.trim() ? projRepoUrl.trim() : null,
        status: projStatus,
      });
      setEditProjectModalOpen(false);
      void fetchProjectsList();
      if (selectedProject?.id === projectToEdit.id) {
        void handleLoadDetails(projectToEdit);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error.message || 'Failed to update project.');
      } else {
        setFormError('Failed to update project. Verify input parameters.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Milestone CRUD actions ──────────────────────────────────────────────────
  const openAddMilestone = () => {
    setMilestoneToEdit(null);
    setMilestoneModalOpen(true);
  };

  const openEditMilestone = (milestone: Milestone) => {
    setMilestoneToEdit(milestone);
    setMilestoneModalOpen(true);
  };

  const handleMilestoneSubmit = async (payload: any) => {
    if (!selectedProject) return;

    if (milestoneToEdit) {
      // Edit mode
      await updateMilestone(selectedProject.id, milestoneToEdit.id, payload);
    } else {
      // Create mode
      await createMilestone(selectedProject.id, payload);
    }
    
    // Refresh parent project details to update metrics
    void handleLoadDetails(selectedProject);
    void fetchProjectsList();
  };

  const openDeleteMilestoneConfirm = (milestone: Milestone) => {
    setMilestoneToDelete(milestone);
    setDeleteMilestoneConfirmOpen(true);
  };

  const handleDeleteMilestoneSubmit = async () => {
    if (!selectedProject || !milestoneToDelete) return;
    try {
      await deleteMilestone(selectedProject.id, milestoneToDelete.id);
      setDeleteMilestoneConfirmOpen(false);
      setMilestoneToDelete(null);
      void handleLoadDetails(selectedProject);
      void fetchProjectsList();
    } catch (err) {
      console.error(err);
      alert('Failed to delete milestone.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Project Allocations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Assign structural project guidelines, coordinate target due dates, and audit progress indicators.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4.5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all text-xs focus:outline-none"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Project
        </button>
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

      {/* Error / Table container */}
      {error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-300 text-sm flex gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : (
        <ProjectsTable
          projects={projects}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onViewDetails={handleLoadDetails}
          onEdit={openEditModal}
        />
      )}

      {/* Project Details Modal / Drawer */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setSelectedProject(null)}
          ></div>

          {/* Drawer container panel */}
          <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto z-10 shadow-2xl p-6 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-6 border-b border-slate-850">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                    Project Details
                  </span>
                  <h3 className="text-xl font-bold text-white mt-3 leading-tight">
                    {selectedProject.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Domain: {selectedProject.domain}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 rounded-lg text-slate-450 hover:text-slate-100 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Details Body */}
              <div className="py-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description Scope</h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-850">
                    {selectedProject.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-450 block mb-1 uppercase tracking-wider font-bold text-[9px]">Timeline Dates</span>
                    <span className="text-slate-200 font-semibold">{selectedProject.startDate} to {selectedProject.endDate}</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-450 block mb-1 uppercase tracking-wider font-bold text-[9px]">Completion Progress</span>
                    <span className="text-indigo-400 font-extrabold text-sm">{selectedProject.completionPercentage}% Complete</span>
                  </div>
                </div>

                {/* Milestones list section */}
                <div className="pt-4 border-t border-slate-850">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Milestones</h4>
                    <button
                      onClick={openAddMilestone}
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-305 focus:outline-none"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Milestone
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                      selectedProject.milestones.map((milestone) => (
                        <div 
                          key={milestone.id} 
                          className="p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-colors flex items-start justify-between gap-3 group"
                        >
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
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/20 px-1 rounded">
                                {milestone.completionPercentage}%
                              </span>
                            </div>
                            
                            {milestone.description && (
                              <p className="text-xs text-slate-400 leading-relaxed pr-6">
                                {milestone.description}
                              </p>
                            )}
                            
                            <div className="flex gap-4 pt-1.5">
                              <span className="text-[10px] text-slate-450 font-medium">
                                Due: {milestone.dueDate.substring(0, 10)}
                              </span>
                              {milestone.mentorFeedback && (
                                <span className="text-[10px] text-indigo-450 truncate max-w-[250px]" title={milestone.mentorFeedback}>
                                  Feedback: {milestone.mentorFeedback}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditMilestone(milestone)}
                              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 transition-all"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteMilestoneConfirm(milestone)}
                              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-450 hover:border-rose-500/20 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6 bg-slate-950 rounded-xl border border-slate-850">
                        No milestones defined. Click Add Milestone to map targets.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)}></div>
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-4">
              <h3 className="text-lg font-bold text-white">Allocate Intern Project</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100"><X className="h-4.5 w-4.5" /></button>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. InternTrack System Dashboard"
                  className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Scope Description *</label>
                <textarea
                  required
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Scope of work details..."
                  className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Domain *</label>
                  <input
                    type="text"
                    required
                    value={projDomain}
                    onChange={(e) => setProjDomain(e.target.value)}
                    placeholder="Web / Cloud / DevOps"
                    className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Intern Profile UUID *</label>
                  <input
                    type="text"
                    required
                    value={projInternId}
                    onChange={(e) => setProjInternId(e.target.value)}
                    placeholder="Enter valid UUID"
                    className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={projStartDate}
                    onChange={(e) => setProjStartDate(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">End Date *</label>
                  <input
                    type="date"
                    required
                    value={projEndDate}
                    onChange={(e) => setProjEndDate(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Repository URL (Optional)</label>
                <input
                  type="url"
                  value={projRepoUrl}
                  onChange={(e) => setProjRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 border border-slate-800 rounded-xl hover:bg-slate-850 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditProjectModalOpen(false)}></div>
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-4">
              <h3 className="text-lg font-bold text-white">Edit Project Meta</h3>
              <button onClick={() => setEditProjectModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100"><X className="h-4.5 w-4.5" /></button>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Project Title</label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Scope Description</label>
                <textarea
                  required
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Domain</label>
                  <input
                    type="text"
                    required
                    value={projDomain}
                    onChange={(e) => setProjDomain(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Project Status</label>
                  <select
                    value={projStatus}
                    onChange={(e) => setProjStatus(e.target.value as any)}
                    className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-855 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={projStartDate}
                    onChange={(e) => setProjStartDate(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={projEndDate}
                    onChange={(e) => setProjEndDate(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5">Repository URL</label>
                <input
                  type="url"
                  value={projRepoUrl}
                  onChange={(e) => setProjRepoUrl(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                <button type="button" onClick={() => setEditProjectModalOpen(false)} className="px-4 py-2 border border-slate-800 rounded-xl hover:bg-slate-855 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal Add/Edit */}
      <MilestoneModal
        isOpen={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        onSubmit={handleMilestoneSubmit}
        milestone={milestoneToEdit}
      />

      {/* Delete Milestone Confirmation Dialog */}
      {deleteMilestoneConfirmOpen && milestoneToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/85" onClick={() => setDeleteMilestoneConfirmOpen(false)}></div>
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="flex justify-center text-rose-500 mb-4">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Milestone</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to permanently delete the milestone <span className="font-semibold text-slate-200">"{milestoneToDelete.title}"</span>? This action is irreversible.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setDeleteMilestoneConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-850 text-xs font-semibold text-slate-300"
              >
                No, Keep it
              </button>
              <button
                onClick={handleDeleteMilestoneSubmit}
                className="px-4 py-2 rounded-xl bg-rose-650 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminProjectsPage;
