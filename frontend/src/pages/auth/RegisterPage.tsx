// =============================================================================
// File: frontend/src/pages/auth/RegisterPage.tsx
// Purpose: Intern self-registration form connected to backend API
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  GraduationCap, 
  User, 
  Mail, 
  Key, 
  Phone, 
  School, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff 
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [domain, setDomain] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitLoading(true);

    const payload = {
      firstName,
      lastName,
      email,
      password,
      phone: phone.trim() ? phone : undefined,
      college,
      domain,
    };

    try {
      await register(payload);
      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error.message || 'Registration failed. Check inputs.');
      } else {
        setErrorMsg('Network error. Failed to reach server.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl py-10 px-8 shadow-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-12 w-12" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Registration Successful!</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Welcome to InternTrack. Your profile is currently in <span className="text-indigo-400 font-semibold">PENDING</span> status. A program and mentor will be assigned to you by the system administrator shortly.
            </p>
            <Link
              to="/login"
              className="inline-flex w-full justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all"
            >
              Proceed to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-12 relative flex flex-col justify-center">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
            <GraduationCap className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Create Intern Profile
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Self-register to apply for university-authorized internship projects.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl py-8 px-6 sm:px-10 shadow-2xl">
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-900/30 flex items-start gap-3 text-rose-300 text-sm animate-shake">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">First Name</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Last Name</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@university.edu"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
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
              <p className="mt-1.5 text-[10px] text-slate-400">
                Rules: Min 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 digit.
              </p>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Phone (Optional)</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* College Name */}
            <div>
              <label htmlFor="college" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">College / University</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <School className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  id="college"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="State Technological Institute"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Domain Specialization */}
            <div>
              <label htmlFor="domain" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Specialization Domain</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Terminal className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  id="domain"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., Frontend Web Development"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
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
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-850 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
