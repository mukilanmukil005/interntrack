// =============================================================================
// File: frontend/src/layouts/PublicLayout.tsx
// Purpose: Main public website wrapper featuring responsive navigation & footer
// =============================================================================

import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, GraduationCap, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Programs', path: '/programs' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'MENTOR':
        return '/mentor';
      case 'INTERN':
        return '/intern';
      default:
        return '/login';
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
                <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all duration-300">
                  <GraduationCap className="h-6 w-6 text-indigo-400 group-hover:scale-105 transition-transform" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-100 bg-clip-text text-transparent tracking-tight">
                  InternTrack
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex space-x-1 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* CTA/Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 font-medium">{user.firstName}</span>
                    <span className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded uppercase font-bold">
                      {user.role}
                    </span>
                  </div>
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4.5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35"
                  >
                    Join as Intern
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Trigger */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-850 space-y-2.5">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-slate-300 text-sm">
                    <UserIcon className="h-4 w-4 text-indigo-400" />
                    <span className="font-semibold">{user.firstName} {user.lastName}</span>
                    <span className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded uppercase font-bold ml-auto">
                      {user.role}
                    </span>
                  </div>
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-base font-semibold bg-indigo-600 text-white"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void handleLogout();
                    }}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-lg text-base font-semibold text-slate-300 bg-slate-900 border border-slate-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-lg text-base font-semibold bg-indigo-600 text-white shadow-lg"
                  >
                    Join as Intern
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-indigo-600/10 rounded-lg border border-indigo-500/20">
                  <GraduationCap className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-lg font-bold text-slate-200 tracking-tight">InternTrack</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Empowering colleges, mentors, and students with structural progress metrics, seamless daily reports, and objective-oriented internship tracking.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Portals</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Intern Login</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Mentor Hub</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Admin Console</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} InternTrack. All rights reserved.
            </p>
            <div className="flex gap-6 text-slate-500 text-xs">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
