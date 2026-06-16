// =============================================================================
// File: frontend/src/App.tsx
// Purpose: Main App entry defining public layout routes, protected admin routes, and lazy routing
// =============================================================================

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { RouteGuard } from './layouts/RouteGuard';
import { AdminLayout } from './layouts/AdminLayout';
import { MentorLayout } from './layouts/MentorLayout';
import { useAuth } from './hooks/useAuth';
import { LogOut, GraduationCap } from 'lucide-react';

// ---------------------------------------------------------------------------
// Lazy-loaded Public pages
// ---------------------------------------------------------------------------
const HomePage = React.lazy(() =>
  import('./pages/public/HomePage').then((m) => ({ default: m.HomePage }))
);
const AboutPage = React.lazy(() =>
  import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const ProgramsPage = React.lazy(() =>
  import('./pages/public/ProgramsPage').then((m) => ({ default: m.ProgramsPage }))
);
const ContactPage = React.lazy(() =>
  import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const FaqPage = React.lazy(() =>
  import('./pages/public/FaqPage').then((m) => ({ default: m.FaqPage }))
);
const LoginPage = React.lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

// ---------------------------------------------------------------------------
// Lazy-loaded Admin pages
// ---------------------------------------------------------------------------
const AdminOverviewPage = React.lazy(() =>
  import('./pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage }))
);
const AdminProjectsPage = React.lazy(() =>
  import('./pages/admin/AdminProjectsPage').then((m) => ({ default: m.AdminProjectsPage }))
);
const AdminNotificationsPage = React.lazy(() =>
  import('./pages/admin/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage }))
);
const AdminProfilePage = React.lazy(() =>
  import('./pages/admin/AdminProfilePage').then((m) => ({ default: m.AdminProfilePage }))
);

// ---------------------------------------------------------------------------
// Lazy-loaded Mentor pages
// ---------------------------------------------------------------------------
const MentorOverviewPage = React.lazy(() =>
  import('./pages/mentor/MentorOverviewPage').then((m) => ({ default: m.MentorOverviewPage }))
);
const MentorInternsPage = React.lazy(() =>
  import('./pages/mentor/MentorInternsPage').then((m) => ({ default: m.MentorInternsPage }))
);
const MentorReportsPage = React.lazy(() =>
  import('./pages/mentor/MentorReportsPage').then((m) => ({ default: m.MentorReportsPage }))
);
const MentorProjectsPage = React.lazy(() =>
  import('./pages/mentor/MentorProjectsPage').then((m) => ({ default: m.MentorProjectsPage }))
);
const MentorNotificationsPage = React.lazy(() =>
  import('./pages/mentor/MentorNotificationsPage').then((m) => ({ default: m.MentorNotificationsPage }))
);
const MentorProfilePage = React.lazy(() =>
  import('./pages/mentor/MentorProfilePage').then((m) => ({ default: m.MentorProfilePage }))
);

// Loading Fallback spinner
const LoadingFallback = () => (
  <div className="min-h-[60vh] bg-slate-950 flex flex-col items-center justify-center text-slate-100">
    <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-sm font-medium text-slate-400">Loading page content...</p>
  </div>
);

// Inline Dashboard Placeholders (Clean & Premium looking)
const DashboardWrapper: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; children?: React.ReactNode }> = ({
  title,
  subtitle,
  icon,
  children,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Mini header */}
      <header className="border-b border-slate-900 bg-slate-900/40 py-4 px-6 sm:px-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600/10 rounded-lg border border-indigo-500/20">
            <GraduationCap className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="font-bold text-slate-200 tracking-tight">InternTrack</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-900/30 transition-all duration-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </header>

      {/* Main dashboard content */}
      <main className="flex-grow p-6 sm:p-10 max-w-5xl mx-auto w-full flex flex-col justify-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              {icon}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded border border-indigo-900/30">
                Authorized: {user?.role} Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-3">
                {title}
              </h1>
              <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-850 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Session Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-850">
                <span className="text-xs text-slate-400 block mb-0.5">Signed In User</span>
                <span className="font-semibold text-slate-250">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-850">
                <span className="text-xs text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-semibold text-slate-250">{user?.email}</span>
              </div>
            </div>
            {children}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300">
            Note: This interface represents a routing placeholder. Backend APIs and schemas are fully integrated and secure. Dashboard functionality (Progress Tracking panels, daily review actions, project tasks) will be implemented in subsequent phases.
          </div>
        </div>
      </main>
    </div>
  );
};

// AdminDashboard placeholder removed — replaced by AdminLayout + admin sub-routes below.

// AdminDashboard placeholder removed — replaced by MentorLayout + mentor sub-routes.

const InternDashboard: React.FC = () => (
  <DashboardWrapper
    title="Intern Learning Space"
    subtitle="Track hours logged, submit daily achievement reports, and follow assigned milestones."
    icon={<GraduationCap className="h-8 w-8 text-indigo-400" />}
  >
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-850 text-sm">
      <span className="text-xs text-slate-400 block mb-1">Academic Profile Details</span>
      <div className="space-y-1.5 text-slate-300">
        <p>🏫 <span className="font-medium">College:</span> {useAuth().user?.internProfile?.college || 'Pending Assignment'}</p>
        <p>💻 <span className="font-medium">Domain:</span> {useAuth().user?.internProfile?.domain || 'Pending Assignment'}</p>
        <p>📊 <span className="font-medium">Status:</span> <span className="text-indigo-400 font-bold uppercase">{useAuth().user?.internProfile?.status || 'PENDING'}</span></p>
      </div>
    </div>
  </DashboardWrapper>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Layout Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="programs" element={<ProgramsPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            {/* ---------------------------------------------------------------- */}
            {/* Admin Dashboard — protected, nested under AdminLayout           */}
            {/* ---------------------------------------------------------------- */}
            <Route
              path="/admin"
              element={
                <RouteGuard allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </RouteGuard>
              }
            >
              {/* Index → Overview */}
              <Route index element={<AdminOverviewPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
              {/* Unmatched admin sub-paths → overview */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            {/* ---------------------------------------------------------------- */}
            {/* Mentor Dashboard — protected, nested under MentorLayout         */}
            {/* ---------------------------------------------------------------- */}
            <Route
              path="/mentor"
              element={
                <RouteGuard allowedRoles={['MENTOR']}>
                  <MentorLayout />
                </RouteGuard>
              }
            >
              <Route index element={<MentorOverviewPage />} />
              <Route path="interns" element={<MentorInternsPage />} />
              <Route path="reports" element={<MentorReportsPage />} />
              <Route path="projects" element={<MentorProjectsPage />} />
              <Route path="notifications" element={<MentorNotificationsPage />} />
              <Route path="profile" element={<MentorProfilePage />} />
              {/* Unmatched mentor sub-paths → overview */}
              <Route path="*" element={<Navigate to="/mentor" replace />} />
            </Route>
            <Route
              path="/intern/*"
              element={
                <RouteGuard allowedRoles={['INTERN']}>
                  <InternDashboard />
                </RouteGuard>
              }
            />

            {/* Wildcard fallback to home */}
            <Route path="*" element={<Link to="/" className="hidden" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
