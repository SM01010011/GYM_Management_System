import { supabase } from '../lib/supabase';
import type { Member } from '../types';

/**
 * Read members from PostgreSQL through Supabase.
 *
 * Authorization is enforced by PostgreSQL RLS.
 * The frontend does not decide which rows the user is allowed to see.
 */
export async function getSupabaseMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Unable to load members: ${error.message}`);
  }

  return (data ?? []) as Member[];
}
