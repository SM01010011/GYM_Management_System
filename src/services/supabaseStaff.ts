import { supabase } from '../lib/supabase';
import type { StaffPermissions } from '../types';

type StaffRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'staff' | 'trainer' | 'customer';
  status: 'active' | 'suspended' | 'disabled';
  can_manage_members: boolean;
  can_manage_memberships: boolean;
  can_record_payments: boolean;
  can_manage_attendance: boolean;
  can_view_reports: boolean;
  assigned_branch: string | null;
  updated_at: string;
};

const mapStaff = (row: StaffRow): StaffPermissions => ({
  staffId: row.id,
  staffName: row.full_name || 'Unnamed Staff',
  staffEmail: '',
  role: 'STAFF',
  canManageMembers: row.can_manage_members,
  canManageMemberships: row.can_manage_memberships,
  canRecordPayments: row.can_record_payments,
  canManageAttendance: row.can_manage_attendance,
  canViewReports: row.can_view_reports,
  isActive: row.status === 'active',
  assignedBranch: row.assigned_branch || undefined,
  updatedAt: row.updated_at,
});

const selectStaff = `
  id,
  email,
  full_name,
  phone,
  role,
  status,
  can_manage_members,
  can_manage_memberships,
  can_record_payments,
  can_manage_attendance,
  can_view_reports,
  assigned_branch,
  updated_at
`;

export async function getSupabaseStaff(): Promise<StaffPermissions[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(selectStaff)
    .eq('role', 'staff')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Unable to load staff: ${error.message}`);

  return ((data ?? []) as StaffRow[]).map(row => ({
    ...mapStaff(row),
    staffEmail: row.email || '',
  }));
}

export async function updateSupabaseStaffPermissions(
  staffId: string,
  updates: Partial<StaffPermissions>
): Promise<StaffPermissions> {
  const payload: Record<string, unknown> = {};

  if (updates.canManageMembers !== undefined) payload.can_manage_members = updates.canManageMembers;
  if (updates.canManageMemberships !== undefined) payload.can_manage_memberships = updates.canManageMemberships;
  if (updates.canRecordPayments !== undefined) payload.can_record_payments = updates.canRecordPayments;
  if (updates.canManageAttendance !== undefined) payload.can_manage_attendance = updates.canManageAttendance;
  if (updates.canViewReports !== undefined) payload.can_view_reports = updates.canViewReports;
  if (updates.isActive !== undefined) payload.status = updates.isActive ? 'active' : 'suspended';
  if (updates.assignedBranch !== undefined) payload.assigned_branch = updates.assignedBranch || null;
  if (updates.staffName !== undefined) payload.full_name = updates.staffName;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', staffId)
    .eq('role', 'staff')
    .select(selectStaff)
    .single();

  if (error) throw new Error(`Unable to update staff permissions: ${error.message}`);
  return mapStaff(data as StaffRow);
}

export interface ProvisionedStaffAccount {
  success: boolean;
  staff_id: string;
  email: string;
  password: string;
  message: string;
}

export async function provisionSupabaseStaffAccount(input: {
  name: string;
  email: string;
  phone?: string;
  assignedBranch?: string;
}): Promise<ProvisionedStaffAccount> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Your owner session has expired. Please sign in again.');
  }

  const { data, error } = await supabase.functions.invoke('provision-staff-account', {
    body: {
      name: input.name,
      email: input.email,
      phone: input.phone || '',
      assigned_branch: input.assignedBranch || 'Main Branch',
    },
  });

  if (error) {
    let backendMessage = '';
    try {
      const response = (error as { context?: Response }).context;
      if (response) {
        const payload = await response.clone().json().catch(() => null) as { error?: string; message?: string } | null;
        backendMessage = payload?.error || payload?.message || '';
      }
    } catch {
      // Fall back to the SDK error message below.
    }
    throw new Error(backendMessage || error.message || 'Unable to create staff account.');
  }

  if (!data?.success) {
    throw new Error(data?.error || data?.message || 'Unable to create staff account.');
  }

  const { error: profileEmailError } = await supabase
    .from('profiles')
    .update({ email: input.email.trim().toLowerCase() })
    .eq('id', data.staff_id);

  if (profileEmailError) {
    throw new Error(`Staff account was created, but the directory email could not be saved: ${profileEmailError.message}`);
  }

  return data as ProvisionedStaffAccount;
}
