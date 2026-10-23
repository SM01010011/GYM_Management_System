/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { role } = useAuth();
  const { stats, renewalRequests } = useGym();

  const isOwner = role === 'OWNER';
  const pendingRenewalsCount = renewalRequests.filter(r => r.status === 'PENDING').length;

  const navItems = [
    { id: 'overview', label: 'Executive Hub', icon: 'dashboard', roles: ['OWNER', 'STAFF'] },
    { id: 'members', label: 'Members Directory', icon: 'group', roles: ['OWNER', 'STAFF'], badge: stats.totalMembers },
    { id: 'attendance', label: 'Turnstile & Attendance', icon: 'sensors', roles: ['OWNER', 'STAFF'], badge: stats.checkedInNow > 0 ? `${stats.checkedInNow} inside` : undefined, badgeColor: 'bg-emerald-500 text-white' },
    { id: 'expiring', label: 'Expiring Soon (< 7d)', icon: 'schedule', roles: ['OWNER', 'STAFF'], badge: stats.expiringSoon > 0 ? stats.expiringSoon : undefined, badgeColor: 'bg-amber-500 text-white' },
    { id: 'expired', label: 'Expired Passes', icon: 'event_busy', roles: ['OWNER', 'STAFF'], badge: stats.expiredMembers > 0 ? stats.expiredMembers : undefined, badgeColor: 'bg-rose-500 text-white' },
    { id: 'renewals', label: 'Renewal Requests', icon: 'autorenew', roles: ['OWNER', 'STAFF'], badge: pendingRenewalsCount > 0 ? pendingRenewalsCount : undefined, badgeColor: 'bg-[#bc0100] text-white' },
    { id: 'payments', label: 'Payments & Revenue', icon: 'payments', roles: ['OWNER', 'STAFF'] },
    { id: 'plans', label: 'Membership Plans', icon: 'credit_card', roles: ['OWNER'] },
    { id: 'reports', label: 'Reports & Analytics', icon: 'bar_chart', roles: ['OWNER'] },
    { id: 'staff', label: 'Staff Management', icon: 'badge', roles: ['OWNER'] },
    { id: 'audit', label: 'System Audit Logs', icon: 'rule', roles: ['OWNER'] },
    { id: 'settings', label: 'Gym Settings', icon: 'settings', roles: ['OWNER'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-[#180e0d] border-r border-slate-200 dark:border-white/10 min-h-[calc(100vh-4rem)] p-4 transition-colors">
      <div className="space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {isOwner ? 'Executive Governance' : 'Staff Operations'}
        </div>

        {visibleItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-red-50 dark:bg-white/10 text-[#bc0100] font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg transition-colors ${
                    isActive ? 'text-[#bc0100]' : 'text-slate-400 group-hover:text-black dark:group-hover:text-white'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.badgeColor || 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer System Status */}
      <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2">
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse"></span>
              Optical Turnstile Gate
            </span>
            <span className="text-emerald-600 font-mono">ONLINE</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            Downtown Hub • Solenoid Response 44ms
          </div>
        </div>

        <div className="text-center text-[10px] font-mono text-gray-400">
          Warrior Kinetic OS • v4.2.0
        </div>
      </div>
    </aside>
  );
};
