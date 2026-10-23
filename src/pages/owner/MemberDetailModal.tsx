/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Membership, Payment, Attendance, MembershipHistory } from '../../types';
import { Modal } from '../../components/common/Modal';
import { formatDisplayDate, formatDisplayTime, getDaysRemaining } from '../../utils/dateUtils';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../components/common/Toast';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onEdit: (member: Member) => void;
  onRenew: (member: Member) => void;
  onAssignPlan: (member: Member) => void;
  onRecordPayment: (member: Member) => void;
  onMarkAttendance: (member: Member) => void;
  onToggleStatus: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  onEdit,
  onRenew,
  onAssignPlan,
  onRecordPayment,
  onMarkAttendance,
  onToggleStatus,
}) => {
  const { memberships, payments, attendance, history } = useGym();
  const [activeTab, setActiveTab] = useState<'membership' | 'payments' | 'attendance' | 'history'>('membership');

  if (!member) return null;

  const currentMship = memberships.find(m => m.memberId === member.id);
  const memberPayments = payments.filter(p => p.memberId === member.id);
  const memberAttendance = attendance.filter(a => a.memberId === member.id);
  const memberHistory = history.filter(h => h.memberId === member.id);

  const daysRemaining = currentMship ? getDaysRemaining(currentMship.expiryDate) : 0;
  const totalPaid = memberPayments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${member.name} (${member.memberCode})`}
      subtitle="Complete athlete profile dossier and operational logs"
      icon="person"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="p-4 rounded-xl bg-[#fff0ee] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#bc0100] text-white flex items-center justify-center font-headline font-bold text-lg overflow-hidden shrink-0 border-2 border-white shadow">
              {member.profilePhoto ? (
                <img src={member.profilePhoto} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                member.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">{member.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    member.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-400'
                  }`}
                >
                  {member.status}
                </span>
              </div>
              <div className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5 space-y-0.5">
                <div>📞 {member.phone} • ✉️ {member.email}</div>
                <div>Joined: {formatDisplayDate(member.joinDate)} • Locker: #{member.lockerNumber || 'Unassigned'}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
            <button
              onClick={() => onEdit(member)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Edit</span>
            </button>
            <button
              onClick={() => onRenew(member)}
              className="px-3 py-1.5 rounded-lg bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">autorenew</span>
              <span>Renew</span>
            </button>
            <button
              onClick={() => onMarkAttendance(member)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">sensors</span>
              <span>Check-In</span>
            </button>
            <button
              onClick={() => onToggleStatus(member)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/5"
            >
              {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-black/10 dark:border-white/10 gap-2 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('membership')}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === 'membership'
                ? 'border-[#bc0100] text-[#bc0100]'
                : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Membership & Status
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-[#bc0100] text-[#bc0100]'
                : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Payments ({memberPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === 'attendance'
                ? 'border-[#bc0100] text-[#bc0100]'
                : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Attendance ({memberAttendance.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-[#bc0100] text-[#bc0100]'
                : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
            }`}
          >
            History Log ({memberHistory.length})
          </button>
        </div>

        {/* Tab 1: Current Membership */}
        {activeTab === 'membership' && (
          <div className="space-y-4">
            {currentMship ? (
              <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-label-caps">
                      CURRENT PLAN
                    </span>
                    <h4 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                      {currentMship.planName}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      currentMship.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : currentMship.status === 'EXPIRING_SOON'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {currentMship.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-black/5 dark:border-white/5 text-xs">
                  <div>
                    <span className="text-gray-400 block">Start Date</span>
                    <span className="font-bold text-[#2b1613] dark:text-white">
                      {formatDisplayDate(currentMship.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Expiry Date</span>
                    <span className="font-bold text-[#ba1a1a]">
                      {formatDisplayDate(currentMship.expiryDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Days Remaining</span>
                    <span
                      className={`font-bold ${
                        daysRemaining < 0
                          ? 'text-rose-600'
                          : daysRemaining <= 7
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d Expired` : `${daysRemaining} Days`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Assigned Coach: <strong>{member.assignedCoach || 'None'}</strong></span>
                  <span>Registered by: <strong>{currentMship.createdBy}</strong></span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-gray-50 dark:bg-white/5 text-xs text-gray-500 space-y-2">
                <p>No active membership assigned to this member.</p>
                <button
                  onClick={() => onAssignPlan(member)}
                  className="px-4 py-2 bg-[#bc0100] text-white font-bold rounded-lg hover:bg-[#eb0000]"
                >
                  Assign Plan Now
                </button>
              </div>
            )}

            {/* Emergency Contact Dossier */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                EMERGENCY CONTACT & ADDRESS
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block">Emergency Line</span>
                  <span className="font-semibold text-[#2b1613] dark:text-white">
                    {member.emergencyContact || 'None listed'} ({member.emergencyRelation || 'Not specified'})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Residential Address</span>
                  <span className="font-semibold text-[#2b1613] dark:text-white">
                    {member.address || 'Bengaluru, India'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>Lifetime Payments: ₹{totalPaid.toLocaleString('en-IN')}</span>
              <button
                onClick={() => onRecordPayment(member)}
                className="text-[#bc0100] hover:underline flex items-center gap-1"
              >
                + Record Payment
              </button>
            </div>
            {memberPayments.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">No payment records found.</div>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                {memberPayments.map(p => (
                  <div key={p.id} className="p-3 bg-white dark:bg-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#2b1613] dark:text-white">
                        ₹{p.amount.toLocaleString('en-IN')} via {p.paymentMethod}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {p.transactionReference} • {formatDisplayDate(p.paymentDate)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Attendance */}
        {activeTab === 'attendance' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>Total Check-Ins: {memberAttendance.length} visits</span>
              <button
                onClick={() => onMarkAttendance(member)}
                className="text-emerald-600 hover:underline flex items-center gap-1"
              >
                + Mark Check-In
              </button>
            </div>
            {memberAttendance.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">No attendance entries recorded yet.</div>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                {memberAttendance.map(a => (
                  <div key={a.id} className="p-3 bg-white dark:bg-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#2b1613] dark:text-white">
                        {formatDisplayDate(a.checkIn.slice(0, 10))} at {formatDisplayTime(a.checkIn)}
                      </div>
                      <div className="text-[10px] text-gray-500">{a.gate}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {a.status === 'CHECKED_IN' ? 'INSIDE' : 'CHECKED OUT'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {memberHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">No membership changes logged yet.</div>
            ) : (
              <div className="space-y-2">
                {memberHistory.map(h => (
                  <div key={h.id} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#bc0100]">{h.action}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{formatDisplayDate(h.createdAt.slice(0, 10))}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 mt-1">
                      {h.oldPlan ? `${h.oldPlan} ➔ ` : ''}{h.newPlan} (Expires: {formatDisplayDate(h.newExpiryDate)})
                    </div>
                    {h.notes && <div className="text-[11px] text-gray-500 italic mt-0.5">{h.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
