/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const { role } = useAuth();

  if (role === 'CUSTOMER') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-2 py-2 border-t border-[#ebbbb4]/40 dark:border-white/10 bg-white/95 dark:bg-[#180e0d]/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentTab === 'overview' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onTabChange('pass')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentTab === 'pass' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">badge</span>
          <span className="text-[10px]">Pass</span>
        </button>

        <button
          onClick={() => onTabChange('attendance')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentTab === 'attendance' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">calendar_today</span>
          <span className="text-[10px]">Attendance</span>
        </button>

        <button
          onClick={() => onTabChange('payments')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentTab === 'payments' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">receipt_long</span>
          <span className="text-[10px]">Invoices</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentTab === 'profile' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">account_circle</span>
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    );
  }

  // Owner / Staff Bottom Nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-2 py-2 border-t border-[#ebbbb4]/40 dark:border-white/10 bg-white/95 dark:bg-[#180e0d]/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <button
        onClick={() => onTabChange('overview')}
        className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
          currentTab === 'overview' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-xl">dashboard</span>
        <span className="text-[10px]">Overview</span>
      </button>

      <button
        onClick={() => onTabChange('members')}
        className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
          currentTab === 'members' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-xl">group</span>
        <span className="text-[10px]">Members</span>
      </button>

      <button
        onClick={() => onTabChange('attendance')}
        className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
          currentTab === 'attendance' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-xl">sensors</span>
        <span className="text-[10px]">Check-In</span>
      </button>

      <button
        onClick={() => onTabChange('payments')}
        className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
          currentTab === 'payments' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-xl">credit_card</span>
        <span className="text-[10px]">Payments</span>
      </button>

      <button
        onClick={() => onTabChange('reports')}
        className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
          currentTab === 'reports' ? 'text-[#bc0100] font-bold' : 'text-gray-500 hover:text-black dark:hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-xl">bar_chart</span>
        <span className="text-[10px]">Reports</span>
      </button>
    </nav>
  );
};
