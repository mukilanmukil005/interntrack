// =============================================================================
// File: frontend/src/components/admin/MilestoneModal.tsx
// Purpose: Dialog modal for creating or editing project milestones
// =============================================================================

import React, { useState, useEffect } from 'react';
import type { Milestone, CreateMilestonePayload } from '../../services/project.service';
import { X, Calendar, Type, FileText, CheckCircle2 } from 'lucide-react';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateMilestonePayload) => Promise<void>;
  milestone?: Milestone | null; // If present, we are editing
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  milestone,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load milestone details when in edit mode
  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || '');
      // Ensure date is formatted YYYY-MM-DD
      const formattedDate = milestone.dueDate.substring(0, 10);
      setDueDate(formattedDate);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
    }
    setError(null);
  }, [milestone, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Milestone title is required');
      return;
    }
    if (!dueDate.trim()) {
      setError('Due date is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateMilestonePayload = {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        dueDate: dueDate.trim(),
      };
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message || 'Failed to save milestone.');
      } else {
        setError('Failed to save milestone. Check input formats.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              {milestone ? 'Edit Milestone' : 'Add Project Milestone'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/30 text-rose-300 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          
          {/* Milestone Title */}
          <div>
            <label htmlFor="m-title" className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-2">
              Milestone Title
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Type className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                id="m-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Database schema setup & seed scripts"
                className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-550 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="m-desc" className="block text-[10px] font-bold text-slate-355 uppercase tracking-widest mb-2">
              Description / Scope (Optional)
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 pointer-events-none">
                <FileText className="h-4 w-4 text-slate-500" />
              </div>
              <textarea
                id="m-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of deliverables, expected API coverage, and testing criteria."
                className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-550 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              ></textarea>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="m-due" className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-2">
              Target Due Date
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="date"
                id="m-due"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                milestone ? 'Update Milestone' : 'Create Milestone'
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
export default MilestoneModal;
