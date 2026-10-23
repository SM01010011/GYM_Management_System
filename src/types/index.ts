/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'OWNER' | 'STAFF' | 'CUSTOMER';

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export interface Member {
  id: string;
  userId?: string;
  memberCode: string; // e.g. #M-1042
  name: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  profilePhoto?: string;
  joinDate: string;
  status: MemberStatus;
  currentMembershipId?: string;
  assignedCoach?: string;
  lockerNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  price: number;
  features: string[];
  isActive: boolean;
  tierBadge?: string;
  isPopular?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MembershipStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';

export interface Membership {
  id: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  planId: string;
  planName: string;
  startDate: string; // ISO date string YYYY-MM-DD
  expiryDate: string; // ISO date string YYYY-MM-DD
  price: number;
  status: MembershipStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  memberCode?: string;
  membershipId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  status: PaymentStatus;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT';

export interface Attendance {
  id: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  checkIn: string; // ISO timestamp
  checkOut?: string; // ISO timestamp
  markedBy: string;
  gate: string;
  status: AttendanceStatus;
  authMethod?: string;
  createdAt: string;
}

export type MembershipAction = 'CREATED' | 'RENEWED' | 'PLAN_CHANGED' | 'CANCELLED';

export interface MembershipHistory {
  id: string;
  memberId: string;
  memberName: string;
  membershipId: string;
  action: MembershipAction;
  oldPlan?: string;
  newPlan: string;
  oldExpiryDate?: string;
  newExpiryDate: string;
  performedBy: string;
  createdAt: string;
  notes?: string;
}

export interface StaffPermissions {
  staffId: string;
  staffName: string;
  staffEmail: string;
  role: 'STAFF';
  canManageMembers: boolean;
  canManageMemberships: boolean;
  canRecordPayments: boolean;
  canManageAttendance: boolean;
  canViewReports: boolean;
  isActive: boolean;
  assignedBranch?: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  targetId?: string;
  targetName?: string;
  category?: 'MEMBER' | 'MEMBERSHIP' | 'PAYMENT' | 'ATTENDANCE' | 'STAFF' | 'SYSTEM';
  createdAt: string;
}

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';

export interface AppNotification {
  id: string;
  userId: string; // 'ALL' or specific user/role
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export type RenewalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RenewalRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  membershipId: string;
  currentPlanName: string;
  currentExpiryDate: string;
  requestedPlanId: string;
  requestedPlanName: string;
  requestedPlanPrice: number;
  requestedPlanDuration: number;
  status: RenewalRequestStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export interface GymSettings {
  gymName: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  branches: string[];
  activeBranch: string;
  gstRate: number;
  emergencyTurnstileUnlocked: boolean;
  updatedAt: string;
}
