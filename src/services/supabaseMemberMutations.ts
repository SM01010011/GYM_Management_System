/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabase';
import type { Member } from '../types';

type CreateMemberInput = {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  joinDate: string;
};

export const displayMemberCode = (id: string) => `#M-${id.slice(0, 8).toUpperCase()}`;

const mapMember = (row: any): Member => ({
  id: row.id,
  userId: row.user_id ?? undefined,
  memberCode: displayMemberCode(row.id),
  name: row.full_name,
  phone: row.phone ?? '',
  email: row.email ?? '',
  dateOfBirth: row.date_of_birth ?? undefined,
  gender:
    row.gender === 'Male' || row.gender === 'Female' || row.gender === 'Other'
      ? row.gender
      : undefined,
  address: row.address ?? undefined,
  emergencyContact: row.emergency_contact_phone ?? undefined,
  emergencyRelation: row.emergency_contact_name ?? undefined,
  joinDate: row.joined_at,
  status: row.status === 'active' ? 'ACTIVE' : 'INACTIVE',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const selectMember = `
  id,
  user_id,
  full_name,
  email,
  phone,
  date_of_birth,
  gender,
  address,
  emergency_contact_name,
  emergency_contact_phone,
  status,
  joined_at,
  created_at,
  updated_at
`;

export async function createSupabaseMember(input: CreateMemberInput): Promise<Member> {
  const fullName = input.name.trim();
  const phone = input.phone.trim();

  if (!fullName || !phone) {
    throw new Error('Name and phone are required.');
  }

  const { data, error } = await supabase
    .from('members')
    .insert({
      full_name: fullName,
      phone,
      email: input.email?.trim().toLowerCase() || null,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      address: input.address?.trim() || null,
      emergency_contact_name: input.emergencyRelation?.trim() || null,
      emergency_contact_phone: input.emergencyContact?.trim() || null,
      joined_at: input.joinDate,
      status: 'active',
    })
    .select(selectMember)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A member with this email or phone already exists.');
    }
    throw new Error(`Unable to create member: ${error.message}`);
  }

  return mapMember(data);
}

export async function updateSupabaseMember(
  id: string,
  updates: Partial<CreateMemberInput>
): Promise<Member> {
  const payload: Record<string, unknown> = {};

  if (updates.name !== undefined) payload.full_name = updates.name.trim();
  if (updates.phone !== undefined) payload.phone = updates.phone.trim();
  if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase() || null;
  if (updates.dateOfBirth !== undefined) payload.date_of_birth = updates.dateOfBirth || null;
  if (updates.gender !== undefined) payload.gender = updates.gender || null;
  if (updates.address !== undefined) payload.address = updates.address?.trim() || null;
  if (updates.emergencyRelation !== undefined) {
    payload.emergency_contact_name = updates.emergencyRelation?.trim() || null;
  }
  if (updates.emergencyContact !== undefined) {
    payload.emergency_contact_phone = updates.emergencyContact?.trim() || null;
  }
  if (updates.joinDate !== undefined) payload.joined_at = updates.joinDate;

  const { data, error } = await supabase
    .from('members')
    .update(payload)
    .eq('id', id)
    .select(selectMember)
    .single();

  if (error) throw new Error(`Unable to update member: ${error.message}`);
  return mapMember(data);
}

export async function toggleSupabaseMemberStatus(id: string): Promise<Member> {
  const { data: existing, error: readError } = await supabase
    .from('members')
    .select('status')
    .eq('id', id)
    .single();

  if (readError) throw new Error(`Unable to load member status: ${readError.message}`);

  const nextStatus = existing.status === 'active' ? 'inactive' : 'active';

  const { data, error } = await supabase
    .from('members')
    .update({ status: nextStatus })
    .eq('id', id)
    .select(selectMember)
    .single();

  if (error) throw new Error(`Unable to update member status: ${error.message}`);
  return mapMember(data);
}

export async function deleteSupabaseMember(id: string): Promise<void> {
  const memberId = id.trim();

  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  // Members have dependent records (memberships, payments, attendance,
  // trainer assignments and workout plans). Delete them transactionally in
  // PostgreSQL so a foreign-key constraint cannot leave a half-deleted member.
  const { error } = await supabase.rpc('delete_member_cascade', {
    p_member_id: memberId,
  });

  if (error) {
    throw new Error(`Unable to delete member: ${error.message}`);
  }
}
