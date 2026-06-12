// =============================================================================
// File: frontend/src/layouts/RouteGuard.tsx
// Purpose: Protect routes from unauthenticated or unauthorized access
// =============================================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a loading indicator during session initialization from localStorage token
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-400">Restoring session...</p>
      </div>
    );
  }

  // Redirect unauthenticated users to login, preserving current location
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorizations
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to default dashboard corresponding to their role if they try to cross boundaries
    let fallbackPath = '/login';
    if (user.role === 'ADMIN') fallbackPath = '/admin';
    else if (user.role === 'MENTOR') fallbackPath = '/mentor';
    else if (user.role === 'INTERN') fallbackPath = '/intern';

    return <Navigate to={fallbackPath} replace />;
  }

  // Authorized
  return <>{children}</>;
};
