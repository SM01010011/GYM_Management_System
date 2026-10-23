import React, { useState } from 'react';
import { 
  Settings, Building2, Phone, Mail, MapPin, 
  DollarSign, ShieldAlert, RotateCcw, Save, CheckCircle2, Lock 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../components/common/Toast';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSeedData } = useGym();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    gymName: settings.gymName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    currency: settings.currency,
    gstRate: settings.gstRate,
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isEmergencyUnlockOpen, setIsEmergencyUnlockOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    addToast('Facility parameters and business configuration saved.', 'success');
  };

  const handleEmergencyUnlock = () => {
    updateSettings({ emergencyTurnstileUnlocked: true });
    addToast('EMERGENCY PROTOCOL ACTIVATED: All turnstile brakes released.', 'warning');
    setIsEmergencyUnlockOpen(false);
  };

  const handleResetData = () => {
    resetSeedData();
    addToast('Database restored to clean default enterprise state.', 'info');
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#bc0100]"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-bold">Facility Configuration</span>
          </div>
          <h1 className="text-3xl font-black text-[#2b1613] dark:text-white tracking-tight font-display">
            Gym Settings & Policies
          </h1>
          <p className="text-sm text-[#603e39] dark:text-slate-400 mt-1">
            Configure enterprise parameters, turnstile hardware interfaces, and tax credentials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Identity */}
        <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center gap-2 text-[#2b1613] dark:text-white font-bold text-lg border-b border-[#ebbbb4]/30 dark:border-slate-800/80 pb-3">
            <Building2 className="w-5 h-5 text-[#bc0100]" />
            <span>Gym Identity & Contact</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Facility Name</label>
              <input
                type="text"
                value={formData.gymName}
                onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2.5 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Support Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2.5 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Support Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2.5 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Billing Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2.5 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2.5 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
              />
            </div>
          </div>
        </div>

        {/* Turnstile Access Policy */}
        <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center gap-2 text-[#2b1613] dark:text-white font-bold text-lg border-b border-[#ebbbb4]/30 dark:border-slate-800/80 pb-3">
            <Lock className="w-5 h-5 text-[#bc0100]" />
            <span>Turnstile Access & Financial Policies</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">GST / Sales Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2.5 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
              />
              <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-1">Standard tax percentage applied on membership receipts.</p>
            </div>

            <div>
              <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Active Campus Branch</label>
              <div className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2.5 text-gray-800 dark:text-slate-300 text-sm font-mono mt-1">
                {settings.activeBranch || 'Downtown HQ'}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-1">Hardware access gates connected to this console.</p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#bc0100] hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-md shadow-red-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>

      {/* Critical Owner Operations */}
      <div className="bg-white dark:bg-slate-900 border border-rose-900/30 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg border-b border-[#ebbbb4]/30 dark:border-slate-800/80 pb-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-500" />
          <span>Restricted Owner Operations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-[#2b1613] dark:text-white text-sm">Emergency Turnstile Solenoid Release</h4>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                De-energizes all brake solenoids across all facility gates immediately for fire or medical evacuation.
              </p>
            </div>
            <button
              onClick={() => setIsEmergencyUnlockOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-600/30 text-xs font-mono font-bold transition-colors w-fit cursor-pointer"
            >
              Trigger Emergency Unlock
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-[#2b1613] dark:text-white text-sm">Restore Default Demo Data</h4>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                Resets members, tiers, payments, and turnstile logs to the pristine seed demonstration dataset.
              </p>
            </div>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700 text-xs font-mono font-bold transition-colors w-fit flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              Reset System Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isEmergencyUnlockOpen}
        title="EMERGENCY TURNSTILE OVERRIDE"
        message="This will release the physical magnetic lock on all facility turnstiles immediately. Free passage will remain active until manually re-armed."
        confirmLabel="Confirm Solenoid Release"
        isDestructive={true}
        onConfirm={handleEmergencyUnlock}
        onCancel={() => setIsEmergencyUnlockOpen(false)}
      />

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Reset Demo Dataset"
        message="Are you sure you want to reset the database? All custom members, transactions, and logs will be restored to default seed values."
        confirmLabel="Reset Everything"
        isDestructive={true}
        onConfirm={handleResetData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
