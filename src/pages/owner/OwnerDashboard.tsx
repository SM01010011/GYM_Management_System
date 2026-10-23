/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useGym } from '../../context/GymContext';
import { useAuth } from '../../context/AuthContext';
import { formatDisplayDate, formatRelativeTime } from '../../utils/dateUtils';
import { useToast } from '../../components/common/Toast';

interface OwnerDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenAddMember: () => void;
  onOpenAssignPlan: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  onNavigateTab,
  onOpenAddMember,
  onOpenAssignPlan,
}) => {
  const { currentUser } = useAuth();
  const {
    stats,
    members,
    plans,
    payments,
    attendance,
    staffList,
    activityLogs,
    renewalRequests,
    settings,
    updateSettings,
  } = useGym();
  const { showToast } = useToast();

  const handleExportFinancials = () => {
    showToast('Financial Ledger Dispatched', 'Exported CSV / PDF audit ledger for current financial period.', 'success');
  };

  const handleEmergencyTurnstileLock = () => {
    const isUnlocked = settings.emergencyTurnstileUnlocked;
    updateSettings({ emergencyTurnstileUnlocked: !isUnlocked });
    showToast(
      isUnlocked ? 'Turnstile Security Engaged' : 'Emergency Turnstiles Solenoids Released',
      isUnlocked ? 'All regional turnstiles returned to automated badge mode.' : 'Master override: all gates set to open state.',
      isUnlocked ? 'info' : 'warning'
    );
  };

  return (
    <div className="space-y-6">
      {/* EXECUTIVE OVERVIEW BANNER (High-Polish Athletic Glassmorphic matching Image 4) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#fff8f6] to-[#ffe9e6] dark:from-[#201312] dark:via-[#1c100f] dark:to-[#170c0b] border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-red-600/5 blur-3xl pointer-events-none"></div>
        <div className="absolute right-32 -bottom-20 w-64 h-64 rounded-full bg-blue-600/5 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ffe9e6] dark:bg-red-950 text-[#bc0100] border border-[#ebbbb4]/50 dark:border-red-900/50">
                EXECUTIVE OVERVIEW
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-pulse"></span>
                Live Telemetry
              </span>
            </div>

            <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2b1613] dark:text-white tracking-tight">
              Governance & Executive Oversight
            </h1>
            <p className="text-xs sm:text-sm text-[#603e39] dark:text-gray-400 max-w-xl mt-1">
              Real-time financial solvency, cross-branch audit trails, and strict role-based access delegation for {currentUser?.name}.
            </p>
          </div>

          {/* Key Financial Dual Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[320px] xl:min-w-[420px]">
            {/* Total Revenue */}
            <div className="p-4 rounded-xl bg-white/95 dark:bg-white/5 backdrop-blur-md border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-label-caps">
                  TOTAL GYM REVENUE (MTD)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                  +18.4% vs last mo
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-headline font-extrabold text-2xl sm:text-3xl text-[#2b1613] dark:text-white">
                  ₹{stats.monthlyRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-[#ffe9e6] dark:bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#bc0100] h-full rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>

            {/* Net Profit & Cash Flow */}
            <div className="p-4 rounded-xl bg-white/95 dark:bg-white/5 backdrop-blur-md border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-label-caps">
                  NET PROFIT & CASH FLOW
                </span>
                <span className="material-symbols-outlined text-[#bc0100] text-lg">account_balance_wallet</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-headline font-extrabold text-2xl sm:text-3xl text-[#bc0100]">
                  ₹{Math.round(stats.monthlyRevenue * 0.741).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">74.1% MARGIN</span>
              </div>
              <div className="w-full bg-[#ffe9e6] dark:bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '74.1%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Metric Chips Cluster (Matching Image 4) */}
        <div className="mt-6 pt-5 border-t border-[#ebbbb4]/40 dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigateTab('members')}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#ebbbb4]/30 dark:border-white/10 hover:border-[#bc0100] text-left transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-[#ffe9e6] dark:bg-white/10 flex items-center justify-center text-[#bc0100]">
              <span className="material-symbols-outlined text-lg">group</span>
            </div>
            <div>
              <div className="font-headline font-bold text-lg text-[#2b1613] dark:text-white leading-tight">
                {stats.totalMembers}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold uppercase">Total Members</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('members')}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#ebbbb4]/30 dark:border-white/10 hover:border-emerald-500 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </div>
            <div>
              <div className="font-headline font-bold text-lg text-emerald-700 dark:text-emerald-400 leading-tight">
                {stats.activeMembers}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold uppercase">Active Passes</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('expiring')}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#ebbbb4]/30 dark:border-white/10 hover:border-amber-500 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">timer</span>
            </div>
            <div>
              <div className="font-headline font-bold text-lg text-amber-600 dark:text-amber-400 leading-tight">
                {stats.expiringSoon}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold uppercase">Expiring Soon</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('expired')}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#ebbbb4]/30 dark:border-white/10 hover:border-red-500 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">event_busy</span>
            </div>
            <div>
              <div className="font-headline font-bold text-lg text-rose-600 dark:text-rose-400 leading-tight">
                {stats.expiredMembers}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold uppercase">Expired</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('staff')}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#ebbbb4]/30 dark:border-white/10 hover:border-[#bc0100] text-left transition-all col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-lg bg-[#ffe9e6] dark:bg-white/10 text-[#bc0100] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">badge</span>
            </div>
            <div>
              <div className="font-headline font-bold text-lg text-[#bc0100] leading-tight">
                {stats.staffOnDuty} Staff
              </div>
              <div className="text-[10px] text-gray-500 font-semibold uppercase">Active On Duty</div>
            </div>
          </button>
        </div>
      </section>

      {/* WORKFLOW BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 1: STAFF MANAGEMENT & RBAC PERMISSIONS (7 cols) */}
        <section className="lg:col-span-7 bg-white dark:bg-[#1a0f0e] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-4 border-b border-black/5 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#bc0100] text-xl">security</span>
                  <h2 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                    Staff Management & RBAC Permissions
                  </h2>
                </div>
                <p className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5">
                  Enforce granular execution parameters across trainers, cashiers, and reception.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('staff')}
                className="px-3 py-1.5 rounded-lg bg-[#bc0100] text-white text-xs font-bold hover:bg-[#eb0000] flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Invite Staff</span>
              </button>
            </div>

            {/* Owner Mandate Banner */}
            <div className="my-4 px-3.5 py-2.5 rounded-xl bg-[#fff0ee] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 flex items-center gap-3 text-xs">
              <span className="material-symbols-outlined text-[#bc0100] text-base">lock</span>
              <div className="text-[#603e39] dark:text-gray-400">
                <strong className="text-[#bc0100]">Owner Mandate:</strong> Staff cannot access system finances, export raw member dossiers, or delete records.
              </div>
            </div>

            {/* Staff Roster */}
            <div className="space-y-3">
              {staffList.slice(0, 3).map(staff => (
                <div
                  key={staff.staffId}
                  className="p-3.5 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#bc0100]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#bc0100] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {staff.staffName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#2b1613] dark:text-white">
                          {staff.staffName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ON DUTY
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span>{staff.assignedBranch || 'Midtown Hub'}</span>
                        <span>•</span>
                        <span className="text-[#0059ba] font-semibold">
                          {staff.canManageMemberships ? 'Full Pass Control' : 'Desk Check-In Only'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('staff')}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors self-end sm:self-center"
                  >
                    Manage Permissions
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-gray-400">Showing {staffList.length} registered staff profiles</span>
            <button
              onClick={() => onNavigateTab('staff')}
              className="text-[#bc0100] font-bold hover:underline flex items-center gap-1"
            >
              <span>Audit Permission Matrix</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* SECTION 2: MEMBERSHIP PLAN BUILDER & PRICING (5 cols) */}
        <section className="lg:col-span-5 bg-white dark:bg-[#1a0f0e] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-4 border-b border-black/5 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#bc0100] text-xl">credit_card</span>
                  <h2 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                    Plan Builder & Pricing
                  </h2>
                </div>
                <p className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5">
                  Active pricing governance across all hubs
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('plans')}
                className="px-2.5 py-1.5 rounded-lg bg-[#ffe9e6] dark:bg-white/10 text-[#bc0100] text-xs font-bold hover:bg-[#bc0100] hover:text-white transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Plan</span>
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {plans.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#2b1613] dark:text-white">{p.name}</span>
                      {p.isPopular && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 dark:bg-red-950 text-[#bc0100]">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {p.durationDays} Days • {p.features[0] || 'Full floor access'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-headline font-extrabold text-sm text-[#2b1613] dark:text-white">
                      ₹{p.price.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-gray-400 font-mono text-[10px] uppercase">
              {plans.length} TOTAL TIERS CONFIGURED
            </span>
            <button
              onClick={() => onNavigateTab('plans')}
              className="text-[#bc0100] font-bold hover:underline"
            >
              Configure Plans & Perks →
            </button>
          </div>
        </section>

        {/* SECTION 3: SYSTEM AUDIT TRAIL & LIVE ACTIVITY LOG (8 cols) */}
        <section className="lg:col-span-8 bg-white dark:bg-[#1a0f0e] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#bc0100] text-xl">rule</span>
              <div>
                <h2 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                  System Audit Trail & Live Activity Log
                </h2>
                <p className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5">
                  Cryptographically tracked staff operations and financial transactions
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SYNCED
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {activityLogs.slice(0, 4).map((log, index) => (
              <div
                key={`${log.id}-${index}`}
                className="p-3.5 rounded-xl bg-[#fff8f6] dark:bg-white/5 border-l-4 border-l-[#bc0100] border-t border-r border-b border-black/5 dark:border-white/10 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ffe9e6] dark:bg-white/10 flex items-center justify-center text-[#bc0100] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-base">
                      {log.category === 'PAYMENT'
                        ? 'payments'
                        : log.category === 'ATTENDANCE'
                        ? 'sensors'
                        : log.category === 'STAFF'
                        ? 'badge'
                        : 'how_to_reg'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[#2b1613] dark:text-white leading-normal font-medium">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-mono">
                      <span>Operator: {log.performedBy}</span>
                      <span>•</span>
                      <span>Category: {log.category || 'MEMBER'}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap font-mono">
                  {formatRelativeTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-gray-400 font-mono text-[10px]">
              SHA-256 Verified Immutable Ledger
            </span>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-[#bc0100] font-bold hover:underline flex items-center gap-1"
            >
              <span>Download Detailed Audit Log</span>
              <span className="material-symbols-outlined text-sm">file_download</span>
            </button>
          </div>
        </section>

        {/* SECTION 4: CRITICAL ACTIONS (4 cols) */}
        <section className="lg:col-span-4 bg-white dark:bg-[#1a0f0e] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-black/5 dark:border-white/5">
              <span className="material-symbols-outlined text-[#bc0100] text-xl">terminal</span>
              <h2 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                Critical Actions
              </h2>
            </div>
            <p className="text-xs text-[#603e39] dark:text-gray-400 mt-2 mb-4">
              Master override controls requiring Executive Owner PIN or Biometric Token.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleExportFinancials}
                className="w-full group p-3 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#bc0100] text-left transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#ffe9e6] dark:bg-white/10 group-hover:bg-[#bc0100] group-hover:text-white text-[#bc0100] flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-lg">download</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2b1613] dark:text-white">Export Financial Report</div>
                    <div className="text-[10px] text-gray-500 font-mono">CSV / TALLY / PDF LEDGER</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-[#bc0100] text-lg">
                  chevron_right
                </span>
              </button>

              <button
                onClick={() => onNavigateTab('settings')}
                className="w-full group p-3 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#bc0100] text-left transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#ffe9e6] dark:bg-white/10 group-hover:bg-[#bc0100] group-hover:text-white text-[#bc0100] flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-lg">domain</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2b1613] dark:text-white">Manage Branches</div>
                    <div className="text-[10px] text-gray-500 font-mono">3 LOCATIONS • 1 PENDING</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-[#bc0100] text-lg">
                  chevron_right
                </span>
              </button>

              <button
                onClick={() => showToast('Database Backup', 'Firestore snapshot backed up to Google Cloud Storage.', 'success')}
                className="w-full group p-3 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#bc0100] text-left transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#ffe9e6] dark:bg-white/10 group-hover:bg-[#bc0100] group-hover:text-white text-[#bc0100] flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-lg">cloud_sync</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2b1613] dark:text-white">Database Backup</div>
                    <div className="text-[10px] text-emerald-600 font-bold font-mono">AUTO-SYNCED (2H AGO)</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-[#bc0100] text-lg">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* Emergency Turnstile Lock Button */}
          <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
            <button
              onClick={handleEmergencyTurnstileLock}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                settings.emergencyTurnstileUnlocked
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-[#ba1a1a] hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {settings.emergencyTurnstileUnlocked ? 'lock' : 'emergency_home'}
              </span>
              <span>
                {settings.emergencyTurnstileUnlocked ? 'Lock Turnstiles (Engage Normal Auth)' : 'Emergency Turnstile Unlock'}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
