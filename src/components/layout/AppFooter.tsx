/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AppFooterProps {
  isPortal?: boolean;
}

export const AppFooter: React.FC<AppFooterProps> = ({ isPortal = false }) => {
  return (
    <footer
      className={`w-full border-t border-[#ebbbb4]/40 dark:border-white/10 bg-white/95 dark:bg-[#140b0a]/95 backdrop-blur-md transition-colors duration-200 z-10 ${
        isPortal ? 'py-4 px-4 sm:px-6 lg:px-8 mt-auto mb-16 md:mb-0' : 'py-6 px-4 sm:px-6 lg:px-8 mt-auto'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand & System Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#bc0100] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-sm">fitness_center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-headline font-black text-[#2b1613] dark:text-white tracking-tight">
              WARRIOR <span className="text-[#bc0100] italic">FITNESS</span>
            </span>
            <span className="text-[#ebbbb4] dark:text-white/20 hidden xs:inline">•</span>
            <span className="text-[#603e39] dark:text-[#bca4a0] hidden xs:inline font-medium">
              Kinetic Performance Systems
            </span>
          </div>
        </div>

        {/* Creator Attribution (Prominent and clear) */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffe9e6] dark:bg-white/5 border border-[#ebbbb4]/60 dark:border-white/10 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-[#2b1613] dark:text-[#fceae7] font-medium">
            Created by <strong className="text-[#bc0100] dark:text-[#ff6b5d] font-bold">Swarit Mathur</strong>
          </span>
        </div>

        {/* Cloud & Security Metadata */}
        <div className="flex items-center gap-3 text-[#603e39] dark:text-[#bca4a0] font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-emerald-600 dark:text-emerald-400">cloud_done</span>
            <span>Firestore Sync Active</span>
          </span>
          <span>•</span>
          <span>© 2026 All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
};
