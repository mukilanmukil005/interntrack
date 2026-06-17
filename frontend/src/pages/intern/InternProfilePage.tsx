// =============================================================================
// File: frontend/src/pages/intern/InternProfilePage.tsx
// Purpose: Intern profile details view with logout confirmation controls
// =============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  User as UserIcon,
  Mail,
  Shield,
  LogOut,
  KeyRound,
  CalendarDays,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Clock,
  CheckCircle2
} from 'lucide-react';

const formatDate = (iso: string | undefined): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-850 hover:border-slate-700 transition-colors">
    <div className="mt-0.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-200 break-words">{value}</p>
    </div>
  </div>
);

export const InternProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      setSigningOut(false);
    }
  };

  const initials =
    user
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      : 'IN';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          View your academic domain, training schedule, and session information.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar + Name */}
        <div className="flex items-center gap-5 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-emerald-950/50 flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </h2>
            <span className="inline-flex mt-1.5 items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-900/30">
              <Shield className="h-3 w-3" />
              Intern Track
            </span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-3">
          <InfoRow
            icon={<UserIcon className="h-4 w-4" />}
            label="Full Name"
            value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
          />
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Email Address"
            value={user?.email ?? '—'}
          />
          <InfoRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="College / Institution"
            value={user?.internProfile?.college || 'Not Assigned'}
          />
          <InfoRow
            icon={<Briefcase className="h-4 w-4" />}
            label="Specialization Domain"
            value={user?.internProfile?.domain || 'Not Assigned'}
          />
          <InfoRow
            icon={<Clock className="h-4 w-4" />}
            label="Required Program Hours"
            value={`${user?.internProfile?.requiredHrs ?? 0} Hours`}
          />
          <InfoRow
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Internship Status"
            value={
              <span className="uppercase font-bold text-xs text-emerald-400">
                {user?.internProfile?.status || 'PENDING'}
              </span>
            }
          />
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Internship Term"
            value={
              user?.internProfile?.startDate
                ? `${formatDate(user.internProfile.startDate)} — ${formatDate(user.internProfile.endDate)}`
                : '—'
            }
          />
          <InfoRow
            icon={<KeyRound className="h-4 w-4" />}
            label="Account ID"
            value={
              <span className="font-mono text-xs text-slate-400 select-all">
                {user?.id ?? '—'}
              </span>
            }
          />
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Member Since"
            value={formatDate(user?.createdAt)}
          />
        </div>
      </div>

      {/* Session Management */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 mb-1">Session Management</h3>
        <p className="text-xs text-slate-500 mb-6">
          You are currently signed in as an Intern. Signing out will end your session and redirect you to the login page.
        </p>

        {!logoutConfirm ? (
          <button
            id="intern-profile-signout-btn"
            onClick={() => setLogoutConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-900/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-900/50 font-semibold text-sm transition-all focus:outline-none"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300 font-medium">
                Are you sure you want to sign out? Your session will be terminated.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="intern-profile-signout-confirm-btn"
                onClick={() => void handleLogout()}
                disabled={signingOut}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
              >
                {signingOut ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Yes, Sign Out
                  </>
                )}
              </button>
              <button
                id="intern-profile-signout-cancel-btn"
                onClick={() => setLogoutConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-semibold text-sm transition-all focus:outline-none"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternProfilePage;
