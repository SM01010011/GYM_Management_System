/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth, SYSTEM_ACCOUNTS } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const AuthLogin: React.FC = () => {
  const { login, setActiveView } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your account email or User ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(identifier, password);
      showToast(
        'Signed In Successfully',
        `Welcome to your ${result.role.toLowerCase()} portal, ${result.user.name}.`,
        'success'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
      showToast('Authentication Failed', err.message || 'Invalid credentials', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillCredentials = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Navigation back to Home */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveView('public')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1a0f0e] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-white hover:border-[#bc0100] transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-[#bc0100]">arrow_back</span>
            <span>Return to Website</span>
          </button>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Warrior Single Sign-On
          </span>
        </div>

        {/* Brand Header */}
        <header className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#bc0100] text-white flex items-center justify-center shadow-md mb-3">
            <span className="material-symbols-outlined text-2xl">fitness_center</span>
          </div>

          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>WARRIOR</span>
            <span className="text-[#bc0100] italic">FITNESS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sign in with your email and password to access your portal.
          </p>
        </header>

        {/* Single Unified Authentication Card - NO ROLE OPTIONS */}
        <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-headline font-bold text-lg text-slate-900 dark:text-white">
                Account Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The system automatically routes you to your Owner, Staff, or Member workspace.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email / User ID Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address or User ID
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="e.g. owner@warriorfitness.com"
                    autoComplete="username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#201211] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#bc0100] focus:ring-1 focus:ring-[#bc0100] transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(
                        'Credentials Guide',
                        'Owner: Owner@2026! | Staff: Staff@2026! | Member: Member@2026!',
                        'info'
                      );
                    }}
                    className="text-[11px] font-semibold text-[#bc0100] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#201211] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#bc0100] focus:ring-1 focus:ring-[#bc0100] transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#bc0100] focus:ring-[#bc0100] border-slate-300 cursor-pointer"
                  />
                  <span>Remember this browser</span>
                </label>
                <span className="text-[11px] text-slate-400">256-bit SSL encrypted</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#bc0100] hover:bg-[#a00100] text-white font-headline text-xs font-bold rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>Sign In to Portal</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Real Website Credentials Reference Section */}
          <div className="p-5 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#bc0100]">key</span>
                <span>Authorized Portal Credentials</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Click any row to auto-fill
              </span>
            </div>

            <div className="space-y-2">
              {SYSTEM_ACCOUNTS.map(acc => {
                const isOwner = acc.role === 'OWNER';
                const isStaff = acc.role === 'STAFF';
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleFillCredentials(acc.email, acc.password)}
                    className="w-full text-left p-3 rounded-xl bg-white dark:bg-[#201211] border border-slate-200 dark:border-white/10 hover:border-[#bc0100] dark:hover:border-[#bc0100] transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isOwner
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : isStaff
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {isOwner ? 'shield_person' : isStaff ? 'badge' : 'person'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#bc0100] transition-colors flex items-center gap-2">
                          <span>
                            {isOwner
                              ? 'Owner (SM01010011)'
                              : isStaff
                              ? 'Front Desk Staff (Karan Verma)'
                              : 'Member (Rahul Sharma)'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {acc.email} • pass: <span className="font-semibold">{acc.password}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 group-hover:bg-[#bc0100] group-hover:text-white transition-colors">
                      Fill
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security / Trust Footer */}
        <footer className="text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm text-[#bc0100]">verified_user</span>
            <span>Protected by Role-Based Access Control (RBAC) & Cloud Firestore Auth.</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              256-BIT ENCRYPTED • PRODUCTION READY ARCHITECTURE
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
