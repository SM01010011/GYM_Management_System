/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { app, auth, db, googleProvider } from '../firebase/config';
import { doc, getDocFromServer } from 'firebase/firestore';
import { CheckCircle2, XCircle, Loader2, Database, ShieldCheck, Flame, X, RefreshCw } from 'lucide-react';

interface FirebaseConnectionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestStep {
  id: string;
  title: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  details?: string;
}

export const FirebaseConnectionTestModal: React.FC<FirebaseConnectionTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: 'init',
      title: '1. Firebase App Initialization',
      description: 'Checks Firebase client SDK initialization & project binding',
      status: 'idle',
    },
    {
      id: 'firestore',
      title: '2. Cloud Firestore Connectivity',
      description: 'Validates live server connection to Firestore database instance',
      status: 'idle',
    },
    {
      id: 'auth',
      title: '3. Google Authentication Configuration',
      description: 'Validates OAuth provider setup & Firebase Auth readiness',
      status: 'idle',
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);

    // Reset steps
    setSteps([
      {
        id: 'init',
        title: '1. Firebase App Initialization',
        description: 'Checks Firebase client SDK initialization & project binding',
        status: 'running',
      },
      {
        id: 'firestore',
        title: '2. Cloud Firestore Connectivity',
        description: 'Validates live server connection to Firestore database instance',
        status: 'idle',
      },
      {
        id: 'auth',
        title: '3. Google Authentication Configuration',
        description: 'Validates OAuth provider setup & Firebase Auth readiness',
        status: 'idle',
      },
    ]);

    // Test 1: Firebase Initialization
    await new Promise((r) => setTimeout(r, 350));
    try {
      if (!app || !app.options.projectId) {
        throw new Error('Firebase app is not initialized or missing projectId');
      }
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'init'
            ? {
                ...s,
                status: 'success',
                details: `Project: ${app.options.projectId} • App Name: ${app.name} • Auth Domain: ${app.options.authDomain}`,
              }
            : s.id === 'firestore'
            ? { ...s, status: 'running' }
            : s
        )
      );
    } catch (err) {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'init'
            ? { ...s, status: 'failed', details: err instanceof Error ? err.message : String(err) }
            : s
        )
      );
      setIsRunning(false);
      return;
    }

    // Test 2: Firestore Connectivity
    const startTime = performance.now();
    try {
      const probeRef = doc(db, 'test', 'connection');
      const snap = await getDocFromServer(probeRef);
      const latency = Math.round(performance.now() - startTime);

      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'firestore'
            ? {
                ...s,
                status: 'success',
                details: `Connected directly to server in ${latency}ms • Reachable: true • Exists: ${snap.exists()}`,
              }
            : s.id === 'auth'
            ? { ...s, status: 'running' }
            : s
        )
      );
    } catch (err) {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'firestore'
            ? { ...s, status: 'failed', details: err instanceof Error ? err.message : String(err) }
            : s.id === 'auth'
            ? { ...s, status: 'running' }
            : s
        )
      );
    }

    // Test 3: Google Auth Configuration
    await new Promise((r) => setTimeout(r, 300));
    try {
      if (!auth) {
        throw new Error('Firebase Auth instance is missing.');
      }
      if (googleProvider.providerId !== 'google.com') {
        throw new Error(`Unexpected providerId: ${googleProvider.providerId}`);
      }

      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'auth'
            ? {
                ...s,
                status: 'success',
                details: `Provider: ${googleProvider.providerId} (Google Popup / Redirect ready) • Auth User: ${
                  auth.currentUser ? auth.currentUser.email : 'Ready for sign in'
                }`,
              }
            : s
        )
      );
    } catch (err) {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'auth'
            ? { ...s, status: 'failed', details: err instanceof Error ? err.message : String(err) }
            : s
        )
      );
    }

    setIsRunning(false);
  };

  React.useEffect(() => {
    if (isOpen) {
      runAllTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allPassed = steps.every((s) => s.status === 'success');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fff8f6] dark:bg-[#1a1110] border border-[#ebbbb4]/50 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebbbb4]/40 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c03425]/10 dark:bg-[#c03425]/20 flex items-center justify-center text-[#c03425]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#2b1613] dark:text-white">
                Firebase Connection Diagnostics
              </h2>
              <p className="text-xs text-[#8c6b66] dark:text-[#b89c98]">
                Real-time validation for Firebase, Firestore & Google Auth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c6b66] hover:text-[#2b1613] dark:text-[#b89c98] dark:hover:text-white hover:bg-[#f2d3cf]/40 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Steps */}
        <div className="p-6 space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="p-4 rounded-xl border border-[#ebbbb4]/40 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {step.id === 'init' && <Flame className="w-4 h-4 text-[#c03425]" />}
                    {step.id === 'firestore' && <Database className="w-4 h-4 text-[#388e3c]" />}
                    {step.id === 'auth' && <ShieldCheck className="w-4 h-4 text-[#1976d2]" />}
                    <span className="font-semibold text-sm text-[#2b1613] dark:text-white">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#8c6b66] dark:text-[#b89c98]">
                    {step.description}
                  </p>
                </div>

                <div className="flex-shrink-0 pt-0.5">
                  {step.status === 'running' && (
                    <Loader2 className="w-5 h-5 text-[#c03425] animate-spin" />
                  )}
                  {step.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {step.status === 'failed' && (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                  {step.status === 'idle' && (
                    <div className="w-5 h-5 rounded-full border-2 border-dashed border-[#8c6b66]/40" />
                  )}
                </div>
              </div>

              {step.details && (
                <div
                  className={`text-xs p-2.5 rounded-lg font-mono ${
                    step.status === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                  }`}
                >
                  {step.details}
                </div>
              )}
            </div>
          ))}

          {allPassed && !isRunning && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                All Firebase systems are operational and connected to project{' '}
                <span className="font-bold underline">test-c48e6</span>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#ebbbb4]/40 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-black/20">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-white/10 border border-[#ebbbb4] dark:border-white/20 text-[#2b1613] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/15 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            Re-test Connection
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#c03425] text-white hover:bg-[#a62b1e] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
