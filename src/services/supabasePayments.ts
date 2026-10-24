import { supabase } from '../lib/supabase';
import type { Payment } from '../types';

const SELECT = `
  id,
  member_id,
  membership_id,
  amount,
  payment_date,
  payment_method,
  transaction_reference,
  status,
  recorded_by,
  notes,
  created_at,
  members ( id, full_name )
`;

const mapPayment = (row: any): Payment => ({
  id: row.id,
  memberId: row.member_id,
  memberName: row.members?.full_name ?? '',
  memberCode: row.member_id ? `#M-${String(row.member_id).slice(0, 8).toUpperCase()}` : undefined,
  membershipId: row.membership_id ?? undefined,
  amount: Number(row.amount),
  paymentDate: row.payment_date,
  paymentMethod: row.payment_method,
  transactionReference: row.transaction_reference ?? '',
  status: row.status,
  recordedBy: row.recorded_by ?? 'Staff',
  notes: row.notes ?? undefined,
  createdAt: row.created_at,
});

export async function getSupabasePayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(SELECT)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Unable to load payments: ${error.message}`);
  return (data ?? []).map(mapPayment);
}

export async function createSupabasePayment(
  data: Omit<Payment, 'id' | 'createdAt'>
): Promise<Payment> {
  const { data: created, error } = await supabase
    .from('payments')
    .insert({
      member_id: data.memberId,
      membership_id: data.membershipId ?? null,
      amount: data.amount,
      payment_date: data.paymentDate,
      payment_method: data.paymentMethod,
      transaction_reference: data.transactionReference,
      status: data.status,
      recorded_by: data.recordedBy,
      notes: data.notes ?? null,
    })
    .select(SELECT)
    .single();

  if (error) throw new Error(`Unable to record payment: ${error.message}`);
  return mapPayment(created);
}

export async function refundSupabasePayment(paymentIdOrReference: string): Promise<Payment> {
  const byId = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(paymentIdOrReference);

  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'REFUNDED' })
    .eq(byId ? 'id' : 'transaction_reference', paymentIdOrReference)
    .select(SELECT)
    .single();

  if (error) throw new Error(`Unable to refund payment: ${error.message}`);
  return mapPayment(data);
}
