/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Supabase-backed attendance operations.
 * Uses the same Supabase client as Members, Memberships and Payments so
 * the authenticated browser session is preserved consistently.
 */

import { supabase } from '../lib/supabase';

export interface SupabaseAttendanceRecord {
  id: string;
  member_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  recorded_by: string | null;
  created_at: string;
}

const attendanceSelect = `
  id,
  member_id,
  checked_in_at,
  checked_out_at,
  recorded_by,
  created_at
`;

export async function getSupabaseAttendance(): Promise<SupabaseAttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select(attendanceSelect)
    .order('checked_in_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load attendance: ${error.message}`);
  }

  return data ?? [];
}

export async function checkInMemberSupabase(
  input: { memberId: string }
): Promise<SupabaseAttendanceRecord> {
  const memberId = input.memberId.trim();

  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  // IMPORTANT:
  // Attendance must use the same Supabase client/session as the Members page.
  // The previous implementation imported a different/non-existent client path,
  // which could make a valid member appear as "Member not found".
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, full_name, status')
    .eq('id', memberId)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Unable to verify member: ${memberError.message}`);
  }

  if (!member) {
    throw new Error(
      'Member not found in Supabase. Refresh Members and try again.'
    );
  }

  if (member.status !== 'active') {
    throw new Error(`${member.full_name} is inactive and cannot check in.`);
  }

  // Enforce the no-overlapping-session rule at the application layer too.
  // PostgreSQL also protects this with the exclusion constraint.
  const { data: openSession, error: openError } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .is('checked_out_at', null)
    .maybeSingle();

  if (openError) {
    throw new Error(`Unable to verify current attendance: ${openError.message}`);
  }

  if (openSession) {
    throw new Error(`${member.full_name} is already checked in.`);
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      member_id: memberId,
    })
    .select(attendanceSelect)
    .single();

  if (error) {
    // PostgreSQL exclusion-constraint violation means there is an overlapping
    // attendance session, even if another request created it milliseconds ago.
    if (error.code === '23P01') {
      throw new Error(`${member.full_name} is already checked in.`);
    }

    throw new Error(`Check-in failed: ${error.message}`);
  }

  return data;
}

export async function checkOutMemberSupabase(
  attendanceId: string
): Promise<SupabaseAttendanceRecord> {
  const id = attendanceId.trim();

  if (!id) {
    throw new Error('Attendance ID is required.');
  }

  const { data, error } = await supabase
    .from('attendance')
    .update({
      checked_out_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('checked_out_at', null)
    .select(attendanceSelect)
    .single();

  if (error) {
    throw new Error(`Check-out failed: ${error.message}`);
  }

  return data;
}
