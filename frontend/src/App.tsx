// =============================================================================
// File: frontend/src/App.tsx
// Purpose: Main App entry defining public layout routes, protected admin routes, and lazy routing
// =============================================================================

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { RouteGuard } from './layouts/RouteGuard';
import { AdminLayout } from './layouts/AdminLayout';
import { MentorLayout } from './layouts/MentorLayout';
import { InternLayout } from './layouts/InternLayout';

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
const MentorAttendancePage = React.lazy(() =>
  import('./pages/mentor/MentorAttendancePage').then((m) => ({ default: m.MentorAttendancePage }))
);

// ---------------------------------------------------------------------------
// Lazy-loaded Intern pages
// ---------------------------------------------------------------------------
const InternOverviewPage = React.lazy(() =>
  import('./pages/intern/InternOverviewPage').then((m) => ({ default: m.InternOverviewPage }))
);
const InternProjectPage = React.lazy(() =>
  import('./pages/intern/InternProjectPage').then((m) => ({ default: m.InternProjectPage }))
);
const InternProgressPage = React.lazy(() =>
  import('./pages/intern/InternProgressPage').then((m) => ({ default: m.InternProgressPage }))
);
const InternReportsPage = React.lazy(() =>
  import('./pages/intern/InternReportsPage').then((m) => ({ default: m.InternReportsPage }))
);
const InternAttendancePage = React.lazy(() =>
  import('./pages/intern/InternAttendancePage').then((m) => ({ default: m.InternAttendancePage }))
);
const InternFilesPage = React.lazy(() =>
  import('./pages/intern/InternFilesPage').then((m) => ({ default: m.InternFilesPage }))
);
const InternNotificationsPage = React.lazy(() =>
  import('./pages/intern/InternNotificationsPage').then((m) => ({ default: m.InternNotificationsPage }))
);
const InternProfilePage = React.lazy(() =>
  import('./pages/intern/InternProfilePage').then((m) => ({ default: m.InternProfilePage }))
);

// Loading Fallback spinner
const LoadingFallback = () => (
  <div className="min-h-[60vh] bg-slate-950 flex flex-col items-center justify-center text-slate-100">
    <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-sm font-medium text-slate-400">Loading page content...</p>
  </div>
);



// AdminDashboard placeholder removed — replaced by AdminLayout + admin sub-routes below.

// AdminDashboard placeholder removed — replaced by MentorLayout + mentor sub-routes.

// InternDashboard placeholder removed — replaced by InternLayout + intern sub-routes.

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
              <Route path="attendance" element={<MentorAttendancePage />} />
              <Route path="notifications" element={<MentorNotificationsPage />} />
              <Route path="profile" element={<MentorProfilePage />} />
              {/* Unmatched mentor sub-paths → overview */}
              <Route path="*" element={<Navigate to="/mentor" replace />} />
            </Route>
            {/* ---------------------------------------------------------------- */}
            {/* Intern Dashboard — protected, nested under InternLayout          */}
            {/* ---------------------------------------------------------------- */}
            <Route
              path="/intern"
              element={
                <RouteGuard allowedRoles={['INTERN']}>
                  <InternLayout />
                </RouteGuard>
              }
            >
              <Route index element={<InternOverviewPage />} />
              <Route path="project" element={<InternProjectPage />} />
              <Route path="progress" element={<InternProgressPage />} />
              <Route path="reports" element={<InternReportsPage />} />
              <Route path="attendance" element={<InternAttendancePage />} />
              <Route path="files" element={<InternFilesPage />} />
              <Route path="notifications" element={<InternNotificationsPage />} />
              <Route path="profile" element={<InternProfilePage />} />
              {/* Unmatched intern sub-paths → overview */}
              <Route path="*" element={<Navigate to="/intern" replace />} />
            </Route>

            {/* Wildcard fallback to home */}
            <Route path="*" element={<Link to="/" className="hidden" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
