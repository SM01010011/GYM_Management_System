import { supabase } from '../lib/supabase';

export interface SupabaseAttendanceRecord {
  id: string;
  member_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  recorded_by: string | null;
  created_at: string;
}

const ATTENDANCE_SELECT =
  'id, member_id, checked_in_at, checked_out_at, recorded_by, created_at';

export async function getSupabaseAttendance(): Promise<SupabaseAttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
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

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, full_name, status')
    .eq('id', memberId)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Unable to verify member: ${memberError.message}`);
  }

  if (!member) {
    throw new Error('Member not found in Supabase. Refresh Members and try again.');
  }

  if (member.status !== 'active') {
    throw new Error(`${member.full_name} is inactive and cannot check in.`);
  }

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
    .insert({ member_id: memberId })
    .select(ATTENDANCE_SELECT)
    .single();

  if (error) {
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
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', id)
    .is('checked_out_at', null)
    .select(ATTENDANCE_SELECT)
    .single();

  if (error) {
    throw new Error(`Check-out failed: ${error.message}`);
  }

  return data;
}
