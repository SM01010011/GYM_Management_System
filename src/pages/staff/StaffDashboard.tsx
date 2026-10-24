/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { useAuth } from '../../context/AuthContext';
import { addDaysToDate, formatDisplayDate, getTodayDateString } from '../../utils/dateUtils';
import { useToast } from '../../components/common/Toast';
import confetti from 'canvas-confetti';

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    plans,
    members,
    addMember,
    assignMembership,
    checkInMember,
    attendance,
    renewMembership,
    settings
  } = useGym();
  const { showToast } = useToast();

  // Onboarding Form State
  const [fullName, setFullName] = useState('Arjun Kapoor');
  const [mobilePhone, setMobilePhone] = useState('+91 98201 44521');
  const [email, setEmail] = useState('arjun.kapoor@example.com');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('1994-08-14');
  const [emergencyContact, setEmergencyContact] = useState('Neha Kapoor (+91 98200 11984)');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');

  const [selectedPlanId, setSelectedPlanId] = useState('plan-premium');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER'>('UPI');
  const [generateReceipt, setGenerateReceipt] = useState(true);

  // Turnstile quick lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [gateLatency, setGateLatency] = useState(44);

  const selectedPlan = plans.length > 0 ? (plans.find(p => p.id === selectedPlanId) || plans[0]) : undefined;
  const calculatedExpiryDate = selectedPlan
    ? addDaysToDate(startDate, selectedPlan.durationDays)
    : addDaysToDate(startDate, 30);

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      showToast('Plan Required', 'Please select a valid membership plan.', 'error');
      return;
    }

    try {
      // 1. Create Member
      const memberCode = `#M-${Math.floor(1000 + Math.random() * 9000)}`;
      const newMember = addMember({
        memberCode,
        name: fullName,
        phone: mobilePhone,
        email,
        gender,
        dateOfBirth: dob,
        emergencyContact,
        emergencyRelation,
        joinDate: startDate,
        status: 'ACTIVE',
        assignedCoach: 'Vikram Rajput',
        lockerNumber: String(Math.floor(10 + Math.random() * 80)),
      });

      // 2. Assign Membership with Payment
      const { membership } = assignMembership({
        memberId: newMember.id,
        planId: selectedPlan.id,
        startDate,
        recordPaymentNow: true,
        paymentMethod: paymentMode,
        performedBy: currentUser?.name || 'Staff',
      });

      try {
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.8 } });
      } catch (err) {
        console.error(err);
      }

      showToast(
        'Registration Successful! 🎉',
        `Member ${fullName} (${memberCode}) enrolled with ${selectedPlan.name}. Pass expires ${formatDisplayDate(calculatedExpiryDate)}.`,
        'success'
      );

      // Reset form to next entry
      setFullName('');
      setMobilePhone('+91 ');
      setEmail('');
    } catch (err: any) {
      showToast('Registration Error', err.message, 'error');
    }
  };

  const handleQuickTurnstileVerify = async () => {
    if (!searchQuery.trim()) {
      showToast('Enter Query', 'Please enter a Member ID, Name, or Phone number to verify pass.', 'info');
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const found = members.find(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.memberCode.toLowerCase().includes(q)
    );

    if (!found) {
      showToast('Member Not Found', `No gym member record matches "${searchQuery}".`, 'warning');
      return;
    }

    try {
      await checkInMember(found.id, 'Turnstile Gate #04 (Downtown HQ)', 'Staff Desk Scan');
      showToast(
        'Access Granted!',
        `Turnstile #04 unlocked for ${found.name} (${found.memberCode}). Solenoid active for 6s.`,
        'success'
      );
      setSearchQuery('');
    } catch (err: any) {
      showToast('Turnstile Verification', err.message, 'error');
    }
  };

  const handleManualGateUnlock = () => {
    if (confirm('Authorize manual turnstile gate unlock for 30 seconds? This event will be recorded in the immutable audit log.')) {
      showToast('Emergency Gate Override Active', 'Downtown Hub turnstiles unlocked for 30s.', 'warning');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 pb-32">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#ebbbb4]/40 dark:border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#bc0100] tracking-wider uppercase mb-1 font-label-caps">
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span>Expedited Membership Provisioning</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-[#2b1613] dark:text-white tracking-tight">
            Onboard New Member & Assign Plan
          </h1>
          <p className="text-xs text-[#603e39] dark:text-gray-400 mt-1">
            Register client credentials, calibrate expiry schedule, and collect initial fee
          </p>
        </div>

        {/* Quick Turnstile Lookup in Header */}
        <div className="flex items-center gap-2">
          <div className="relative w-64 sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuickTurnstileVerify()}
              placeholder="Scan barcode or type name..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#1a0f0e] border border-[#ebbbb4]/60 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
            />
          </div>
          <button
            onClick={handleQuickTurnstileVerify}
            className="px-3.5 py-2 bg-[#bc0100] text-white text-xs font-bold rounded-xl hover:bg-[#eb0000] transition-all flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">sensors</span>
            <span>Verify</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* WIZARD FORM (8 cols) */}
        <form onSubmit={handleOnboardSubmit} className="lg:col-span-8 space-y-6">
          {/* Section 1: Member Personal Information */}
          <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl p-6 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#bc0100] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </div>
                <div>
                  <h2 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                    1. Member Personal Information
                  </h2>
                  <p className="text-xs text-[#603e39] dark:text-gray-400">
                    Official record for physical access control and member directory
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-[#ffe9e6] dark:bg-white/10 text-[#bc0100] px-2.5 py-0.5 rounded font-label-caps">
                REQUIRED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-base">
                    account_circle
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Arjun Kapoor"
                    className="w-full pl-9 pr-3 py-2 bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Mobile Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={mobilePhone}
                  onChange={e => setMobilePhone(e.target.value)}
                  placeholder="+91 98201 44521"
                  className="w-full px-3 py-2 bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-base">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="arjun.kapoor@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Emergency Contact Name & Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  placeholder="Neha Kapoor (+91 98200 11984)"
                  className="w-full px-3 py-2 bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  value={emergencyRelation}
                  onChange={e => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Select Membership Plan */}
          <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl p-6 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#bc0100] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">fitness_center</span>
                </div>
                <div>
                  <h2 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                    2. Select Membership Plan
                  </h2>
                  <p className="text-xs text-[#603e39] dark:text-gray-400">
                    Calculates validity tier, gym floor access, and invoice subtotal
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 font-label-caps">
                RATES CURRENT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {plans.slice(0, 4).map(p => (
                <label
                  key={p.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedPlanId === p.id
                      ? 'border-[#bc0100] bg-[#fff0ee] dark:bg-white/10 shadow-sm'
                      : 'border-black/10 dark:border-white/10 hover:border-black/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-gray-400">{p.tierBadge || 'TIER'}</span>
                    <input
                      type="radio"
                      name="staffPlan"
                      checked={selectedPlanId === p.id}
                      onChange={() => setSelectedPlanId(p.id)}
                      className="text-[#bc0100] focus:ring-[#bc0100]"
                    />
                  </div>
                  <div className="my-2">
                    <h4 className="font-headline font-bold text-sm text-[#2b1613] dark:text-white">{p.name}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">{p.description}</p>
                  </div>
                  <div className="pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="font-headline font-extrabold text-base text-[#bc0100]">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-1">({p.durationDays}d)</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3 & 4: Validity & Expiry Engine + Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Section 3: Validity & Expiry Engine */}
            <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl p-6 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bc0100] text-lg">calendar_month</span>
                <h3 className="font-headline font-bold text-sm text-[#2b1613] dark:text-white">
                  3. Validity & Expiry Engine
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Start Date (Default: Today)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium focus:border-[#bc0100] outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#fff0ee] dark:bg-white/5 border border-red-200 dark:border-red-950/50 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Calculated Expiry Date</span>
                  <span className="text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                    SYSTEM COMPUTED
                  </span>
                </div>
                <div className="font-headline font-extrabold text-lg text-[#bc0100]">
                  {formatDisplayDate(calculatedExpiryDate)}
                </div>
                <p className="text-[11px] text-[#603e39] dark:text-gray-400">
                  Auto-locks turnstile gate on {formatDisplayDate(calculatedExpiryDate)} at 23:59:59 PM.
                </p>
              </div>
            </div>

            {/* Section 4: Initial Payment Collection */}
            <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl p-6 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#bc0100] text-lg">payments</span>
                  <h3 className="font-headline font-bold text-sm text-[#2b1613] dark:text-white">
                    4. Initial Payment
                  </h3>
                </div>
                <span className="font-headline font-bold text-base text-[#bc0100]">
                  ₹{(selectedPlan?.price ?? 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['UPI', 'CASH', 'CARD', 'BANK_TRANSFER'] as const).map(mode => (
                  <label
                    key={mode}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      paymentMode === mode
                        ? 'border-[#bc0100] bg-[#bc0100] text-white font-bold'
                        : 'border-black/10 dark:border-white/10 hover:border-black/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentModeStaff"
                      checked={paymentMode === mode}
                      onChange={() => setPaymentMode(mode)}
                      className="sr-only"
                    />
                    <span className="material-symbols-outlined text-base">
                      {mode === 'UPI' ? 'qr_code_scanner' : mode === 'CASH' ? 'point_of_sale' : mode === 'CARD' ? 'credit_card' : 'account_balance'}
                    </span>
                    <span>{mode === 'UPI' ? 'UPI' : mode === 'CASH' ? 'Cash' : mode === 'CARD' ? 'Card' : 'NEFT'}</span>
                  </label>
                ))}
              </div>

              <label className="flex items-start gap-2.5 pt-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={generateReceipt}
                  onChange={e => setGenerateReceipt(e.target.checked)}
                  className="mt-0.5 rounded text-[#bc0100] focus:ring-[#bc0100]"
                />
                <span className="text-[#603e39] dark:text-gray-400">
                  Collect now & generate GST tax receipt for client mobile line.
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN: Turnstile Controller & Live Gate Log (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Turnstile Gate #04 Control Box */}
          <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl p-6 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm text-center space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-label-caps">
                OPTICAL GATE #04
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 status-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#bc0100] mx-auto my-2">
              <span className="material-symbols-outlined text-3xl">sensors</span>
            </div>

            <div>
              <h4 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                Main Entrance Turnstile
              </h4>
              <p className="text-xs text-emerald-700 font-mono mt-0.5">
                ONLINE • Latency {gateLatency}ms • SHA256 Sync
              </p>
            </div>

            <div className="pt-3 border-t border-black/5 dark:border-white/5 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={handleManualGateUnlock}
                className="py-2 px-3 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold transition-all"
              >
                Manual Unlock
              </button>
              <button
                type="button"
                onClick={() => {
                  setGateLatency(Math.floor(38 + Math.random() * 15));
                  showToast('Optical Sensor Calibrated', 'Turnstile solenoid response calibrated to 42ms.', 'info');
                }}
                className="py-2 px-3 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-all"
              >
                Recalibrate
              </button>
            </div>
          </div>

          {/* Live Gate Ingress Log */}
          <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl p-6 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-gray-500">
                Live Turnstile Verifications
              </h4>
              <span className="material-symbols-outlined text-gray-400 text-sm">history</span>
            </div>

            <div className="space-y-2 text-xs">
              {attendance.slice(0, 4).map(att => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#2b1613] dark:text-white">{att.memberName}</div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {att.memberCode} • {att.gate.split(' ')[0]} {att.gate.split(' ')[1]}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      att.status === 'CHECKED_IN'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
                    }`}
                  >
                    {att.status === 'CHECKED_IN' ? 'GRANTED' : 'EXIT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM OPERATIONAL COMMIT BAR (Matching Image 14 exactly!) */}
      <footer className="fixed bottom-0 left-0 w-full z-40 bg-white/95 dark:bg-[#140b0a]/95 backdrop-blur-xl border-t border-[#ebbbb4]/40 dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] py-3.5 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#603e39] dark:text-gray-400">
            <span className="material-symbols-outlined text-[#bc0100] text-lg">verified_user</span>
            <span>
              Staff Terminal: <strong className="text-[#2b1613] dark:text-white">Operator {currentUser?.name}</strong>. Owner settings locked.
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-label-caps">
                SUMMARY PAYABLE
              </div>
              <div className="font-headline font-extrabold text-xl sm:text-2xl text-[#bc0100] leading-none">
                Total Due: ₹{(selectedPlan?.price ?? 0).toLocaleString('en-IN')}
              </div>
            </div>

            <button
              onClick={handleOnboardSubmit}
              type="button"
              className="px-6 sm:px-8 py-3.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white font-headline text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Complete Registration & Assign Pass</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
