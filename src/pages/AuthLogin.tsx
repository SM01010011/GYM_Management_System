/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { FirebaseConnectionTestModal } from '../components/FirebaseConnectionTestModal';

export const AuthLogin: React.FC = () => {
  const { login, loginWithGoogle, setActiveView } = useAuth();
  const { showToast } = useToast();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      showToast(
        'Signed In Successfully',
        `Welcome to your ${result.role.toLowerCase()} portal, ${result.user.name}.`,
        'success'
      );
    } catch (err: any) {
      const message = err?.message || 'Invalid email or password.';
      setErrorMessage(message);
      showToast('Authentication Failed', message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleSubmitting(true);
    try {
      const user = await loginWithGoogle();
      showToast(
        'Google Authentication Successful',
        `Welcome back, ${user.name} (${user.role} workspace).`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in was cancelled or failed.';
      setErrorMessage(msg);
      showToast('Google Sign-In Notice', msg, 'info');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleFillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg flex flex-col gap-6">
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
            Firebase Auth & Cloud Firestore
          </span>
        </div>

        <header className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#bc0100] text-white flex items-center justify-center shadow-md mb-3">
            <span className="material-symbols-outlined text-2xl">fitness_center</span>
          </div>

          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>WARRIOR</span>
            <span className="text-[#bc0100] italic">FITNESS</span>
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connected to project <strong className="font-mono text-[#bc0100]">test-c48e6</strong>
          </p>
        </header>

        <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-headline font-bold text-lg text-slate-900 dark:text-white">
                Account Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sign in with Google or your assigned portal credentials.
              </p>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleSubmitting ? 'Authenticating with Google...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">OR WITH EMAIL</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#201211] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#bc0100] focus:ring-1 focus:ring-[#bc0100] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
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

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#bc0100] focus:ring-[#bc0100] border-slate-300 cursor-pointer"
                />
                <span>Remember this browser</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#bc0100] hover:bg-[#a00100] text-white font-headline text-xs font-bold rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>Sign In to Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill Preset Credentials */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                Quick Test Accounts:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillCredentials('owner@warriorfitness.com', 'Owner@2026!')}
                  className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] font-bold text-center hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('staff@warriorfitness.com', 'Staff@2026!')}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-[11px] font-bold text-center hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Staff Desk
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('member@warriorfitness.com', 'Member@2026!')}
                  className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold text-center hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Member Pass
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm text-[#bc0100]">verified_user</span>
            <span>Protected by Firebase Authentication & Cloud Firestore Security Rules.</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              PROJECT ID: test-c48e6
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => setShowDiagnostics(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#bc0100] hover:text-[#900000] dark:text-[#ff897d] dark:hover:text-white underline cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">bolt</span>
              Test Firebase Connection
            </button>
          </div>
        </footer>

        <FirebaseConnectionTestModal
          isOpen={showDiagnostics}
          onClose={() => setShowDiagnostics(false)}
        />
      </div>
    </div>
  );
};
