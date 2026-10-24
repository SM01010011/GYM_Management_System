import { supabase } from './supabaseClient';

export interface SupabaseAttendanceRecord {
  id: string;
  member_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  recorded_by: string | null;
  created_at: string;
}

export async function getSupabaseAttendance(): Promise<SupabaseAttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, member_id, checked_in_at, checked_out_at, recorded_by, created_at')
    .order('checked_in_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load attendance: ${error.message}`);
  }

  return data ?? [];
}

export async function checkInMemberSupabase(
  input: { memberId: string }
): Promise<SupabaseAttendanceRecord> {
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('id', input.memberId)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Failed to verify member: ${memberError.message}`);
  }

  if (!member) {
    throw new Error('Member not found.');
  }

  const { data: openSession, error: openError } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', input.memberId)
    .is('checked_out_at', null)
    .maybeSingle();

  if (openError) {
    throw new Error(`Failed to check existing attendance: ${openError.message}`);
  }

  if (openSession) {
    throw new Error('This member is already checked in.');
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({ member_id: input.memberId })
    .select('id, member_id, checked_in_at, checked_out_at, recorded_by, created_at')
    .single();

  if (error) {
    throw new Error(`Check-in failed: ${error.message}`);
  }

  return data;
}

export async function checkOutMemberSupabase(
  attendanceId: string
): Promise<SupabaseAttendanceRecord> {
  const { data, error } = await supabase
    .from('attendance')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', attendanceId)
    .is('checked_out_at', null)
    .select('id, member_id, checked_in_at, checked_out_at, recorded_by, created_at')
    .single();

  if (error) {
    throw new Error(`Check-out failed: ${error.message}`);
  }

  return data;
}
