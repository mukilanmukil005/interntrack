// =============================================================================
// File: frontend/src/pages/intern/InternFilesPage.tsx
// Purpose: Project documentation upload manager and file list view
// =============================================================================

import React, { useState, useEffect } from 'react';
import { getMyProject, uploadProjectFile, deleteProjectFile } from '../../services/intern.service';
import type { Project, ProjectFile } from '../../services/intern.service';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  FolderGit2,
  Clock,
  Info
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

export const InternFilesPage: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // File Deletion State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const data = await getMyProject();
      setProject(data);
      setFiles(data.files ?? []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setProject(null);
      } else {
        setError('Could not load project assets. Verify server connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjectData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadSuccess(false);

      const newFile = await uploadProjectFile(project.id, selectedFile, (pct) => {
        setUploadProgress(pct);
      });

      // Update files state
      setFiles((prev) => [newFile, ...prev]);
      setSelectedFile(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setUploadError(
        err.response?.data?.message || 'File upload failed. Ensure file size conforms to limits.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!project) return;
    if (!window.confirm('Are you sure you want to delete this file permanently?')) return;

    try {
      setDeletingId(fileId);
      await deleteProjectFile(project.id, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Loading digital library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/30 max-w-2xl mx-auto flex items-start gap-4 mt-10">
        <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white">Files Error</h4>
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
        <FolderGit2 className="h-12 w-12 text-slate-650 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-200">No Project Assigned</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          File repository will be activated once your project gets initialized and assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Project Deliverables & Files
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload project reports, wireframe layouts, and submit link documentation to your mentor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Drag & Drop File Upload Form */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4 sticky top-6">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Upload className="h-4.5 w-4.5 text-emerald-450" />
              Upload Document
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-950/30 border border-rose-900/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-450 flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 text-emerald-300 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-450 flex-shrink-0 mt-0.5" />
                  <span>File uploaded and linked successfully.</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950 flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-colors">
                <Upload className="h-8 w-8 text-slate-500 mb-2.5" />
                <span className="text-xs text-slate-450 font-medium max-w-[180px] leading-relaxed">
                  {selectedFile ? selectedFile.name : 'Select or drop project document file'}
                </span>
                {selectedFile && (
                  <span className="text-[10px] text-slate-550 mt-1 block">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
                
                <input
                  type="file"
                  id="project-file-input"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                
                <label
                  htmlFor="project-file-input"
                  className="mt-4.5 cursor-pointer px-4.5 py-2.5 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
                >
                  Browse Computer
                </label>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>Uploading deliverable...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-650 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
              >
                <Upload className="h-4.5 w-4.5" />
                Upload File
              </button>
            </form>

            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-start gap-2.5">
              <Info className="h-4 w-4 text-emerald-450 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Attached materials are visible instantly to your mentor. Ensure code assets, reports, or slides do not contain confidential system tokens or environment passwords.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Files List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-200">Shared Documents ({files.length})</h3>
          </div>

          <div className="space-y-3">
            {files.length > 0 ? (
              files.map((file) => (
                <div
                  key={file.id}
                  className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl hover:border-slate-700 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-405 flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{file.fileName}</p>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-1">
                        <Clock className="h-3 w-3" /> Shared {formatDate(file.uploadedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors focus:outline-none"
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </a>

                    <button
                      onClick={() => void handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-950/20 text-rose-450 hover:bg-rose-500/20 hover:border-rose-900/50 transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Delete document"
                    >
                      {deletingId === file.id ? (
                        <span className="h-4 w-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-slate-900 border border-slate-850 rounded-2xl">
                <FileText className="h-10 w-10 text-slate-650 opacity-40 mx-auto mb-3" />
                <p className="text-slate-500 text-xs">No project documents uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternFilesPage;
