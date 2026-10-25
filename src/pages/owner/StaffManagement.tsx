import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Check, X, 
  Lock, Edit3, Trash2, Key, Phone, Mail, AlertTriangle 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../components/common/Toast';
import { StaffPermissions } from '../../types';

export const StaffManagement: React.FC = () => {
  const { staffList, addStaff, updateStaffPermissions } = useGym();
  const { addToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPermissionsStaffId, setEditingPermissionsStaffId] = useState<string | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Add Staff
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: ''
  });

  // Editing permissions state
  const [currentPerms, setCurrentPerms] = useState<StaffPermissions | null>(null);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatarUrl: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=120&q=80`
    });
    setIsAddModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addToast('Please provide a name and email for the staff member.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const result = await addStaff({
      staffId: `staff-${Date.now()}`,
      staffName: formData.name,
      staffEmail: formData.email,
      role: 'STAFF',
      canManageMembers: true,
      canManageMemberships: true,
      canRecordPayments: true,
      canManageAttendance: true,
      canViewReports: false,
      isActive: true,
      assignedBranch: 'Main Branch'
      });
      setGeneratedCredentials(result.credentials);
      addToast(`Staff account created for ${formData.name}. Save the one-time password shown below.`, 'success');
      setIsAddModalOpen(false);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create staff account.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPermissions = (staffId: string) => {
    const perm = staffList.find(s => s.staffId === staffId);
    if (perm) {
      setCurrentPerms(perm);
      setEditingPermissionsStaffId(staffId);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingPermissionsStaffId || !currentPerms) return;
    try {
      await updateStaffPermissions(editingPermissionsStaffId, {
        canManageMembers: currentPerms.canManageMembers,
        canManageMemberships: currentPerms.canManageMemberships,
        canRecordPayments: currentPerms.canRecordPayments,
        canManageAttendance: currentPerms.canManageAttendance,
        canViewReports: currentPerms.canViewReports
      });
      addToast('Staff RBAC permissions updated successfully.', 'success');
      setEditingPermissionsStaffId(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update staff permissions.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#bc0100]"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-bold">Access Governance & RBAC</span>
          </div>
          <h1 className="text-3xl font-black text-[#2b1613] dark:text-white tracking-tight font-display">
            Staff & Role Permissions
          </h1>
          <p className="text-sm text-[#603e39] dark:text-slate-400 mt-1">
            Provision front desk attendants, trainers, and configure granular permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-[#bc0100] hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-md shadow-red-600/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map(staff => {
          return (
            <div
              key={staff.staffId}
              className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-slate-800 border border-[#ebbbb4]/40 dark:border-slate-700 flex items-center justify-center font-bold text-lg text-red-600 dark:text-white">
                      {staff.staffName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2b1613] dark:text-white text-base">{staff.staffName}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {staff.role}
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${staff.isActive ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' : 'text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-slate-800'}`}>
                    {staff.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-slate-400 border-t border-[#ebbbb4]/30 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                    <span>{staff.staffEmail}</span>
                  </div>
                  {staff.assignedBranch && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 dark:text-slate-500 font-mono">Branch:</span>
                      <span className="text-gray-700 dark:text-slate-300">{staff.assignedBranch}</span>
                    </div>
                  )}
                </div>

                {/* Permissions Badges */}
                <div className="mt-4 pt-3 border-t border-[#ebbbb4]/30 dark:border-slate-800/80">
                  <p className="text-[11px] font-mono text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Granted Authorities:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${staff.canManageMembers ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300' : 'bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-slate-600 line-through'}`}>
                      Members CRUD
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${staff.canManageMemberships ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300' : 'bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-slate-600 line-through'}`}>
                      Renew/Assign
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${staff.canRecordPayments ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300' : 'bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-slate-600 line-through'}`}>
                      Payments
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${staff.canManageAttendance ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300' : 'bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-slate-600 line-through'}`}>
                      Turnstiles
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${staff.canViewReports ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300' : 'bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-slate-600 line-through'}`}>
                      Analytics
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-3 border-t border-[#ebbbb4]/30 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleOpenPermissions(staff.staffId)}
                  className="text-xs font-mono text-gray-700 dark:text-slate-300 hover:text-[#bc0100] dark:hover:text-white flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#bc0100]" />
                  Edit Permissions
                </button>

                <button
                  onClick={async () => {
                    try {
                      await updateStaffPermissions(staff.staffId, { isActive: !staff.isActive });
                      addToast(`Account status for ${staff.staffName} toggled.`, 'info');
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : 'Unable to update staff status.', 'error');
                    }
                  }}
                  className="text-xs font-mono text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  {staff.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4] dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-[#2b1613] dark:text-white">Add Staff Attendant</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Staff members can check in members, record payments, and manage active passes.
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikas Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vikas@warriorfitness.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-600 dark:text-slate-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600 mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#ebbbb4]/30 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#bc0100] hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingPermissionsStaffId && currentPerms && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4] dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-[#2b1613] dark:text-white">Configure Staff Permissions</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Toggle capabilities permitted for this staff role. Changes take effect on next login.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 cursor-pointer hover:border-red-400 dark:hover:border-slate-700">
                <div>
                  <span className="text-sm font-bold text-[#2b1613] dark:text-white block">Manage Members (Add / Edit)</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Can create member records and edit profiles</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentPerms.canManageMembers}
                  onChange={(e) => setCurrentPerms({ ...currentPerms, canManageMembers: e.target.checked })}
                  className="w-5 h-5 accent-[#bc0100] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 cursor-pointer hover:border-red-400 dark:hover:border-slate-700">
                <div>
                  <span className="text-sm font-bold text-[#2b1613] dark:text-white block">Assign & Renew Memberships</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Can apply plan tiers and extend validity</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentPerms.canManageMemberships}
                  onChange={(e) => setCurrentPerms({ ...currentPerms, canManageMemberships: e.target.checked })}
                  className="w-5 h-5 accent-[#bc0100] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 cursor-pointer hover:border-red-400 dark:hover:border-slate-700">
                <div>
                  <span className="text-sm font-bold text-[#2b1613] dark:text-white block">Record Payments & Receipts</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Can collect cash, UPI, or card payments</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentPerms.canRecordPayments}
                  onChange={(e) => setCurrentPerms({ ...currentPerms, canRecordPayments: e.target.checked })}
                  className="w-5 h-5 accent-[#bc0100] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 cursor-pointer hover:border-red-400 dark:hover:border-slate-700">
                <div>
                  <span className="text-sm font-bold text-[#2b1613] dark:text-white block">Attendance & Turnstile Gate Override</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Can manual check-in members and unlock gates</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentPerms.canManageAttendance}
                  onChange={(e) => setCurrentPerms({ ...currentPerms, canManageAttendance: e.target.checked })}
                  className="w-5 h-5 accent-[#bc0100] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 cursor-pointer hover:border-red-400 dark:hover:border-slate-700">
                <div>
                  <span className="text-sm font-bold text-[#2b1613] dark:text-white block">Financial Analytics & Export Reports</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Can view total revenue breakdown and download CSV</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentPerms.canViewReports}
                  onChange={(e) => setCurrentPerms({ ...currentPerms, canViewReports: e.target.checked })}
                  className="w-5 h-5 accent-[#bc0100] rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#ebbbb4]/30 dark:border-slate-800">
              <button
                onClick={() => setEditingPermissionsStaffId(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-[#bc0100] hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
      {generatedCredentials && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Staff Login Created</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Save these credentials now. The password is shown only once.</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-950 p-3">
                <div className="text-[10px] uppercase font-mono text-slate-500">Email</div>
                <div className="font-mono text-sm text-slate-900 dark:text-white break-all">{generatedCredentials.email}</div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-950 p-3">
                <div className="text-[10px] uppercase font-mono text-slate-500">Temporary Password</div>
                <div className="font-mono text-sm text-slate-900 dark:text-white break-all select-all">{generatedCredentials.password}</div>
              </div>
            </div>
            <button onClick={() => setGeneratedCredentials(null)} className="mt-5 w-full py-2.5 rounded-xl bg-[#bc0100] text-white font-bold">I saved the credentials</button>
          </div>
        </div>
      )}

    </div>
  );
};
