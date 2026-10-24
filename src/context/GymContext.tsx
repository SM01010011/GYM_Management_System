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
import {
  getSupabaseMembershipPlans,
  getSupabaseMemberships,
} from '../services/supabaseMemberships';
import { getTodayDateString } from '../utils/dateUtils';

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

  addPlan: (data: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>) => MembershipPlan;
  updatePlan: (id: string, updates: Partial<MembershipPlan>) => MembershipPlan;

  assignMembership: (params: {
    memberId: string;
    planId: string;
    startDate: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }) => { membership: Membership; payment?: Payment };

  renewMembership: (params: {
    memberId: string;
    planId?: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }) => { membership: Membership; payment?: Payment };

  recordPayment: (data: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  undoPayment: (paymentIdOrTxn: string, performedBy?: string) => { success: boolean; message: string };
  cancelMembership: (membershipId: string, performedBy?: string) => void;

  checkInMember: (memberId: string, gate?: string, authMethod?: string) => Attendance;
  checkOutMember: (attendanceId: string) => Attendance;

  updateStaffPermissions: (staffId: string, updates: Partial<StaffPermissions>) => StaffPermissions;
  addStaff: (data: Omit<StaffPermissions, 'updatedAt'>) => StaffPermissions;

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
  const [payments, setPayments] = useState<Payment[]>(() => gymStorage.getPayments());
  const [attendance, setAttendance] = useState<Attendance[]>(() => gymStorage.getAttendance());
  const [history, setHistory] = useState<MembershipHistory[]>(() => gymStorage.getHistory());
  const [staffList, setStaffList] = useState<StaffPermissions[]>(() => gymStorage.getStaffPermissions());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => gymStorage.getActivityLogs());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => gymStorage.getNotifications());
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>(() => gymStorage.getRenewalRequests());
  const [settings, setSettings] = useState<GymSettings>(() => gymStorage.getSettings());

  const refreshAll = useCallback(async () => {
    setLoading(true);

    try {
      // Members now come from the real PostgreSQL database.
      const [supabaseMembers, supabaseMemberships, supabasePlans] =
        await Promise.all([
          getSupabaseMembers(),
          getSupabaseMemberships(),
          getSupabaseMembershipPlans(),
        ]);

      setMembers(supabaseMembers);
      setMemberships(supabaseMemberships);
      setPlans(supabasePlans);
      setPayments(gymStorage.getPayments());
      setAttendance(gymStorage.getAttendance());
      setHistory(gymStorage.getHistory());
      setStaffList(gymStorage.getStaffPermissions());
      setActivityLogs(gymStorage.getActivityLogs());
      setNotifications(gymStorage.getNotifications());
      setRenewalRequests(gymStorage.getRenewalRequests());
      setSettings(gymStorage.getSettings());
    } catch (error) {
      console.error('Failed to load Supabase data:', error);

      //Do not fall back to fake/seed members or memberships.
      // An empty result is safer than displaying stale demo data.
      setMembers([]);
      setMemberships([]);
      setPlans([]);
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

  // Actions
  const addMember = async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await createSupabaseMember({
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
    await refreshAll();
    return created;
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

  const addPlan = (data: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const plan = gymStorage.createPlan(data);
    void refreshAll();
    return plan;
  };

  const updatePlan = (id: string, updates: Partial<MembershipPlan>) => {
    const plan = gymStorage.updatePlan(id, updates);
    void refreshAll();
    return plan;
  };

  const assignMembership = (params: {
    memberId: string;
    planId: string;
    startDate: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }) => {
    const res = gymStorage.assignMembership(params);
    void refreshAll();
    return res;
  };

  const renewMembership = (params: {
    memberId: string;
    planId?: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }) => {
    const res = gymStorage.renewMembership(params);
    void refreshAll();
    return res;
  };

  const recordPayment = (data: Omit<Payment, 'id' | 'createdAt'>) => {
    const p = gymStorage.recordPayment(data);
    void refreshAll();
    return p;
  };

  const undoPayment = (paymentIdOrTxn: string, performedBy?: string) => {
    const res = gymStorage.undoPayment(paymentIdOrTxn, performedBy);
    void refreshAll();
    return res;
  };

  const cancelMembership = (membershipId: string, performedBy?: string) => {
    gymStorage.cancelMembership(membershipId, performedBy);
    void refreshAll();
  };

  const checkInMember = (memberId: string, gate?: string, authMethod?: string) => {
    const att = gymStorage.markCheckIn(memberId, gate, 'Staff', authMethod);
    void refreshAll();
    return att;
  };

  const checkOutMember = (attendanceId: string) => {
    const att = gymStorage.markCheckOut(attendanceId);
    void refreshAll();
    return att;
  };

  const updateStaffPermissions = (staffId: string, updates: Partial<StaffPermissions>) => {
    const s = gymStorage.updateStaffPermissions(staffId, updates);
    void refreshAll();
    return s;
  };

  const addStaff = (data: Omit<StaffPermissions, 'updatedAt'>) => {
    const s = gymStorage.addStaff(data);
    void refreshAll();
    return s;
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
