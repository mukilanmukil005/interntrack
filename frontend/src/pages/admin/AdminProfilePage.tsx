// =============================================================================
// File: frontend/src/pages/admin/AdminProfilePage.tsx
// Purpose: Administrator profile page — displays account info and provides sign out
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
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO date string to a human-readable date. */
const formatDate = (iso: string | undefined): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-850 hover:border-slate-700 transition-colors">
    <div className="mt-0.5 p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex-shrink-0">
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const AdminProfilePage: React.FC = () => {
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
      : 'AD';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Administrator account information and session controls.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar + name */}
        <div className="flex items-center gap-5 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-950/50 flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </h2>
            <span className="inline-flex mt-1 items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/40 px-2.5 py-0.5 rounded border border-indigo-900/30">
              <Shield className="h-3 w-3" />
              Administrator
            </span>
          </div>
        </div>

        {/* Info rows */}
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
            icon={<Shield className="h-4 w-4" />}
            label="Access Role"
            value="Administrator"
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
            value={formatDate((user as any)?.createdAt)}
          />
        </div>
      </div>

      {/* Session Management */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 mb-1">Session</h3>
        <p className="text-xs text-slate-500 mb-6">
          You are currently signed in as an Administrator. Signing out will end your session
          and redirect you to the login page.
        </p>

        {!logoutConfirm ? (
          <button
            id="admin-profile-signout-btn"
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
                id="admin-profile-signout-confirm-btn"
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
                id="admin-profile-signout-cancel-btn"
                onClick={() => setLogoutConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-semibold text-sm transition-all focus:outline-none"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-850 flex items-start gap-3">
        <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Profile details are read-only in this interface and reflect the data stored in the
          InternTrack database. Contact your system administrator to update credentials or
          personal information.
        </p>
      </div>

    </div>
  );
};

export default AdminProfilePage;
