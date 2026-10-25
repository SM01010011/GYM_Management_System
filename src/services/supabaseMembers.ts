/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { displayMemberCode } from './supabaseMemberMutations';

function mapMemberStatus(status: string): Member['status'] {
  return status === 'active' ? 'ACTIVE' : 'INACTIVE';
}

/**
 * Read members from the real Supabase/PostgreSQL members table.
 *
 * READ ONLY:
 * - No localStorage fallback
 * - No seed/demo records
 * - No INSERT/UPDATE/DELETE
 */
export async function getSupabaseMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select(`
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
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Unable to load members: ${error.message}`);
  }

  return (data ?? []).map((member) => ({
    id: member.id,
    userId: member.user_id ?? undefined,
    memberCode: displayMemberCode(member.id),
    name: member.full_name,
    phone: member.phone ?? '',
    email: member.email ?? '',
    dateOfBirth: member.date_of_birth ?? undefined,
    address: member.address ?? undefined,
    gender:
      member.gender === 'Male' ||
      member.gender === 'Female' ||
      member.gender === 'Other'
        ? member.gender
        : undefined,
    emergencyContact: member.emergency_contact_phone ?? undefined,
    emergencyRelation: member.emergency_contact_name ?? undefined,
    joinDate: member.joined_at,
    status: mapMemberStatus(member.status),
    createdAt: member.created_at,
    updatedAt: member.updated_at,
  }));
}
