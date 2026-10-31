/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { formatDisplayDate, formatDisplayTime, getDaysRemaining } from '../../utils/dateUtils';
import { useToast } from '../../components/common/Toast';
import confetti from 'canvas-confetti';

export const CustomerPortal: React.FC = () => {
  const { currentUser, setActiveView, logout } = useAuth();
  const {
    members,
    memberships,
    payments,
    attendance,
    plans,
    createRenewalRequest,
    renewMembership,
    checkInMember
  } = useGym();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'details' | 'attendance' | 'invoices'>('details');
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedRenewalPlanId, setSelectedRenewalPlanId] = useState('plan-premium');
  const [fullscreenQrOpen, setFullscreenQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState('WRR-9942-RS');
  const [qrTimer, setQrTimer] = useState(28);

  // Find current member
  const member = members.find(m => m.id === 'mem-1042') || members[0];
  const membership = member ? (memberships.find(m => m.memberId === member.id) || memberships[0]) : undefined;
  const memberPayments = member ? payments.filter(p => p.memberId === member.id) : [];
  const memberAttendance = member ? attendance.filter(a => a.memberId === member.id) : [];

  const daysRemaining = membership ? getDaysRemaining(membership.expiryDate) : 0;
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;

  // Calculate progress percentage
  const totalDays = 180;
  const daysCompleted = Math.max(0, Math.min(totalDays, totalDays - daysRemaining));
  const completionPercentage = Math.round((daysCompleted / totalDays) * 100);

  const handleInstantRenewal = () => {
    const plan = plans.find(p => p.id === selectedRenewalPlanId) || plans[0];
    if (!member || !plan) {
      showToast('Renewal Notice', 'Unable to resolve membership pass or current member.', 'error');
      return;
    }
    try {
      // Execute 1-tap renewal or request
      renewMembership({
        memberId: member.id,
        planId: plan.id,
        recordPaymentNow: true,
        performedBy: `${member.name} (Customer 1-Tap)`,
      });

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        console.error(e);
      }

      setRenewalModalOpen(false);
      showToast('Renewal Confirmed! 🎉', `Your ${plan.name} has been extended. Turnstile access valid.`, 'success');
    } catch (err: any) {
      showToast('Renewal Failed', err.message, 'error');
    }
  };

  const handleTurnstileGateTap = async () => {
    if (!member) {
      showToast('Access Error', 'No active member pass found.', 'error');
      return;
    }
    try {
      await checkInMember(member.id, 'Turnstile Gate A (Midtown Hub)', 'Digital Member QR');
      showToast('Optical Turnstile Unlocked!', 'Access GRANTED: Solenoid released for 6.0 seconds.', 'success');
    } catch (err: any) {
      showToast('Turnstile Access', err.message, 'info');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Quick Navigation Strip: Brand Website & Sign Out buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('public')}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1a0f0e] border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-800 dark:text-white hover:border-[#bc0100] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-[#bc0100]">public</span>
            <span>Brand Website</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1a0f0e] border border-slate-200 dark:border-white/15 text-xs font-bold text-rose-600 hover:border-rose-600 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Sign Out</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse"></span>
          <span>Customer Member Portal</span>
        </div>
      </div>

      {/* Top Banner / Member Identity Bar */}
      <div className="bg-white/80 dark:bg-[#1a0f0e]/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#bc0100] to-[#0071e8] shrink-0">
            <img
              src={member?.profilePhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250'}
              alt={member?.name}
              className="w-full h-full object-cover rounded-full bg-gray-100"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white status-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-xl text-[#2b1613] dark:text-white leading-tight">
                {member?.name || 'Rahul Sharma'}
              </h1>
              <span className="bg-[#ffe9e6] dark:bg-white/10 text-[#bc0100] px-2 py-0.5 rounded-full text-[10px] font-bold font-label-caps">
                MEMBER
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#603e39] dark:text-gray-400 mt-0.5 font-medium">
              <span className="text-[#bc0100] font-bold">{member?.memberCode}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px] text-[#0059ba]">location_on</span>
                Midtown Hub
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setRenewalModalOpen(true)}
            className="px-4 py-2 bg-[#bc0100] hover:bg-[#eb0000] text-white font-headline text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            <span>Request Instant Renewal</span>
          </button>
        </div>
      </div>

      {/* BENTO ROW 1: Hero Membership Pass (7 cols) + Quick Actions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HERO DIGITAL MEMBERSHIP PASS CARD (7 cols) */}
        <section className="lg:col-span-7">
          <div className="holographic-card rounded-2xl p-6 text-white shadow-2xl border border-white/15 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
            {/* Top Row: Tier & Status Badge */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-blue-200 tracking-widest uppercase font-mono font-bold">
                  <span>Warrior Athletic Club</span>
                  <span className="material-symbols-outlined text-xs text-red-300">verified</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-headline font-extrabold text-white mt-1">
                  {membership?.planName?.toUpperCase() || 'PREMIUM PASS (6 MONTHS)'}
                </h2>
                <p className="text-xs text-white/70">Single-Member Full Access</p>
              </div>

              {/* Status Glow Pill */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-label-caps border ${
                  isExpired
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                    : isExpiringSoon
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isExpired ? 'bg-rose-400' : isExpiringSoon ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 status-pulse'
                  }`}
                ></span>
                <span>{membership?.status || 'ACTIVE'}</span>
              </div>
            </div>

            {/* Middle Content: Turnstile QR Pattern & Validity Progress */}
            <div className="my-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative z-10 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10">
              {/* Turnstile Pass QR pattern simulation */}
              <div
                onClick={() => setFullscreenQrOpen(true)}
                className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl text-black cursor-pointer hover:scale-105 transition-transform"
                title="Click to expand Turnstile Pass"
              >
                <div className="w-24 h-24 bg-white p-1 rounded flex flex-col items-center justify-center relative">
                  <div className="w-full h-full relative qr-pattern rounded flex items-center justify-center">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-4 border-black bg-white"></div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-4 border-black bg-white"></div>
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-4 border-black bg-white"></div>
                    <div className="bg-[#bc0100] text-white p-1 rounded shadow-md z-10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">fitness_center</span>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-800 mt-1">
                  TAP FOR QR PASS
                </span>
              </div>

              {/* Validity Progress Stats */}
              <div className="sm:col-span-2 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-white/70 text-xs font-medium">Membership Validity</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      isExpired
                        ? 'bg-rose-500/30 text-rose-200'
                        : isExpiringSoon
                        ? 'bg-amber-500/30 text-amber-200'
                        : 'bg-emerald-500/30 text-emerald-200'
                    }`}
                  >
                    {formatDisplayDate(membership?.expiryDate)} ({daysRemaining} days remaining)
                  </span>
                </div>

                <div>
                  <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExpired
                          ? 'bg-rose-500'
                          : isExpiringSoon
                          ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                          : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, completionPercentage))}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-white/80 mt-1.5 font-mono">
                    <span>{daysCompleted} of {totalDays} Days Completed</span>
                    <span className="font-bold text-red-200">{completionPercentage}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/70 text-xs pt-1">
                  <span className="material-symbols-outlined text-sm text-blue-300">sensors</span>
                  <span>Ready for NFC & Optical Turnstile Tap</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 relative z-10 border-t border-white/10">
              <span className="text-white/50 text-[11px] font-mono">
                ENCRYPTED TOKEN: {qrToken}
              </span>
              <button
                onClick={() => setRenewalModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold font-headline flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-base">bolt</span>
                <span>Request Instant Renewal</span>
              </button>
            </div>
          </div>
        </section>

        {/* QUICK MEMBER ACTIONS (5 cols) */}
        <section className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-headline font-bold text-lg text-[#2b1613] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#bc0100] text-xl">bolt</span>
              <span>Quick Member Actions</span>
            </h3>
            <p className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5">
              Instant self-service commands for your workout session.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 flex-1">
            {/* 1: QR Pass */}
            <button
              onClick={() => setFullscreenQrOpen(true)}
              className="p-4 rounded-2xl bg-white dark:bg-[#1f1312] border border-[#ebbbb4]/40 dark:border-white/10 hover:border-[#bc0100] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#bc0100] group-hover:bg-[#bc0100] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
              </div>
              <div className="mt-4">
                <span className="block text-xs font-bold text-[#2b1613] dark:text-white group-hover:text-[#bc0100] transition-colors">
                  My QR Pass
                </span>
                <span className="text-[10px] text-gray-500 font-mono">Turnstile Ready</span>
              </div>
            </button>

            {/* 2: Request Renewal */}
            <button
              onClick={() => setRenewalModalOpen(true)}
              className="p-4 rounded-2xl bg-white dark:bg-[#1f1312] border border-[#ebbbb4]/40 dark:border-white/10 hover:border-[#bc0100] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#bc0100] group-hover:bg-[#bc0100] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">autorenew</span>
              </div>
              <div className="mt-4">
                <span className="block text-xs font-bold text-[#2b1613] dark:text-white group-hover:text-[#bc0100] transition-colors">
                  Request Renewal
                </span>
                <span className="text-[10px] text-amber-600 font-bold">
                  {daysRemaining}d remaining
                </span>
              </div>
            </button>

            {/* 3: Payment Receipts */}
            <button
              onClick={() => setActiveTab('invoices')}
              className="p-4 rounded-2xl bg-white dark:bg-[#1f1312] border border-[#ebbbb4]/40 dark:border-white/10 hover:border-[#bc0100] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#0059ba] group-hover:bg-[#0059ba] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
              </div>
              <div className="mt-4">
                <span className="block text-xs font-bold text-[#2b1613] dark:text-white group-hover:text-[#0059ba] transition-colors">
                  Payment Receipts
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">₹3,500 Paid</span>
              </div>
            </button>

            {/* 4: Locker Pin & Key */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1f1312] border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm text-left flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#2b1613] dark:text-white">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold text-[#2b1613] dark:text-white">
                    Locker #{member?.lockerNumber || '42'}
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-sm">key</span>
                </div>
                <span className="text-[10px] text-gray-500">Locker Area B (Midtown)</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BENTO ROW 2: TABS SECTION (Membership Details, Attendance, Invoices) */}
      <section className="bg-white dark:bg-[#1a0f0e] border border-[#ebbbb4]/40 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-[#ebbbb4]/40 dark:border-white/10 px-4 pt-3 gap-2 overflow-x-auto bg-[#fff8f6]/50 dark:bg-white/5">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-[#bc0100] text-[#bc0100]'
                : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">badge</span>
            <span>My Membership Details</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-[#bc0100] text-[#bc0100]'
                : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">sensor_door</span>
            <span>Recent Check-in Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'border-[#bc0100] text-[#bc0100]'
                : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">payments</span>
            <span>Invoices & Receipts</span>
          </button>
        </div>

        {/* Tab 1: Membership Details */}
        {activeTab === 'details' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan Timeline */}
              <div className="p-5 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-label-caps">
                  Plan Timeline
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-500 block">Start Date</span>
                    <span className="text-sm font-bold text-[#2b1613] dark:text-white">
                      {formatDisplayDate(membership?.startDate)}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                  <div>
                    <span className="text-[11px] text-gray-500 block">Expiry Date</span>
                    <span className="text-sm font-bold text-[#ba1a1a]">
                      {formatDisplayDate(membership?.expiryDate)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 text-xs text-[#b72114] font-medium">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>{daysRemaining} days remaining until renewal</span>
                </div>
              </div>

              {/* Personal Coach */}
              <div className="p-5 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-label-caps">
                  Personal Coach Assigned
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#bc0100] text-white flex items-center justify-center font-bold text-xs">
                    VR
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2b1613] dark:text-white">Vikram Rajput</h4>
                    <p className="text-xs text-gray-500">Tier-3 Strength & Conditioning</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded font-semibold">
                    2 Sessions / Week
                  </span>
                  <button
                    onClick={() => showToast('Direct Coach Chat', 'Opening encrypted chat channel with Coach Vikram Rajput...', 'info')}
                    className="text-[#0059ba] font-bold hover:underline flex items-center gap-1"
                  >
                    Chat <span className="material-symbols-outlined text-xs">send</span>
                  </button>
                </div>
              </div>

              {/* Included Plan Perks */}
              <div className="p-5 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-label-caps">
                  Active Plan Perks
                </span>
                <ul className="space-y-2 text-xs text-[#2b1613] dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                    <span><strong>All Access:</strong> All Warrior City Hubs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                    <span><strong>Steam & Sauna:</strong> Daily Uncapped</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0059ba] text-sm">confirmation_number</span>
                    <span><strong>Guest Passes:</strong> 2 remaining this cycle</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Self-Service Notice */}
            <div className="bg-[#fff0ee] dark:bg-white/5 p-4 rounded-xl border border-[#ebbbb4]/40 dark:border-white/10 flex items-start gap-3 text-xs">
              <span className="material-symbols-outlined text-[#bc0100] text-xl shrink-0 mt-0.5">security</span>
              <div>
                <h5 className="font-bold text-[#2b1613] dark:text-white">Private Self-Service Member Space</h5>
                <p className="text-[#603e39] dark:text-gray-400 mt-0.5 leading-relaxed">
                  This portal is cryptographically locked to your membership ID ({member?.memberCode}). Staff configurations, administrative logs, and cross-member dossiers are strictly restricted. To change registered phone or emergency contact details, visit the front desk.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance Records */}
        {activeTab === 'attendance' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                  Turnstile Access History
                </h4>
                <p className="text-xs text-gray-500">Live IoT telemetry logs for your gate passes</p>
              </div>
              <button
                onClick={handleTurnstileGateTap}
                className="px-3.5 py-1.5 bg-[#bc0100] text-white rounded-lg text-xs font-bold hover:bg-[#eb0000] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">contactless</span>
                <span>Simulate Turnstile Entry</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-black/5 dark:border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/10 bg-[#fff8f6] dark:bg-white/5 text-[10px] uppercase font-bold text-gray-500 font-label-caps">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Location / Gate</th>
                    <th className="py-3 px-4">Auth Method</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {memberAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No check-ins recorded yet. Tap your pass at the turnstile gate.
                      </td>
                    </tr>
                  ) : (
                    memberAttendance.map(att => (
                      <tr key={att.id} className="hover:bg-red-50/40 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#2b1613] dark:text-white">
                          {formatDisplayDate(att.checkIn.slice(0, 10))} at {formatDisplayTime(att.checkIn)}
                          {att.checkOut && (
                            <span className="block text-[10px] font-normal text-gray-500">
                              Checked out at {formatDisplayTime(att.checkOut)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{att.gate}</td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-[#bc0100]">qr_code_scanner</span>
                            <span>{att.authMethod || 'Digital Member QR'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              att.status === 'CHECKED_IN'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                att.status === 'CHECKED_IN' ? 'bg-emerald-500 status-pulse' : 'bg-gray-400'
                              }`}
                            ></span>
                            {att.status === 'CHECKED_IN' ? 'INSIDE' : 'SUCCESS'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Invoices & Receipts */}
        {activeTab === 'invoices' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                  Billing History & Tax Invoices
                </h4>
                <p className="text-xs text-gray-500">Official GST invoices and payment receipts for reimbursement</p>
              </div>
              <button
                onClick={() => showToast('Statement Downloaded', 'Official annual tax statement PDF downloaded.', 'success')}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Download Statement</span>
              </button>
            </div>

            <div className="border border-black/5 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-black/5 dark:divide-white/5">
              {memberPayments.map(p => (
                <div
                  key={p.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-red-50/30 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#bc0100]">
                      <span className="material-symbols-outlined text-xl">receipt</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#2b1613] dark:text-white">
                          Invoice #{p.transactionReference.slice(0, 14)}
                        </span>
                        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Paid on {formatDisplayDate(p.paymentDate)} • Method: <strong className="text-gray-700 dark:text-gray-300">{p.paymentMethod}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-gray-400">Incl. 18% GST</span>
                    </div>
                    <button
                      onClick={() => showToast('PDF Invoice', `Downloaded GST tax receipt for ${p.transactionReference}.`, 'info')}
                      className="px-3 py-1.5 rounded-lg bg-[#ffe9e6] dark:bg-white/10 text-[#bc0100] text-xs font-bold hover:bg-[#bc0100] hover:text-white transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">file_download</span>
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FULLSCREEN DIGITAL QR PASS MODAL */}
      {fullscreenQrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#1a0f0e] rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-white/20 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#bc0100] font-mono">
                OPTICAL TURNSTILE PASS
              </span>
              <button
                onClick={() => setFullscreenQrOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="font-headline font-extrabold text-lg text-[#2b1613] dark:text-white">
                {member?.name}
              </h3>
              <p className="text-xs text-gray-500 font-mono">ID: {member?.memberCode} • Gate Ready</p>
            </div>

            {/* QR Scanner Display */}
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#bc0100] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="laser-line"></div>
              <div className="w-52 h-52 relative qr-pattern rounded-xl flex items-center justify-center">
                <div className="absolute top-0 left-0 w-8 h-8 border-4 border-black bg-white"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-4 border-black bg-white"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-4 border-black bg-white"></div>
                <div className="bg-[#bc0100] text-white p-2 rounded-lg shadow-lg z-10">
                  <span className="material-symbols-outlined text-2xl">fitness_center</span>
                </div>
              </div>
              <p className="text-[10px] font-mono font-bold text-gray-600 mt-3">
                DYNAMIC CODE: {qrToken}
              </p>
            </div>

            <div className="text-xs text-gray-500 font-mono flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-sm">sensors</span>
              <span>Hold screen 4 inches from optical gate sensor</span>
            </div>

            <button
              onClick={() => {
                handleTurnstileGateTap();
                setFullscreenQrOpen(false);
              }}
              className="w-full py-3 bg-[#bc0100] text-white font-headline text-xs font-bold rounded-xl shadow-md hover:bg-[#eb0000] transition-all"
            >
              Simulate Gate Solenoid Tap
            </button>
          </div>
        </div>
      )}

      {/* INSTANT RENEWAL MODAL */}
      {renewalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a0f0e] max-w-md w-full rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 text-[#bc0100] flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">bolt</span>
                  </span>
                  <div>
                    <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                      Instant Pass Renewal
                    </h3>
                    <p className="text-xs text-gray-500">Lock renewal to waive re-activation</p>
                  </div>
                </div>
                <button
                  onClick={() => setRenewalModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="text-xs text-[#603e39] dark:text-gray-400 leading-relaxed">
                Your pass expires in <strong className="text-[#ba1a1a]">{daysRemaining} days</strong> ({formatDisplayDate(membership?.expiryDate)}). Locking renewal extends validity uninterrupted.
              </p>

              {/* Renewal Options */}
              <div className="space-y-2.5">
                {plans.slice(1, 4).map(p => (
                  <label
                    key={p.id}
                    className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      selectedRenewalPlanId === p.id
                        ? 'border-[#bc0100] bg-[#fff0ee] dark:bg-white/10'
                        : 'border-black/10 dark:border-white/10 hover:border-black/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="renewPlan"
                        checked={selectedRenewalPlanId === p.id}
                        onChange={() => setSelectedRenewalPlanId(p.id)}
                        className="text-[#bc0100] focus:ring-[#bc0100]"
                      />
                      <div>
                        <span className="block text-xs font-bold text-[#2b1613] dark:text-white">
                          {p.name} ({p.durationDays} Days)
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {p.description}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#bc0100] font-headline">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                  </label>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleInstantRenewal}
                  className="w-full py-3 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white font-headline text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">lock</span>
                  <span>Confirm & Renew Pass</span>
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-2 font-mono">
                  Instant turnstile validity update via encrypted sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
