/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, MembershipPlan, PaymentMethod } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useGym } from '../../context/GymContext';
import { addDaysToDate, formatDisplayDate, getTodayDateString } from '../../utils/dateUtils';
import { useToast } from '../../components/common/Toast';

interface AssignMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMember?: Member | null;
}

export const AssignMembershipModal: React.FC<AssignMembershipModalProps> = ({
  isOpen,
  onClose,
  initialMember,
}) => {
  const { members, plans, assignMembership } = useGym();
  const { showToast } = useToast();

  const [selectedMemberId, setSelectedMemberId] = useState(initialMember?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [recordPaymentNow, setRecordPaymentNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  useEffect(() => {
    if (initialMember) {
      setSelectedMemberId(initialMember.id);
    } else if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [initialMember, members, selectedMemberId]);

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const calculatedExpiryDate = selectedPlan ? addDaysToDate(startDate, selectedPlan.durationDays) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedPlan) {
      showToast('Validation Error', 'Please select both a member and a plan.', 'error');
      return;
    }

    try {
      assignMembership({
        memberId: selectedMember.id,
        planId: selectedPlan.id,
        startDate,
        recordPaymentNow,
        paymentMethod,
      });

      showToast(
        'Membership Assigned! 🎉',
        `${selectedPlan.name} assigned to ${selectedMember.name}. Valid until ${formatDisplayDate(calculatedExpiryDate)}.`,
        'success'
      );
      onClose();
    } catch (err: any) {
      showToast('Assignment Failed', err.message, 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Membership Plan"
      subtitle="Complete plan assignment and optional initial payment collection"
      icon="credit_card"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Select Member */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Step 1: Select Member
          </label>
          <select
            value={selectedMemberId}
            onChange={e => setSelectedMemberId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium focus:border-[#bc0100] outline-none"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.memberCode}) • {m.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Select Plan */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Step 2: Select Membership Plan
          </label>
          <div className="grid grid-cols-2 gap-2">
            {plans.map(p => (
              <label
                key={p.id}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedPlanId === p.id
                    ? 'border-[#bc0100] bg-red-50/50 dark:bg-white/10'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2b1613] dark:text-white">{p.name}</span>
                  <input
                    type="radio"
                    name="assignPlanRadio"
                    checked={selectedPlanId === p.id}
                    onChange={() => setSelectedPlanId(p.id)}
                    className="text-[#bc0100] focus:ring-[#bc0100]"
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="font-headline font-bold text-[#bc0100]">₹{p.price.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{p.durationDays} Days</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Step 3: Start Date */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Step 3: Select Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium focus:border-[#bc0100] outline-none"
          />
        </div>

        {/* Step 4 & 5: Automatically Calculated Expiry Summary Card */}
        <div className="p-4 rounded-xl bg-[#fff0ee] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-label-caps">
              Summary Review
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
              AUTO CALCULATED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-gray-400 block text-[10px]">Assigned Tier</span>
              <span className="font-bold text-sm text-[#2b1613] dark:text-white">{selectedPlan?.name || 'Standard'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Total Price</span>
              <span className="font-bold text-sm text-[#bc0100] font-headline">₹{(selectedPlan?.price ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Start Date</span>
              <span className="font-medium text-[#2b1613] dark:text-white">{formatDisplayDate(startDate)}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Expiry Date</span>
              <span className="font-bold text-[#ba1a1a]">{formatDisplayDate(calculatedExpiryDate)}</span>
            </div>
          </div>
        </div>

        {/* Step 8: Optionally Record Payment */}
        <div className="space-y-3 pt-2 border-t border-black/10 dark:border-white/10">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
            <input
              type="checkbox"
              checked={recordPaymentNow}
              onChange={e => setRecordPaymentNow(e.target.checked)}
              className="rounded text-[#bc0100] focus:ring-[#bc0100]"
            />
            <span>Record full payment of ₹{(selectedPlan?.price ?? 0).toLocaleString('en-IN')} now</span>
          </label>

          {recordPaymentNow && (
            <div className="grid grid-cols-4 gap-2 text-xs pt-1">
              {(['UPI', 'CASH', 'CARD', 'BANK_TRANSFER'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2 px-1 rounded-lg border font-semibold text-center transition-all ${
                    paymentMethod === mode
                      ? 'border-[#bc0100] bg-[#bc0100] text-white shadow-sm'
                      : 'border-gray-200 dark:border-gray-800 hover:border-black'
                  }`}
                >
                  {mode === 'UPI' ? 'UPI' : mode === 'CASH' ? 'Cash' : mode === 'CARD' ? 'Card' : 'NEFT'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Confirm & Assign Pass</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
