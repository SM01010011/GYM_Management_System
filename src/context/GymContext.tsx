/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Member,
  Membership,
  MembershipPlan,
  Payment,
  Attendance,
  MembershipHistory,
  StaffPermissions,
  ActivityLog,
  AppNotification,
  RenewalRequest,
  GymSettings
} from '../types';
import { gymStorage } from '../services/storage';
import { getSupabaseMembers } from '../services/supabaseMembers';
import {
  createSupabaseMember,
  updateSupabaseMember,
  toggleSupabaseMemberStatus,
  deleteSupabaseMember,
} from '../services/supabaseMemberMutations';
import { deleteSupabaseMember } from '../services/supabaseMemberMutations';
import {
  getSupabaseMembershipPlans,
  getSupabaseMemberships,
  createSupabaseMembership,
  renewSupabaseMembership,
  cancelSupabaseMembership,
  createSupabaseMembershipPlan,
  updateSupabaseMembershipPlan,
} from '../services/supabaseMemberships';
import { getSupabasePayments, createSupabasePayment, refundSupabasePayment } from '../services/supabasePayments';
import {
  getSupabaseAttendance,
  checkInMemberSupabase,
  checkOutMemberSupabase,
} from '../services/supabaseAttendance';
import { getTodayDateString } from '../utils/dateUtils';
import { getSupabaseStaff, updateSupabaseStaffPermissions, provisionSupabaseStaffAccount } from '../services/supabaseStaff';

interface GymStats {
  totalMembers: number;
  activeMembers: number;
  expiringSoon: number;
  expiredMembers: number;
  monthlyRevenue: number;
  todayRevenue: number;
  todayAttendance: number;
  checkedInNow: number;
  staffOnDuty: number;
}

interface GymContextType {
  members: Member[];
  memberships: Membership[];
  plans: MembershipPlan[];
  payments: Payment[];
  attendance: Attendance[];
  history: MembershipHistory[];
  staffList: StaffPermissions[];
  activityLogs: ActivityLog[];
  notifications: AppNotification[];
  renewalRequests: RenewalRequest[];
  settings: GymSettings;
  stats: GymStats;
  loading: boolean;
  refreshAll: () => void;

  // Actions
  addMember: (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<Member>;
  toggleMemberStatus: (id: string) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;

  addPlan: (data: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MembershipPlan>;
  updatePlan: (id: string, updates: Partial<MembershipPlan>) => Promise<MembershipPlan>;

  assignMembership: (params: {
    memberId: string;
    planId: string;
    startDate: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }) => Promise<{ membership: Membership; payment?: Payment }>;

  renewMembership: (params: {
    memberId: string;
    planId?: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }) => Promise<{ membership: Membership; payment?: Payment }>;

  recordPayment: (data: Omit<Payment, 'id' | 'createdAt'>) => Promise<Payment>;
  undoPayment: (paymentIdOrTxn: string, performedBy?: string) => Promise<{ success: boolean; message: string }>;
  cancelMembership: (membershipId: string, performedBy?: string) => Promise<void>;

  checkInMember: (memberId: string, gate?: string, authMethod?: string) => Promise<Attendance>;
  checkOutMember: (attendanceId: string) => Promise<Attendance>;

  updateStaffPermissions: (staffId: string, updates: Partial<StaffPermissions>) => Promise<StaffPermissions>;
  addStaff: (data: Omit<StaffPermissions, 'updatedAt'>) => Promise<{ staff: StaffPermissions; credentials: { email: string; password: string } }>;

  createRenewalRequest: (params: { memberId: string; requestedPlanId: string; notes?: string }) => RenewalRequest;
  processRenewalRequest: (requestId: string, approved: boolean) => RenewalRequest;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  updateSettings: (updates: Partial<GymSettings>) => GymSettings;
  resetSeedData: () => void;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);

  // Members are now read from Supabase.
  // Other application data remains on gymStorage temporarily
  // while we migrate each domain incrementally.
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [history, setHistory] = useState<MembershipHistory[]>(() => gymStorage.getHistory());
  const [staffList, setStaffList] = useState<StaffPermissions[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => gymStorage.getActivityLogs());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => gymStorage.getNotifications());
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>(() => gymStorage.getRenewalRequests());
  const [settings, setSettings] = useState<GymSettings>(() => gymStorage.getSettings());

