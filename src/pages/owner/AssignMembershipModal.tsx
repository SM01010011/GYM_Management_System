/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Member } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useGym } from '../../context/GymContext';
import {
  addDaysToDate,
  formatDisplayDate,
  getTodayDateString,
} from '../../utils/dateUtils';
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
  const { members, plans, assignMembership, refreshAll } = useGym();
  const { showToast } = useToast();

  const activePlans = plans.filter((plan) => plan.isActive);

  const [selectedMemberId, setSelectedMemberId] = useState(
    initialMember?.id || ''
  );
  const [selectedPlanId, setSelectedPlanId] = useState(
    activePlans[0]?.id || ''
  );
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialMember) {
      setSelectedMemberId(initialMember.id);
    } else if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [initialMember, members, selectedMemberId]);

  useEffect(() => {
    if (!selectedPlanId && activePlans.length > 0) {
      setSelectedPlanId(activePlans[0].id);
    }
  }, [activePlans, selectedPlanId]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedPlan =
    activePlans.find((p) => p.id === selectedPlanId) || activePlans[0];

  const calculatedExpiryDate = selectedPlan
    ? addDaysToDate(startDate, selectedPlan.durationDays - 1)
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember || !selectedPlan) {
      showToast(
        'Validation Error',
        'Please select both a member and an active membership plan.',
        'error'
      );
      return;
    }

    setSaving(true);

    try {
      const result = assignMembership({
        memberId: selectedMember.id,
        planId: selectedPlan.id,
        startDate,
        recordPaymentNow: false,
        performedBy: 'Owner / Staff',
      });

      refreshAll();

      showToast(
        'Membership Assigned! 🎉',
        `${selectedPlan.name} assigned to ${selectedMember.name}. Valid until ${formatDisplayDate(
          result.membership.expiryDate
        )}.`,
        'success'
      );

      setNotes('');
      onClose();
    } catch (err) {
      showToast(
        'Assignment Failed',
        err instanceof Error ? err.message : 'Unable to assign membership.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Membership Plan"
      subtitle="Assign an active plan to a member and calculate validity automatically"
      icon="credit_card"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Step 1: Select Member
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            required
            disabled={saving || members.length === 0}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium focus:border-[#bc0100] outline-none disabled:opacity-60"
          >
            {members.length === 0 ? (
              <option value="">No members available</option>
            ) : (
              members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberCode}) • {m.phone}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Step 2: Select Membership Plan
          </label>

          {activePlans.length === 0 ? (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-200">
              No active membership plans are available. Create or activate a
              plan before assigning a membership.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activePlans.map((p) => (
                <label
                  key={p.id}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedPlanId === p.id
                      ? 'border-[#bc0100] bg-red-50/50 dark:bg-white/10'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#2b1613] dark:text-white">
                      {p.name}
                    </span>
                    <input
                      type="radio"
                      name="assignPlanRadio"
                      checked={selectedPlanId === p.id}
                      onChange={() => setSelectedPlanId(p.id)}
                      disabled={saving}
                      className="text-[#bc0100] focus:ring-[#bc0100]"
                    />
                  </div>

                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="font-headline font-bold text-[#bc0100]">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {p.durationDays} Days
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Step 3: Select Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            disabled={saving}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium focus:border-[#bc0100] outline-none disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            disabled={saving}
            placeholder="Optional membership note..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium focus:border-[#bc0100] outline-none disabled:opacity-60"
          />
        </div>

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
              <span className="text-gray-400 block text-[10px]">
                Assigned Tier
              </span>
              <span className="font-bold text-sm text-[#2b1613] dark:text-white">
                {selectedPlan?.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px]">
                Total Price
              </span>
              <span className="font-bold text-sm text-[#bc0100] font-headline">
                ₹{(selectedPlan?.price ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px]">
                Start Date
              </span>
              <span className="font-medium text-[#2b1613] dark:text-white">
                {formatDisplayDate(startDate)}
              </span>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px]">
                Expiry Date
              </span>
              <span className="font-bold text-[#ba1a1a]">
                {calculatedExpiryDate
                  ? formatDisplayDate(calculatedExpiryDate)
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-300/30 bg-blue-50/40 dark:bg-blue-950/20 p-3 text-[11px] text-blue-800 dark:text-blue-200">
          Payment collection will be connected to the real Payments module
          separately. This step only creates the membership record, so we do
          not create a fake or local-only payment.
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-black/5 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              !selectedMember ||
              !selectedPlan ||
              activePlans.length === 0
            }
            className="px-6 py-2.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              {saving ? 'progress_activity' : 'check_circle'}
            </span>
            <span>{saving ? 'Assigning...' : 'Confirm & Assign Pass'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
