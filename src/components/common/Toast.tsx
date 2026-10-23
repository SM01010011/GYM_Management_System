/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType) => void;
  addToast: (title: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const addToast = useCallback((title: string, type: ToastType = 'success') => {
    showToast(title, undefined, type);
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, addToast }}>
      {children}
      <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          const typeStyles = {
            success: 'bg-[#14231b] text-white border-emerald-500/40',
            error: 'bg-[#290d0d] text-white border-rose-500/40',
            warning: 'bg-[#2b1f0c] text-white border-amber-500/40',
            info: 'bg-[#0f1b29] text-white border-blue-500/40',
          }[toast.type];

          const iconName = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info',
          }[toast.type];

          const iconColor = {
            success: 'text-emerald-400',
            error: 'text-rose-400',
            warning: 'text-amber-400',
            info: 'text-blue-400',
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transform transition-all duration-300 animate-in slide-in-from-top-4 ${typeStyles}`}
            >
              <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${iconColor}`}>
                {iconName}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">{toast.title}</p>
                {toast.message && <p className="text-xs text-gray-300 mt-1 leading-normal">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
