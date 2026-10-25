/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Member, MemberStatus, MembershipStatus } from '../../types';
import { useGym } from '../../context/GymContext';
import { formatDisplayDate, getDaysRemaining } from '../../utils/dateUtils';
import { MemberDetailModal } from './MemberDetailModal';
import { AssignMembershipModal } from './AssignMembershipModal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { createSupabaseMember } from '../../services/supabaseMemberMutations';
import { provisionMemberAccount } from '../../services/supabaseMemberAccounts';

export const MembersManagement: React.FC = () => {
  const {
    members,
    memberships,
    updateMember,
    refreshAll,
    toggleMemberStatus,
    deleteMember,
    renewMembership,
    checkInMember,
    recordPayment,
    plans,
  } = useGym();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'expiryDate'>('expiryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [assignMember, setAssignMember] = useState<Member | null>(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<Member | null>(null);
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [provisioningMemberId, setProvisioningMemberId] = useState<string | null>(null);

  // Add/Edit Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formDob, setFormDob] = useState('1995-01-01');
  const [formEmergency, setFormEmergency] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Map memberships for easy access
  const membershipMap = useMemo(() => {
    const map = new Map<string, typeof memberships[0]>();
    memberships.forEach(m => {
      // Keep most recent
      const existing = map.get(m.memberId);
      if (!existing || new Date(m.expiryDate) > new Date(existing.expiryDate)) {
        map.set(m.memberId, m);
      }
    });
    return map;
  }, [memberships]);

  // Filtered & sorted members
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.phone.includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.memberCode.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const mship = membershipMap.get(member.id);
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ACTIVE') return member.status === 'ACTIVE';
      if (statusFilter === 'INACTIVE') return member.status === 'INACTIVE';
      if (statusFilter === 'EXPIRING_SOON') return mship?.status === 'EXPIRING_SOON';
      if (statusFilter === 'EXPIRED') return mship?.status === 'EXPIRED';

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'joinDate') {
        return sortOrder === 'asc'
          ? new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
          : new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      }
      if (sortBy === 'expiryDate') {
        const m1 = membershipMap.get(a.id);
        const m2 = membershipMap.get(b.id);
        const t1 = m1 ? new Date(m1.expiryDate).getTime() : 0;
        const t2 = m2 ? new Date(m2.expiryDate).getTime() : 0;
        return sortOrder === 'asc' ? t1 - t2 : t2 - t1;
      }
      return 0;
    });
  }, [members, searchQuery, statusFilter, sortBy, sortOrder, membershipMap]);

  // Pagination slice
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormPhone('+91 ');
    setFormEmail('');
    setFormGender('Male');
    setFormDob('1995-01-01');
    setFormEmergency('');
    setFormAddress('');
    setAddMemberModalOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormPhone(m.phone);
    setFormEmail(m.email);
    setFormGender(m.gender || 'Male');
    setFormDob(m.dateOfBirth || '1995-01-01');
    setFormEmergency(m.emergencyContact || '');
    setFormAddress(m.address || '');
    setEditMemberModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      showToast('Validation Error', 'Name and phone are required.', 'error');
      return;
    }
    if (!formEmail.trim()) {
      showToast('Login Email Required', 'Enter the member email so the system can create their login account.', 'error');
      return;
    }

    try {
      const created = await createSupabaseMember({
        name: formName,
        phone: formPhone,
        email: formEmail,
        gender: formGender,
        dateOfBirth: formDob,
        emergencyContact: formEmergency,
        address: formAddress,
        joinDate: new Date().toISOString().slice(0, 10),
      });

      const credentials = await provisionMemberAccount(created.id);
      void refreshAll();
      setAddMemberModalOpen(false);
      setLoginCredentials({ name: created.name, email: credentials.email, password: credentials.password });
      showToast('Member + Login Created! 🎉', `${created.name} can now sign in.`, 'success');
    } catch (err: any) {
      showToast('Member Creation Failed', err?.message || 'Unable to create member.', 'error');
    }
  };

  const handleProvisionLogin = async (member: Member) => {
    if (member.userId) {
      showToast('Login Already Exists', `${member.name} already has a linked login account.`, 'info');
      return;
    }
    if (!member.email?.trim()) {
      showToast('Email Required', 'Add the member email first, then create their login.', 'error');
      return;
    }

    try {
      setProvisioningMemberId(member.id);
      const credentials = await provisionMemberAccount(member.id);
      void refreshAll();
      setLoginCredentials({ name: member.name, email: credentials.email, password: credentials.password });
      showToast('Login Created', `${member.name} now has a customer login.`, 'success');
    } catch (err: any) {
      showToast('Login Creation Failed', err?.message || 'Unable to create login.', 'error');
    } finally {
      setProvisioningMemberId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      await updateMember(editingMember.id, {
        name: formName,
        phone: formPhone,
        email: formEmail,
        gender: formGender,
        dateOfBirth: formDob,
        emergencyContact: formEmergency,
        address: formAddress,
      });
      setEditMemberModalOpen(false);
      showToast('Member Updated', `Saved profile details for ${formName}.`, 'success');
    } catch (err: any) {
      showToast('Update Failed', err?.message || 'Unable to update member.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmMember) return;
    const member = deleteConfirmMember;

    try {
      await deleteMember(member.id);
      setDeleteConfirmMember(null);
      showToast('Member Deleted', `${member.name} was removed from the live database.`, 'success');
    } catch (err: any) {
      showToast('Delete Failed', err?.message || 'Unable to delete member.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ebbbb4]/40 dark:border-white/10">
        <div>
          <h1 className="font-headline font-bold text-2xl text-[#2b1613] dark:text-white tracking-tight">
            Members Directory
          </h1>
          <p className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5">
            Manage athlete accounts, membership validity, door passes, and contacts
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold font-headline shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>Add New Member</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl p-4 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, phone, email, or #M-ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 text-xs font-medium focus:border-[#bc0100] outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {(['ALL', 'ACTIVE', 'INACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map(f => (
            <button
              key={f}
              onClick={() => {
                setStatusFilter(f);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                statusFilter === f
                  ? 'bg-[#bc0100] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {f === 'ALL'
                ? 'All Members'
                : f === 'ACTIVE'
                ? 'Active'
                : f === 'INACTIVE'
                ? 'Inactive'
                : f === 'EXPIRING_SOON'
                ? 'Expiring (< 7d)'
                : 'Expired'}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium"
          >
            <option value="expiryDate">Expiry Date</option>
            <option value="name">Name</option>
            <option value="joinDate">Join Date</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-black/5"
            title="Toggle sort direction"
          >
            <span className="material-symbols-outlined text-sm">
              {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 bg-[#fff8f6] dark:bg-white/5 text-[10px] uppercase font-bold text-gray-500 font-label-caps tracking-wider">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Phone / Email</th>
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                    No members match your search or filter.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map(member => {
                  const mship = membershipMap.get(member.id);
                  const days = mship ? getDaysRemaining(mship.expiryDate) : 0;
                  const mStatus: MembershipStatus = mship ? mship.status : 'EXPIRED';

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-red-50/30 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Name & Photo */}
                      <td className="py-3 px-4 font-semibold text-[#2b1613] dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#bc0100] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {member.profilePhoto ? (
                              <img src={member.profilePhoto} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="block font-bold">{member.name}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              Coach: {member.assignedCoach || 'None'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Member ID */}
                      <td className="py-3 px-4 font-mono font-bold text-[#bc0100]">
                        {member.memberCode}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        <div>{member.phone}</div>
                        <div className="text-[10px] text-gray-400">{member.email}</div>
                      </td>

                      {/* Plan */}
                      <td className="py-3 px-4 font-medium text-[#2b1613] dark:text-white">
                        {mship ? mship.planName : <span className="text-gray-400">No active plan</span>}
                      </td>

                      {/* Start */}
                      <td className="py-3 px-4 text-gray-500 font-mono">
                        {mship ? formatDisplayDate(mship.startDate) : '—'}
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-4 font-mono">
                        {mship ? (
                          <div>
                            <span className={`font-bold ${days < 0 ? 'text-[#ba1a1a]' : days <= 7 ? 'text-amber-600' : 'text-gray-700 dark:text-gray-200'}`}>
                              {formatDisplayDate(mship.expiryDate)}
                            </span>
                            <span className="block text-[10px] text-gray-400">
                              {days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            mStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : mStatus === 'EXPIRING_SOON'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              mStatus === 'ACTIVE'
                                ? 'bg-emerald-600 status-pulse'
                                : mStatus === 'EXPIRING_SOON'
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          <span>{mStatus === 'EXPIRING_SOON' ? 'EXPIRING' : mStatus}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailMember(member)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#bc0100] hover:bg-black/5 dark:hover:bg-white/10"
                            title="View Full Dossier"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>

                          <button
                            onClick={async () => {
                              try {
                                await renewMembership({
                                  memberId: member.id,
                                  recordPaymentNow: true,
                                  performedBy: 'Staff One-Click',
                                });
                                showToast('Pass Renewed! 🎉', `Extended pass for ${member.name}.`, 'success');
                              } catch (err: any) {
                                showToast('Renewal Failed', err.message, 'error');
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-black/5 dark:hover:bg-white/10"
                            title="1-Click Instant Renew"
                          >
                            <span className="material-symbols-outlined text-lg">autorenew</span>
                          </button>

                          {!member.userId && (
                            <button
                              onClick={() => void handleProvisionLogin(member)}
                              disabled={provisioningMemberId === member.id}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
                              title="Create Member Login"
                            >
                              <span className="material-symbols-outlined text-lg">key</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
                            title="Edit Member"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>

                          <button
                            onClick={() => setDeleteConfirmMember(member)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Delete Member"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {Math.min(filteredMembers.length, (currentPage - 1) * pageSize + 1)} to{' '}
            {Math.min(filteredMembers.length, currentPage * pageSize)} of {filteredMembers.length} members
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 font-bold text-gray-700 dark:text-gray-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Member Details Modal */}
      <MemberDetailModal
        isOpen={detailMember !== null}
        onClose={() => setDetailMember(null)}
        member={detailMember}
        onEdit={m => {
          setDetailMember(null);
          handleOpenEdit(m);
        }}
        onRenew={async m => {
          try {
            await renewMembership({ memberId: m.id, recordPaymentNow: true });
            showToast('Pass Renewed! 🎉', `Extended pass for ${m.name}.`, 'success');
          } catch (err: any) {
            showToast('Renewal Failed', err.message, 'error');
          }
        }}
        onAssignPlan={m => {
          setDetailMember(null);
          setAssignMember(m);
        }}
        onRecordPayment={async m => {
          try {
            await recordPayment({
              memberId: m.id,
              memberName: m.name,
              memberCode: m.memberCode,
              amount: 3500,
              paymentDate: new Date().toISOString().slice(0, 10),
              paymentMethod: 'UPI',
              transactionReference: `TXN-WRR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
              status: 'PAID',
              recordedBy: 'Owner',
              notes: 'Manual desk payment recorded',
            });
            showToast('Payment Recorded', `₹3,500 recorded for ${m.name}.`, 'success');
          } catch (err: any) {
            showToast('Payment Failed', err?.message || 'Unable to record payment.', 'error');
          }
        }}
        onMarkAttendance={async m => {
          try {
            await checkInMember(m.id);
            showToast('Check-In Successful', `${m.name} checked in at turnstile gate.`, 'success');
          } catch (err: any) {
            showToast('Attendance', err.message, 'info');
          }
        }}
        onToggleStatus={async m => {
          try {
            await toggleMemberStatus(m.id);
            showToast('Status Updated', `Updated status for ${m.name}.`, 'info');
          } catch (err: any) {
            showToast('Status Update Failed', err?.message || 'Unable to update member status.', 'error');
          }
        }}
      />

      {/* Assign Membership Modal */}
      <AssignMembershipModal
        isOpen={assignMember !== null}
        onClose={() => setAssignMember(null)}
        initialMember={assignMember}
      />

      {/* Delete Member Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmMember !== null}
        onClose={() => setDeleteConfirmMember(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Gym Member"
        message={`Are you sure you want to permanently delete member ${deleteConfirmMember?.name} (${deleteConfirmMember?.memberCode})? This action will remove all linked passes and cannot be undone.`}
        confirmText="Delete Member"
        isDestructive={true}
      />

      {/* One-time member login credentials */}
      <Modal
        isOpen={loginCredentials !== null}
        onClose={() => setLoginCredentials(null)}
        title="Member Login Created"
        subtitle="Save these credentials — the generated password is shown only once."
        icon="key"
        maxWidth="md"
      >
        {loginCredentials && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{loginCredentials.name}</p>
              <p className="text-xs text-gray-500 mt-1">Customer account is linked to the member record.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Login Email</label>
              <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 font-mono text-sm">{loginCredentials.email}</div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">System Generated Password</label>
              <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 font-mono text-sm select-all">{loginCredentials.password}</div>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">Give these credentials to the member securely. The password is not stored in the member table.</p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setLoginCredentials(null)} className="px-5 py-2.5 rounded-xl bg-[#bc0100] text-white text-xs font-bold">Done</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={addMemberModalOpen || editMemberModalOpen}
        onClose={() => {
          setAddMemberModalOpen(false);
          setEditMemberModalOpen(false);
        }}
        title={addMemberModalOpen ? 'Add New Member' : `Edit Member: ${editingMember?.name}`}
        subtitle="Physical access record and directory profile"
        icon="person"
        maxWidth="lg"
      >
        <form onSubmit={addMemberModalOpen ? handleSaveAdd : handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Mobile Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Email Address {addMemberModalOpen && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                required={addMemberModalOpen}
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <select
                value={formGender}
                onChange={e => setFormGender(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formDob}
                onChange={e => setFormDob(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={formEmergency}
                onChange={e => setFormEmergency(e.target.value)}
                placeholder="Name & Contact number"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea
              rows={2}
              value={formAddress}
              onChange={e => setFormAddress(e.target.value)}
              placeholder="Full street address..."
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setAddMemberModalOpen(false);
                setEditMemberModalOpen(false);
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              {addMemberModalOpen ? 'Create Member Profile' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
