/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
import {
  INITIAL_MEMBERS,
  INITIAL_MEMBERSHIPS,
  INITIAL_PLANS,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_MEMBERSHIP_HISTORY,
  INITIAL_STAFF_PERMISSIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_RENEWAL_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
} from './seedData';
import {
  calculateMembershipStatus,
  getTodayDateString,
  computeRenewalDates,
  addDaysToDate
} from '../utils/dateUtils';

const STORAGE_KEYS = {
  MEMBERS: 'warrior_members',
  MEMBERSHIPS: 'warrior_memberships',
  PLANS: 'warrior_plans',
  PAYMENTS: 'warrior_payments',
  ATTENDANCE: 'warrior_attendance',
  HISTORY: 'warrior_history',
  STAFF_PERMS: 'warrior_staff_permissions',
  LOGS: 'warrior_logs',
  NOTIFS: 'warrior_notifications',
  RENEWALS: 'warrior_renewals',
  SETTINGS: 'warrior_settings',
  INITIALIZED: 'warrior_initialized_v2',
};

let idSequenceCounter = 0;
export function generateUniqueId(prefix: string): string {
  idSequenceCounter = (idSequenceCounter + 1) % 1000000;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${idSequenceCounter}-${rand}`;
}

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export class GymStorageService {
  constructor() {
    this.initSeedData();
  }

  private initSeedData(): void {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      setStored(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
      setStored(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
      setStored(STORAGE_KEYS.PLANS, INITIAL_PLANS);
      setStored(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
      setStored(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
      setStored(STORAGE_KEYS.HISTORY, INITIAL_MEMBERSHIP_HISTORY);
      setStored(STORAGE_KEYS.STAFF_PERMS, INITIAL_STAFF_PERMISSIONS);
      setStored(STORAGE_KEYS.LOGS, INITIAL_ACTIVITY_LOGS);
      setStored(STORAGE_KEYS.NOTIFS, INITIAL_NOTIFICATIONS);
      setStored(STORAGE_KEYS.RENEWALS, INITIAL_RENEWAL_REQUESTS);
      setStored(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  // ---------------- MEMBERS ----------------

  public getMembers(): Member[] {
    const members = getStored<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    return members;
  }

  public getMemberById(id: string): Member | undefined {
    return this.getMembers().find(m => m.id === id);
  }

  public getMemberByEmailOrPhone(query: string): Member | undefined {
    const q = query.trim().toLowerCase();
    return this.getMembers().find(
      m =>
        m.email.toLowerCase() === q ||
        m.phone.replace(/\s+/g, '') === q.replace(/\s+/g, '') ||
        m.memberCode.toLowerCase() === q
    );
  }

  public createMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>, performedBy = 'Staff'): Member {
    const members = this.getMembers();
    const id = generateUniqueId('mem');
    const newMember: Member = {
      ...memberData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    members.unshift(newMember);
    setStored(STORAGE_KEYS.MEMBERS, members);

    this.logActivity({
      action: 'Member Added',
      description: `Added member ${newMember.name} (${newMember.memberCode})`,
      performedBy,
      targetId: newMember.id,
      targetName: newMember.name,
      category: 'MEMBER',
    });

    return newMember;
  }

  public updateMember(id: string, updates: Partial<Member>, performedBy = 'Staff'): Member {
    const members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Member not found');

    const updated = {
      ...members[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    members[index] = updated;
    setStored(STORAGE_KEYS.MEMBERS, members);

    this.logActivity({
      action: 'Member Edited',
      description: `Updated profile details for ${updated.name}`,
      performedBy,
      targetId: updated.id,
      targetName: updated.name,
      category: 'MEMBER',
    });

    return updated;
  }

  public toggleMemberStatus(id: string, performedBy = 'Staff'): Member {
    const member = this.getMemberById(id);
    if (!member) throw new Error('Member not found');
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateMember(id, { status: newStatus }, performedBy);
  }

  public deleteMember(id: string, performedBy = 'Owner'): void {
    const members = this.getMembers().filter(m => m.id !== id);
    setStored(STORAGE_KEYS.MEMBERS, members);

    this.logActivity({
      action: 'Member Deleted',
      description: `Permanently removed member ID ${id}`,
      performedBy,
      targetId: id,
      category: 'MEMBER',
    });
  }

  // ---------------- MEMBERSHIP PLANS ----------------

  public getPlans(): MembershipPlan[] {
    const plans = getStored<MembershipPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    if (!Array.isArray(plans) || plans.length === 0) {
      setStored(STORAGE_KEYS.PLANS, INITIAL_PLANS);
      return INITIAL_PLANS;
    }
    return plans;
  }

  public getPlanById(id: string): MembershipPlan | undefined {
    return this.getPlans().find(p => p.id === id);
  }

  public createPlan(planData: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>, performedBy = 'Owner'): MembershipPlan {
    const plans = this.getPlans();
    const newPlan: MembershipPlan = {
      ...planData,
      id: generateUniqueId('plan'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plans.push(newPlan);
    setStored(STORAGE_KEYS.PLANS, plans);

    this.logActivity({
      action: 'Plan Created',
      description: `Created new membership plan "${newPlan.name}" (₹${newPlan.price})`,
      performedBy,
      targetId: newPlan.id,
      targetName: newPlan.name,
      category: 'MEMBERSHIP',
    });

    return newPlan;
  }

  public updatePlan(id: string, updates: Partial<MembershipPlan>, performedBy = 'Owner'): MembershipPlan {
    const plans = this.getPlans();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plan not found');

    const updated = {
      ...plans[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    plans[index] = updated;
    setStored(STORAGE_KEYS.PLANS, plans);

    this.logActivity({
      action: 'Plan Edited',
      description: `Updated membership plan "${updated.name}"`,
      performedBy,
      targetId: updated.id,
      targetName: updated.name,
      category: 'MEMBERSHIP',
    });

    return updated;
  }

  // ---------------- MEMBERSHIPS ----------------

  public getMemberships(): Membership[] {
    const list = getStored<Membership[]>(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
    // Dynamically calculate and enforce status based on expiry date
    return list.map(m => ({
      ...m,
      status: calculateMembershipStatus(m.expiryDate, m.status),
    }));
  }

  public getMembershipByMemberId(memberId: string): Membership | undefined {
    const memberships = this.getMemberships().filter(m => m.memberId === memberId);
    if (memberships.length === 0) return undefined;
    // Return most recent membership
    return memberships.sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime())[0];
  }

  public assignMembership(params: {
    memberId: string;
    planId: string;
    startDate: string;
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }): { membership: Membership; payment?: Payment } {
    const member = this.getMemberById(params.memberId);
    if (!member) throw new Error('Member not found');
    const plan = this.getPlanById(params.planId);
    if (!plan) throw new Error('Plan not found');

    const startDate = params.startDate || getTodayDateString();
    const expiryDate = addDaysToDate(startDate, plan.durationDays);
    const performedBy = params.performedBy || 'Staff';

    const newMembership: Membership = {
      id: generateUniqueId('mship'),
      memberId: member.id,
      memberName: member.name,
      memberCode: member.memberCode,
      planId: plan.id,
      planName: plan.name,
      startDate,
      expiryDate,
      price: plan.price,
      status: calculateMembershipStatus(expiryDate),
      createdBy: performedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const memberships = this.getMemberships();
    memberships.unshift(newMembership);
    setStored(STORAGE_KEYS.MEMBERSHIPS, memberships);

    // Update member's currentMembershipId and ensure status is ACTIVE
    this.updateMember(member.id, { currentMembershipId: newMembership.id, status: 'ACTIVE' }, performedBy);

    // Record in history
    this.addHistory({
      memberId: member.id,
      memberName: member.name,
      membershipId: newMembership.id,
      action: 'CREATED',
      newPlan: plan.name,
      newExpiryDate: expiryDate,
      performedBy,
      notes: `Assigned ${plan.name} (${plan.durationDays} days)`,
    });

    // Record Payment if requested
    let payment: Payment | undefined;
    if (params.recordPaymentNow) {
      payment = this.recordPayment({
        memberId: member.id,
        memberName: member.name,
        memberCode: member.memberCode,
        membershipId: newMembership.id,
        amount: plan.price,
        paymentDate: startDate,
        paymentMethod: params.paymentMethod || 'UPI',
        transactionReference: `TXN-WRR-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'PAID',
        recordedBy: performedBy,
        notes: `Full payment for ${plan.name}`,
      });
    }

    this.logActivity({
      action: 'Membership Created',
      description: `Assigned ${plan.name} to ${member.name} (Valid until ${expiryDate})`,
      performedBy,
      targetId: newMembership.id,
      targetName: member.name,
      category: 'MEMBERSHIP',
    });

    return { membership: newMembership, payment };
  }

  public renewMembership(params: {
    memberId: string;
    planId?: string; // Optional: change plan on renewal
    recordPaymentNow?: boolean;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    performedBy?: string;
  }): { membership: Membership; payment?: Payment } {
    const member = this.getMemberById(params.memberId);
    if (!member) throw new Error('Member not found');

    const currentMship = this.getMembershipByMemberId(member.id);
    const plan = params.planId ? this.getPlanById(params.planId) : (currentMship ? this.getPlanById(currentMship.planId) : this.getPlans()[0]);
    if (!plan) throw new Error('Plan not found');

    const currentExpiry = currentMship ? currentMship.expiryDate : getTodayDateString();
    const { startDate, newExpiryDate, wasActive } = computeRenewalDates(currentExpiry, plan.durationDays);
    const performedBy = params.performedBy || 'Staff';

    const memberships = this.getMemberships();
    let updatedMembership: Membership;

    if (currentMship) {
      // Extend current membership or create new renewal record
      const index = memberships.findIndex(m => m.id === currentMship.id);
      updatedMembership = {
        ...currentMship,
        planId: plan.id,
        planName: plan.name,
        startDate: wasActive ? currentMship.startDate : startDate,
        expiryDate: newExpiryDate,
        price: plan.price,
        status: calculateMembershipStatus(newExpiryDate),
        updatedAt: new Date().toISOString(),
      };
      if (index !== -1) {
        memberships[index] = updatedMembership;
      } else {
        memberships.unshift(updatedMembership);
      }
    } else {
      updatedMembership = {
        id: generateUniqueId('mship'),
        memberId: member.id,
        memberName: member.name,
        memberCode: member.memberCode,
        planId: plan.id,
        planName: plan.name,
        startDate,
        expiryDate: newExpiryDate,
        price: plan.price,
        status: calculateMembershipStatus(newExpiryDate),
        createdBy: performedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memberships.unshift(updatedMembership);
    }

    setStored(STORAGE_KEYS.MEMBERSHIPS, memberships);
    this.updateMember(member.id, { currentMembershipId: updatedMembership.id, status: 'ACTIVE' }, performedBy);

    // Record in history
    this.addHistory({
      memberId: member.id,
      memberName: member.name,
      membershipId: updatedMembership.id,
      action: 'RENEWED',
      oldPlan: currentMship?.planName,
      newPlan: plan.name,
      oldExpiryDate: currentExpiry,
      newExpiryDate,
      performedBy,
      notes: wasActive ? `Extended from ${currentExpiry} to ${newExpiryDate}` : `Expired renewal from today ${startDate} to ${newExpiryDate}`,
    });

    // Record payment if requested
    let payment: Payment | undefined;
    if (params.recordPaymentNow) {
      payment = this.recordPayment({
        memberId: member.id,
        memberName: member.name,
        memberCode: member.memberCode,
        membershipId: updatedMembership.id,
        amount: plan.price,
        paymentDate: getTodayDateString(),
        paymentMethod: params.paymentMethod || 'UPI',
        transactionReference: `TXN-WRR-REN-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'PAID',
        recordedBy: performedBy,
        notes: `Renewal payment for ${plan.name}`,
      });
    }

    // Notify member
    this.addNotification({
      userId: member.userId || member.id,
      title: 'Pass Renewed Successfully! 🎉',
      message: `Your membership has been extended to ${newExpiryDate}. Turnstile access is active.`,
      type: 'SUCCESS',
      read: false,
    });

    this.logActivity({
      action: 'Membership Renewed',
      description: `Renewed membership for ${member.name}. Extended expiry to ${newExpiryDate}`,
      performedBy,
      targetId: updatedMembership.id,
      targetName: member.name,
      category: 'MEMBERSHIP',
    });

    return { membership: updatedMembership, payment };
  }

  // ---------------- PAYMENTS ----------------

  public getPayments(): Payment[] {
    return getStored<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  public recordPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const payments = this.getPayments();
    const newPayment: Payment = {
      ...paymentData,
      id: generateUniqueId('pay'),
      createdAt: new Date().toISOString(),
    };
    payments.unshift(newPayment);
    setStored(STORAGE_KEYS.PAYMENTS, payments);

    this.logActivity({
      action: 'Payment Recorded',
      description: `Recorded payment of ₹${newPayment.amount.toLocaleString('en-IN')} via ${newPayment.paymentMethod} from ${newPayment.memberName}`,
      performedBy: newPayment.recordedBy,
      targetId: newPayment.id,
      targetName: newPayment.memberName,
      category: 'PAYMENT',
    });

    return newPayment;
  }

  public undoPayment(paymentIdOrTxn: string, performedBy = 'Customer / Desk'): { success: boolean; message: string } {
    const payments = this.getPayments();
    const payment = payments.find(p => p.id === paymentIdOrTxn || p.transactionReference === paymentIdOrTxn);
    if (!payment) return { success: false, message: 'Payment record not found' };

    payment.status = 'REFUNDED';
    payment.notes = `${payment.notes || ''} [PAYMENT UNDONE / REFUNDED]`;
    setStored(STORAGE_KEYS.PAYMENTS, payments);

    if (payment.membershipId) {
      const memberships = this.getMemberships();
      const m = memberships.find(x => x.id === payment.membershipId);
      if (m) {
        m.status = 'CANCELLED';
        m.updatedAt = new Date().toISOString();
        setStored(STORAGE_KEYS.MEMBERSHIPS, memberships);
      }
    }

    this.logActivity({
      action: 'Payment Undone',
      description: `Payment ${payment.transactionReference} of ₹${payment.amount} was undone/refunded`,
      performedBy,
      targetId: payment.id,
      targetName: payment.memberName,
      category: 'PAYMENT',
    });

    return { success: true, message: `Payment ${payment.transactionReference} undone successfully.` };
  }

  public cancelMembership(membershipId: string, performedBy = 'Customer / Desk'): void {
    const memberships = this.getMemberships();
    const m = memberships.find(x => x.id === membershipId);
    if (!m) return;
    m.status = 'CANCELLED';
    m.updatedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.MEMBERSHIPS, memberships);

    this.logActivity({
      action: 'Membership Cancelled',
      description: `Membership ${m.planName} for ${m.memberName} was cancelled`,
      performedBy,
      targetId: m.id,
      targetName: m.memberName,
      category: 'MEMBERSHIP',
    });
  }

  // ---------------- ATTENDANCE ----------------

  public getAttendance(): Attendance[] {
    return getStored<Attendance[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  public getAttendanceByMemberId(memberId: string): Attendance[] {
    return this.getAttendance().filter(a => a.memberId === memberId);
  }

  public getActiveCheckIn(memberId: string): Attendance | undefined {
    return this.getAttendance().find(a => a.memberId === memberId && a.status === 'CHECKED_IN');
  }

  public markCheckIn(memberId: string, gate = 'Turnstile Gate #04 (Downtown HQ)', markedBy = 'Staff', authMethod = 'Digital Member QR'): Attendance {
    const member = this.getMemberById(memberId);
    if (!member) throw new Error('Member not found');

    // Check if membership is expired
    const mship = this.getMembershipByMemberId(memberId);
    if (!mship || mship.status === 'EXPIRED') {
      throw new Error(`Turnstile Access Denied: ${member.name}'s membership is expired. Please renew first.`);
    }

    // Check for duplicate active check-in
    const active = this.getActiveCheckIn(memberId);
    if (active) {
      throw new Error(`${member.name} is ALREADY checked in since ${new Date(active.checkIn).toLocaleTimeString()}.`);
    }

    const attendanceList = this.getAttendance();
    const newRecord: Attendance = {
      id: generateUniqueId('att'),
      memberId: member.id,
      memberName: member.name,
      memberCode: member.memberCode,
      checkIn: new Date().toISOString(),
      markedBy,
      gate,
      status: 'CHECKED_IN',
      authMethod,
      createdAt: new Date().toISOString(),
    };
    attendanceList.unshift(newRecord);
    setStored(STORAGE_KEYS.ATTENDANCE, attendanceList);

    this.logActivity({
      action: 'Attendance Check-in',
      description: `Member ${member.name} checked in at ${gate}`,
      performedBy: markedBy,
      targetId: newRecord.id,
      targetName: member.name,
      category: 'ATTENDANCE',
    });

    return newRecord;
  }

  public markCheckOut(attendanceId: string, markedBy = 'Staff'): Attendance {
    const attendanceList = this.getAttendance();
    const index = attendanceList.findIndex(a => a.id === attendanceId);
    if (index === -1) throw new Error('Attendance record not found');

    const updated: Attendance = {
      ...attendanceList[index],
      checkOut: new Date().toISOString(),
      status: 'CHECKED_OUT',
    };
    attendanceList[index] = updated;
    setStored(STORAGE_KEYS.ATTENDANCE, attendanceList);

    this.logActivity({
      action: 'Attendance Check-out',
      description: `Member ${updated.memberName} checked out`,
      performedBy: markedBy,
      targetId: updated.id,
      targetName: updated.memberName,
      category: 'ATTENDANCE',
    });

    return updated;
  }

  // ---------------- MEMBERSHIP HISTORY ----------------

  public getHistory(): MembershipHistory[] {
    return getStored<MembershipHistory[]>(STORAGE_KEYS.HISTORY, INITIAL_MEMBERSHIP_HISTORY);
  }

  public getHistoryByMemberId(memberId: string): MembershipHistory[] {
    return this.getHistory().filter(h => h.memberId === memberId);
  }

  public addHistory(entry: Omit<MembershipHistory, 'id' | 'createdAt'>): MembershipHistory {
    const list = this.getHistory();
    const newEntry: MembershipHistory = {
      ...entry,
      id: generateUniqueId('hist'),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newEntry);
    setStored(STORAGE_KEYS.HISTORY, list);
    return newEntry;
  }

  // ---------------- STAFF PERMISSIONS ----------------

  public getStaffPermissions(): StaffPermissions[] {
    return getStored<StaffPermissions[]>(STORAGE_KEYS.STAFF_PERMS, INITIAL_STAFF_PERMISSIONS);
  }

  public updateStaffPermissions(staffId: string, updates: Partial<StaffPermissions>, performedBy = 'Owner'): StaffPermissions {
    const list = this.getStaffPermissions();
    const index = list.findIndex(s => s.staffId === staffId);
    if (index === -1) throw new Error('Staff not found');

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    setStored(STORAGE_KEYS.STAFF_PERMS, list);

    this.logActivity({
      action: 'Permissions Changed',
      description: `Updated authorization privileges for staff ${updated.staffName}`,
      performedBy,
      targetId: staffId,
      targetName: updated.staffName,
      category: 'STAFF',
    });

    return updated;
  }

  public addStaff(staffData: Omit<StaffPermissions, 'updatedAt'>, performedBy = 'Owner'): StaffPermissions {
    const list = this.getStaffPermissions();
    const newStaff: StaffPermissions = {
      ...staffData,
      updatedAt: new Date().toISOString(),
    };
    list.push(newStaff);
    setStored(STORAGE_KEYS.STAFF_PERMS, list);

    this.logActivity({
      action: 'Staff Added',
      description: `Onboarded new staff member ${newStaff.staffName} (${newStaff.staffEmail})`,
      performedBy,
      targetId: newStaff.staffId,
      targetName: newStaff.staffName,
      category: 'STAFF',
    });

    return newStaff;
  }

  // ---------------- ACTIVITY LOGS ----------------

  public getActivityLogs(): ActivityLog[] {
    const rawLogs = getStored<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_ACTIVITY_LOGS);
    const seen = new Set<string>();
    let modified = false;
    const sanitized = rawLogs.map((log, index) => {
      if (!log.id || seen.has(log.id)) {
        modified = true;
        const safeId = generateUniqueId(`act-${index}`);
        return { ...log, id: safeId };
      }
      seen.add(log.id);
      return log;
    });
    if (modified) {
      setStored(STORAGE_KEYS.LOGS, sanitized);
    }
    return sanitized;
  }

  public logActivity(logData: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      ...logData,
      id: generateUniqueId('act'),
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    setStored(STORAGE_KEYS.LOGS, logs);
    return newLog;
  }

  // ---------------- RENEWAL REQUESTS ----------------

  public getRenewalRequests(): RenewalRequest[] {
    return getStored<RenewalRequest[]>(STORAGE_KEYS.RENEWALS, INITIAL_RENEWAL_REQUESTS);
  }

  public createRenewalRequest(params: {
    memberId: string;
    requestedPlanId: string;
    notes?: string;
  }): RenewalRequest {
    const member = this.getMemberById(params.memberId);
    if (!member) throw new Error('Member not found');
    const mship = this.getMembershipByMemberId(member.id);
    const plan = this.getPlanById(params.requestedPlanId);
    if (!plan) throw new Error('Plan not found');

    const requests = this.getRenewalRequests();
    const newRequest: RenewalRequest = {
      id: generateUniqueId('ren'),
      memberId: member.id,
      memberName: member.name,
      memberCode: member.memberCode,
      membershipId: mship?.id || '',
      currentPlanName: mship?.planName || 'None',
      currentExpiryDate: mship?.expiryDate || getTodayDateString(),
      requestedPlanId: plan.id,
      requestedPlanName: plan.name,
      requestedPlanPrice: plan.price,
      requestedPlanDuration: plan.durationDays,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      notes: params.notes,
    };

    requests.unshift(newRequest);
    setStored(STORAGE_KEYS.RENEWALS, requests);

    // Notify staff & owner
    this.addNotification({
      userId: 'ALL',
      title: 'New Renewal Request',
      message: `${member.name} requested renewal for ${plan.name} (₹${plan.price})`,
      type: 'INFO',
      read: false,
      link: 'renewals',
    });

    this.logActivity({
      action: 'Renewal Requested',
      description: `${member.name} requested pass renewal for ${plan.name}`,
      performedBy: member.name,
      targetId: newRequest.id,
      targetName: member.name,
      category: 'MEMBERSHIP',
    });

    return newRequest;
  }

  public processRenewalRequest(requestId: string, approved: boolean, processedBy = 'Staff'): RenewalRequest {
    const requests = this.getRenewalRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) throw new Error('Renewal request not found');

    const req = requests[index];
    const newStatus = approved ? 'APPROVED' : 'REJECTED';

    const updated: RenewalRequest = {
      ...req,
      status: newStatus,
      processedAt: new Date().toISOString(),
      processedBy,
    };
    requests[index] = updated;
    setStored(STORAGE_KEYS.RENEWALS, requests);

    if (approved) {
      // Execute the renewal!
      this.renewMembership({
        memberId: req.memberId,
        planId: req.requestedPlanId,
        recordPaymentNow: true,
        performedBy: processedBy,
      });

      this.addNotification({
        userId: req.memberId,
        title: 'Renewal Request Approved! 🎉',
        message: `Your request for ${req.requestedPlanName} has been approved and activated.`,
        type: 'SUCCESS',
        read: false,
      });
    } else {
      this.addNotification({
        userId: req.memberId,
        title: 'Renewal Request Declined',
        message: `Your renewal request was not approved. Please contact the front desk.`,
        type: 'WARNING',
        read: false,
      });
    }

    this.logActivity({
      action: approved ? 'Renewal Approved' : 'Renewal Rejected',
      description: `${processedBy} ${approved ? 'approved' : 'rejected'} renewal request for ${req.memberName}`,
      performedBy: processedBy,
      targetId: req.id,
      targetName: req.memberName,
      category: 'MEMBERSHIP',
    });

    return updated;
  }

  // ---------------- NOTIFICATIONS ----------------

  public getNotifications(): AppNotification[] {
    return getStored<AppNotification[]>(STORAGE_KEYS.NOTIFS, INITIAL_NOTIFICATIONS);
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'createdAt'>): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: generateUniqueId('notif'),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotif);
    setStored(STORAGE_KEYS.NOTIFS, list);
    return newNotif;
  }

  public markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const index = list.findIndex(n => n.id === id);
    if (index !== -1) {
      list[index].read = true;
      setStored(STORAGE_KEYS.NOTIFS, list);
    }
  }

  public markAllNotificationsAsRead(): void {
    const list = this.getNotifications().map(n => ({ ...n, read: true }));
    setStored(STORAGE_KEYS.NOTIFS, list);
  }

  // ---------------- GYM SETTINGS ----------------

  public getSettings(): GymSettings {
    return getStored<GymSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public updateSettings(updates: Partial<GymSettings>, performedBy = 'Owner'): GymSettings {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.SETTINGS, updated);

    this.logActivity({
      action: 'Gym Settings Updated',
      description: `Owner updated facility settings and preferences`,
      performedBy,
      category: 'SYSTEM',
    });

    return updated;
  }

  // Reset to original seed data
  public resetToSeed(): void {
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    this.initSeedData();
  }

  public resetSeedData(): void {
    this.resetToSeed();
  }

  public checkInMember(memberId: string, gate?: string, authMethod?: string): Attendance {
    return this.markCheckIn(memberId, gate, 'Staff', authMethod);
  }

  public checkOutMember(attendanceId: string): Attendance {
    return this.markCheckOut(attendanceId);
  }

  public createStaff(staffData: Omit<StaffPermissions, 'updatedAt'>): StaffPermissions {
    return this.addStaff(staffData);
  }
}

export const gymStorage = new GymStorageService();
