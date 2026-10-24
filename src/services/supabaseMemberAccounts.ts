/**
 * Member authentication account provisioning.
 * The password is generated server-side by a Supabase Edge Function so the
 * service-role key is never exposed to the Vercel/browser bundle.
 */
import { supabase } from '../lib/supabase';

export interface ProvisionedMemberAccount {
  success: boolean;
  member_id: string;
  user_id: string;
  email: string;
  password: string;
  message: string;
}

export async function provisionMemberAccount(memberId: string): Promise<ProvisionedMemberAccount> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new Error('Your admin session has expired. Please log in again.');
  }

  const { data, error } = await supabase.functions.invoke('provision-member-account', {
    body: { member_id: memberId },
  });

  if (error) {
    throw new Error(error.message || 'Unable to create member login.');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Unable to create member login.');
  }

  return data as ProvisionedMemberAccount;
}