  const refreshAll = useCallback(async () => {
    setLoading(true);

    try {
      const [
        membersResult,
        membershipsResult,
        plansResult,
        attendanceResult,
        paymentsResult,
        staffResult,
      ] = await Promise.allSettled([
        getSupabaseMembers(),
        getSupabaseMemberships(),
        getSupabaseMembershipPlans(),
        getSupabaseAttendance(),
        getSupabasePayments(),
        getSupabaseStaff(),
      ]);

      const loadedMembers =
        membersResult.status === 'fulfilled' ? membersResult.value : [];

      if (membersResult.status === 'fulfilled') {
        setMembers(loadedMembers);
      } else {
        console.error('Failed to load members from Supabase:', membersResult.reason);
      }

      if (membershipsResult.status === 'fulfilled') {
        setMemberships(membershipsResult.value);
      } else {
        console.error('Failed to load memberships from Supabase:', membershipsResult.reason);
      }

      if (plansResult.status === 'fulfilled') {
        setPlans(plansResult.value);
      } else {
        console.error('Failed to load membership plans from Supabase:', plansResult.reason);
      }

      if (attendanceResult.status === 'fulfilled') {
        const memberMap = new Map(loadedMembers.map(member => [member.id, member]));

        setAttendance(
          attendanceResult.value.map(record => {
            const member = memberMap.get(record.member_id);

            return {
              id: record.id,
              memberId: record.member_id,
              memberName: member?.name ?? 'Unknown member',
              memberCode: member?.memberCode ?? `#${record.member_id.slice(0, 8)}`,
              checkIn: record.checked_in_at,
              ...(record.checked_out_at ? { checkOut: record.checked_out_at } : {}),
              markedBy: record.recorded_by ?? 'Staff',
              gate: 'Supabase attendance',
              status: record.checked_out_at ? 'CHECKED_OUT' : 'CHECKED_IN',
              createdAt: record.created_at,
            };
          })
        );
      } else {
        console.error('Failed to load attendance from Supabase:', attendanceResult.reason);
      }

      if (paymentsResult.status === 'fulfilled') {
        setPayments(paymentsResult.value);
      } else {
        console.error('Failed to load payments from Supabase:', paymentsResult.reason);
      }

      if (staffResult.status === 'fulfilled') {
        setStaffList(staffResult.value);
      } else {
        console.error('Failed to load staff from Supabase:', staffResult.reason);
      }

      // Non-core compatibility domains remain on local storage.
      setHistory(gymStorage.getHistory());
      setStaffList(gymStorage.getStaffPermissions());
      setActivityLogs(gymStorage.getActivityLogs());
      setNotifications(gymStorage.getNotifications());
      setRenewalRequests(gymStorage.getRenewalRequests());
      setSettings(gymStorage.getSettings());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Compute live stats from data
  const todayStr = getTodayDateString();
  const currentMonthPrefix = todayStr.slice(0, 7); // e.g. "2026-10"

  const activeMemberships = memberships.filter(m => m.status === 'ACTIVE');
  const expiringMemberships = memberships.filter(m => m.status === 'EXPIRING_SOON');
  const expiredMemberships = memberships.filter(m => m.status === 'EXPIRED');

  const monthlyPayments = payments.filter(
    p => p.status === 'PAID' && p.paymentDate.startsWith(currentMonthPrefix)
  );
  const monthlyRevenue = monthlyPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const todayPayments = payments.filter(
    p => p.status === 'PAID' && p.paymentDate === todayStr
  );
  const todayRevenue = todayPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const todayAttendanceList = attendance.filter(a => a.checkIn.startsWith(todayStr));
  const checkedInNowList = attendance.filter(a => a.status === 'CHECKED_IN');
  const staffOnDuty = staffList.filter(s => s.isActive).length;

  const stats: GymStats = {
    totalMembers: members.length,
    activeMembers: activeMemberships.length,
    expiringSoon: expiringMemberships.length,
    expiredMembers: expiredMemberships.length,
    monthlyRevenue,
    todayRevenue,
    todayAttendance: todayAttendanceList.length,
    checkedInNow: checkedInNowList.length,
    staffOnDuty,
  };

  // Core business actions use Supabase as the single source of truth.
  const addMember = async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createSupabaseMember({
      name: data.name,
      phone: data.phone,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      emergencyContact: data.emergencyContact,
      emergencyRelation: data.emergencyRelation,
      joinDate: data.joinDate,
    });
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const updated = await updateSupabaseMember(id, {
      name: updates.name,
      phone: updates.phone,
      email: updates.email,
      dateOfBirth: updates.dateOfBirth,
      gender: updates.gender,
      address: updates.address,
      emergencyContact: updates.emergencyContact,
      emergencyRelation: updates.emergencyRelation,
      joinDate: updates.joinDate,
    });
    await refreshAll();
    return updated;
  };

  const toggleMemberStatus = async (id: string) => {
    const updated = await toggleSupabaseMemberStatus(id);
    await refreshAll();
    return updated;
  };

  const deleteMember = async (id: string) => {
    await deleteSupabaseMember(id);
    await refreshAll();
  };

  const addPlan = async (data: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const plan = await createSupabaseMembershipPlan(data);
    await refreshAll();
    return plan;
  };

  const updatePlan = async (id: string, updates: Partial<MembershipPlan>) => {
    const plan = await updateSupabaseMembershipPlan(id, updates);
    await refreshAll();
    return plan;
  };

  const assignMembership = async (params: {
    memberId: string;
    planId: string;
    startDate: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }) => {
    const membership = await createSupabaseMembership({
      memberId: params.memberId,
      planId: params.planId,
      startDate: params.startDate,
    });

    let payment: Payment | undefined;
    if (params.recordPaymentNow) {
      payment = await createSupabasePayment({
        memberId: params.memberId,
        memberName: membership.memberName,
        memberCode: membership.memberCode,
        membershipId: membership.id,
        amount: membership.price,
        paymentDate: params.startDate,
        paymentMethod: params.paymentMethod || 'UPI',
        transactionReference: `TXN-WRR-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'PAID',
        recordedBy: params.performedBy || 'Staff',
        notes: `Full payment for ${membership.planName}`,
      });
    }

    await refreshAll();
    return { membership, payment };
  };

  const renewMembership = async (params: {
    memberId: string;
    planId?: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }) => {
    const membership = await renewSupabaseMembership(params);

    let payment: Payment | undefined;
    if (params.recordPaymentNow) {
      payment = await createSupabasePayment({
        memberId: membership.memberId,
        memberName: membership.memberName,
        memberCode: membership.memberCode,
        membershipId: membership.id,
        amount: membership.price,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: params.paymentMethod || 'UPI',
        transactionReference: `TXN-WRR-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'PAID',
        recordedBy: params.performedBy || 'Staff',
        notes: `Renewal payment for ${membership.planName}`,
      });
    }

    await refreshAll();
    return { membership, payment };
  };

  const recordPayment = async (data: Omit<Payment, 'id' | 'createdAt'>) => {
    const payment = await createSupabasePayment(data);
    await refreshAll();
    return payment;
  };

  const undoPayment = async (paymentIdOrTxn: string) => {
    await refundSupabasePayment(paymentIdOrTxn);
    await refreshAll();
    return { success: true, message: 'Payment refunded successfully.' };
  };

  const cancelMembership = async (membershipId: string) => {
    await cancelSupabaseMembership(membershipId);
    await refreshAll();
  };

  const checkInMember = async (memberId: string, gate?: string, _authMethod?: string) => {
    const created = await checkInMemberSupabase({ memberId });
    await refreshAll();

    const member = members.find(m => m.id === created.member_id);

    return {
      id: created.id,
      memberId: created.member_id,
      memberName: member?.name ?? 'Unknown member',
      memberCode: member?.memberCode ?? `#${created.member_id.slice(0, 8)}`,
      checkIn: created.checked_in_at,
      ...(created.checked_out_at ? { checkOut: created.checked_out_at } : {}),
      markedBy: created.recorded_by ?? 'Staff',
      gate: gate ?? 'Manual Desk Override',
      status: created.checked_out_at ? 'CHECKED_OUT' : 'CHECKED_IN',
      createdAt: created.created_at,
    };
  };

  const checkOutMember = async (attendanceId: string) => {
    const updated = await checkOutMemberSupabase(attendanceId);
    await refreshAll();

    const member = members.find(m => m.id === updated.member_id);

    return {
      id: updated.id,
      memberId: updated.member_id,
      memberName: member?.name ?? 'Unknown member',
      memberCode: member?.memberCode ?? `#${updated.member_id.slice(0, 8)}`,
      checkIn: updated.checked_in_at,
      ...(updated.checked_out_at ? { checkOut: updated.checked_out_at } : {}),
      markedBy: updated.recorded_by ?? 'Staff',
      gate: 'Supabase attendance',
      status: updated.checked_out_at ? 'CHECKED_OUT' : 'CHECKED_IN',
      createdAt: updated.created_at,
    };
  };

  const updateStaffPermissions = async (staffId: string, updates: Partial<StaffPermissions>) => {
    const updated = await updateSupabaseStaffPermissions(staffId, updates);
    await refreshAll();
    return updated;
  };

  const addStaff = async (data: Omit<StaffPermissions, 'updatedAt'>) => {
    const credentials = await provisionSupabaseStaffAccount({
      name: data.staffName,
      email: data.staffEmail,
      assignedBranch: data.assignedBranch,
    });
    await refreshAll();
    const created = staffList.find(staff => staff.staffId === credentials.staff_id);
    const staff = created ?? {
      staffId: credentials.staff_id,
      staffName: data.staffName,
      staffEmail: credentials.email,
      role: 'STAFF' as const,
      canManageMembers: data.canManageMembers,
      canManageMemberships: data.canManageMemberships,
      canRecordPayments: data.canRecordPayments,
      canManageAttendance: data.canManageAttendance,
      canViewReports: data.canViewReports,
      isActive: true,
      assignedBranch: data.assignedBranch,
      updatedAt: new Date().toISOString(),
    };
    return { staff, credentials: { email: credentials.email, password: credentials.password } };
  };

  const createRenewalRequest = (params: {
    memberId: string;
    requestedPlanId: string;
    notes?: string;
  }) => {
    const req = gymStorage.createRenewalRequest(params);
    void refreshAll();
    return req;
  };

  const processRenewalRequest = (requestId: string, approved: boolean) => {
    const req = gymStorage.processRenewalRequest(requestId, approved);
    void refreshAll();
    return req;
  };

  const markNotificationAsRead = (id: string) => {
    gymStorage.markNotificationAsRead(id);
    void refreshAll();
  };

  const markAllNotificationsAsRead = () => {
    gymStorage.markAllNotificationsAsRead();
    void refreshAll();
  };

  const updateSettings = (updates: Partial<GymSettings>) => {
    const s = gymStorage.updateSettings(updates);
    void refreshAll();
    return s;
  };

  const resetSeedData = () => {
    gymStorage.resetToSeed();
    void refreshAll();
  };

  return (
    <GymContext.Provider
      value={{
        members,
        memberships,
        plans,
        payments,
        attendance,
        history,
        staffList,
        activityLogs,
        notifications,
        renewalRequests,
        settings,
        stats,
        loading,
        refreshAll,
        addMember,
        updateMember,
        toggleMemberStatus,
        deleteMember,
        addPlan,
        updatePlan,
        assignMembership,
        renewMembership,
        recordPayment,
        undoPayment,
        cancelMembership,
        checkInMember,
        checkOutMember,
        updateStaffPermissions,
        addStaff,
        createRenewalRequest,
        processRenewalRequest,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateSettings,
        resetSeedData,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
