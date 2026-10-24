/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MembershipPlan } from '../../types';
import {
  createSupabaseMembershipPlan,
  updateSupabaseMembershipPlan,
} from '../../services/supabaseMemberships';
import { useGym } from '../../context/GymContext';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

export const MembershipPlans: React.FC = () => {
  const { plans, refreshAll } = useGym();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDuration, setFormDuration] = useState(30);
  const [formPrice, setFormPrice] = useState(1000);
  const [formFeatures, setFormFeatures] = useState('');
  const [formBadge, setFormBadge] = useState('STANDARD');
  const [formActive, setFormActive] = useState(true);

  const openCreate = () => {
    setEditingPlan(null);
    setFormName('');
    setFormDesc('');
    setFormDuration(30);
    setFormPrice(1000);
    setFormFeatures('Standard floor access\nLocker room access\nShower facilities');
    setFormBadge('STANDARD');
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormDesc(plan.description);
    setFormDuration(plan.durationDays);
    setFormPrice(plan.price);
    setFormFeatures(plan.features.join('\n'));
    setFormBadge(plan.tierBadge || 'TIER');
    setFormActive(plan.isActive);
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast('Validation Error', 'Plan name is required.', 'error');
      return;
    }

    if (formPrice < 0 || formDuration <= 0) {
      showToast('Validation Error', 'Price must be >= 0 and duration > 0 days.', 'error');
      return;
    }

    const featureList = formFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    setSaving(true);

    try {
      if (editingPlan) {
        await updateSupabaseMembershipPlan(editingPlan.id, {
          name: formName,
          description: formDesc,
          durationDays: Number(formDuration),
          price: Number(formPrice),
          features: featureList,
          tierBadge: formBadge,
          isActive: formActive,
        });

        showToast('Plan Updated', `Saved "${formName}".`, 'success');
      } else {
        await createSupabaseMembershipPlan({
          name: formName,
          description: formDesc,
          durationDays: Number(formDuration),
          price: Number(formPrice),
          features: featureList,
          tierBadge: formBadge,
          isPopular: false,
          isActive: formActive,
        });

        showToast('Plan Created', `"${formName}" was created.`, 'success');
      }

      await refreshAll();
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast(
        'Save Failed',
        error instanceof Error ? error.message : 'Unable to save membership plan.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: MembershipPlan) => {
    try {
      await updateSupabaseMembershipPlan(plan.id, {
        isActive: !plan.isActive,
      });
      await refreshAll();

      showToast(
        plan.isActive ? 'Plan Deactivated' : 'Plan Activated',
        `"${plan.name}" is now ${plan.isActive ? 'disabled' : 'available'}.`,
        'info'
      );
    } catch (error) {
      console.error(error);
      showToast(
        'Update Failed',
        error instanceof Error ? error.message : 'Unable to update plan.',
        'error'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ebbbb4]/40 dark:border-white/10">
        <div>
          <h1 className="font-headline font-bold text-2xl text-[#2b1613] dark:text-white tracking-tight">
            Membership Plans Builder
          </h1>
          <p className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5">
            Configure membership packages, pricing tiers, durations, and privileges
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold font-headline shadow-md transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">add_circle</span>
          Create New Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/10 p-10 text-center">
          <p className="font-headline font-bold text-lg text-[#2b1613] dark:text-white">
            No membership plans yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create the first plan to make it available for enrollment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between bg-white dark:bg-[#1a0f0e] ${
                plan.isActive
                  ? 'border-[#ebbbb4]/50 dark:border-white/10'
                  : 'border-gray-200 dark:border-white/5 opacity-60 bg-gray-50 dark:bg-white/5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bc0100] font-mono">
                    {plan.tierBadge || 'WARRIOR PASS'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10">
                    {plan.isActive ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>

                <h3 className="font-headline font-bold text-lg text-[#2b1613] dark:text-white mt-1">
                  {plan.name}
                </h3>
                <p className="text-xs text-[#603e39] dark:text-gray-400 mt-1">{plan.description}</p>

                <div className="my-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-baseline gap-1">
                  <span className="font-headline font-extrabold text-2xl text-[#bc0100]">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-400">/ {plan.durationDays} days</span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-6">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Features:</span>
                  {plan.features.length === 0 ? (
                    <span className="text-gray-400">No features listed.</span>
                  ) : (
                    plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-emerald-600 text-sm">check</span>
                        <span>{feature}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                <button
                  onClick={() => void toggleActive(plan)}
                  className="text-gray-500 hover:text-black dark:hover:text-white font-medium"
                >
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => openEdit(plan)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-black/5 text-[#bc0100] font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Membership Plan'}
        subtitle="Specify validity days, pricing, and perks"
        icon="credit_card"
        maxWidth="md"
      >
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Short Description
            </label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Duration (days) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Price (INR) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Tier Badge
            </label>
            <input
              type="text"
              value={formBadge}
              onChange={(e) => setFormBadge(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Features (one per line)
            </label>
            <textarea
              rows={4}
              value={formFeatures}
              onChange={(e) => setFormFeatures(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
            <input
              type="checkbox"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
            />
            Active for checkout and enrollment
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#bc0100] text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
