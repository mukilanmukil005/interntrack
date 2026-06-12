// =============================================================================
// File: frontend/src/pages/auth/LoginPage.tsx
// Purpose: Interactive LoginPage integrating with backend login API
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, Key, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Retrieve origin route state or fallback to default role dashboards
  const from = (location.state as any)?.from?.pathname || null;

  const handleRoleRedirect = (role: string) => {
    if (from && from.startsWith(`/${role.toLowerCase()}`)) {
      navigate(from, { replace: true });
    } else {
      switch (role) {
        case 'ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'MENTOR':
          navigate('/mentor', { replace: true });
          break;
        case 'INTERN':
          navigate('/intern', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  };

  // If user is already authenticated, redirect immediately
  useEffect(() => {
    if (user && !loading) {
      handleRoleRedirect(user.role);
    }
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitLoading(true);

    try {
      const loggedInUser = await login(email, password);
      handleRoleRedirect(loggedInUser.role);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error.message || 'Login failed. Please check credentials.');
      } else {
        setErrorMsg('Network error. Failed to reach server.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="p-3.5 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
            <GraduationCap className="h-9 w-9 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Sign in to InternTrack
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter credentials assigned by your college or administrator.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl py-8 px-6 sm:px-10 shadow-2xl">
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-900/30 flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-850 text-center">
            <p className="text-sm text-slate-400">
              New intern?{' '}
              <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Self-register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
