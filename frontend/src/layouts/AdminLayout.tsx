// =============================================================================
// File: frontend/src/layouts/AdminLayout.tsx
// Purpose: Core sidebar/header shell layout for authenticated administrators
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUnreadNotificationsCount } from '../services/notification.service';
import { 
  GraduationCap, 
  LayoutDashboard, 
  FolderGit2, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Layout States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Poll for notifications unread count every 45s
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await getUnreadNotificationsCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread notification count:', err);
      }
    };

    void fetchUnread();
    const interval = setInterval(() => {
      void fetchUnread();
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { name: 'Projects', path: '/admin/projects', icon: <FolderGit2 className="h-4.5 w-4.5" /> },
    { name: 'Notifications', path: '/admin/notifications', icon: (
      <div className="relative">
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white ring-2 ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    ) },
    { name: 'Profile', path: '/admin/profile', icon: <UserIcon className="h-4.5 w-4.5" /> },
  ];

  const getBreadcrumb = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.map((part, index) => {
      const path = '/' + parts.slice(0, index + 1).join('/');
      const isLast = index === parts.length - 1;
      const display = part.charAt(0).toUpperCase() + part.slice(1);
      
      return (
        <React.Fragment key={path}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          {isLast ? (
            <span className="text-slate-200 font-semibold text-xs tracking-wide">{display}</span>
          ) : (
            <Link to={path} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              {display}
            </Link>
          )}
        </React.Fragment>
      );
    });
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800/80 flex-shrink-0">
        {/* Sidebar Header Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-indigo-600/10 rounded-lg border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-lg font-bold text-slate-200 tracking-tight">
              InternTrack
            </span>
          </Link>
          <span className="ml-2 text-[9px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/30">
            Admin
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 shadow-lg shadow-indigo-950/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer Profile */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/40">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="h-9 w-9 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName.charAt(0) || 'A'}
            </div>
            <div className="flex-grow overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-900 flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-40">
          
          {/* Left: Hamburger & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-slate-500 text-xs font-medium">InternTrack</span>
              {getBreadcrumb()}
            </div>
          </div>

          {/* Right: Notification Quickbell & Admin User Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Quick bell link */}
            <Link
              to="/admin/notifications"
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-900"></span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all focus:outline-none"
              >
                <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.firstName.charAt(0) || 'A'}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-350 pr-1">{user?.firstName}</span>
              </button>

              {userDropdownOpen && (
                <>
                  {/* Overlay to close menu */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link
                      to="/admin/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                      View Profile
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        void handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Outlet Page Workspace */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Slide-out Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 p-4">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
              <span className="text-lg font-bold text-white tracking-tight">InternTrack</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                void handleLogout();
              }}
              className="mt-auto flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
