/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabase';
import type { Membership, MembershipPlan } from '../types';
import { addDaysToDate } from '../utils/dateUtils';

const EXPIRING_SOON_DAYS = 7;

function mapMembershipStatus(
  status: string,
  endDate: string
): Membership['status'] {
  if (status === 'cancelled') return 'CANCELLED';
  if (status === 'expired') return 'EXPIRED';

  if (status === 'active') {
    const today = new Date();
    const expiry = new Date(`${endDate}T00:00:00`);
    const differenceMs = expiry.getTime() - today.getTime();
    const differenceDays = Math.ceil(
      differenceMs / (1000 * 60 * 60 * 24)
    );

    if (differenceDays >= 0 && differenceDays <= EXPIRING_SOON_DAYS) {
      return 'EXPIRING_SOON';
    }

    return 'ACTIVE';
  }

  return 'ACTIVE';
}

function mapPlan(plan: any): MembershipPlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? '',
    durationDays: Number(plan.duration_days),
    price: Number(plan.price),
    features: Array.isArray(plan.features) ? plan.features : [],
    tierBadge: plan.tier_badge ?? undefined,
    isPopular: Boolean(plan.is_popular),
    isActive: Boolean(plan.is_active),
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
}

function mapMembershipRow(membership: any): Membership {
  const member = Array.isArray(membership.members)
    ? membership.members[0]
    : membership.members;

  const plan = Array.isArray(membership.membership_plans)
    ? membership.membership_plans[0]
    : membership.membership_plans;

  return {
    id: membership.id,
    memberId: membership.member_id,
    memberName: member?.full_name ?? '',
    memberCode: '',
    planId: membership.plan_id,
    planName: plan?.name ?? '',
    startDate: membership.start_date,
    expiryDate: membership.end_date,
    price: Number(plan?.price ?? 0),
    status: mapMembershipStatus(membership.status, membership.end_date),
    createdBy: '',
    createdAt: membership.created_at,
    updatedAt: membership.updated_at,
  };
}

export async function getSupabaseMembershipPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Unable to load membership plans: ${error.message}`);
  }

  return (data ?? []).map(mapPlan);
}

export async function createSupabaseMembershipPlan(
  data: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MembershipPlan> {
  const { data: created, error } = await supabase
    .from('membership_plans')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      duration_days: data.durationDays,
      price: data.price,
      features: data.features ?? [],
      tier_badge: data.tierBadge?.trim() || null,
      is_popular: Boolean(data.isPopular),
      is_active: Boolean(data.isActive),
      currency: 'INR',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Unable to create membership plan: ${error.message}`);
  }

  return mapPlan(created);
}

export async function updateSupabaseMembershipPlan(
  id: string,
  updates: Partial<MembershipPlan>
): Promise<MembershipPlan> {
  const payload: Record<string, unknown> = {};

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) {
    payload.description = updates.description.trim() || null;
  }
  if (updates.durationDays !== undefined) {
    payload.duration_days = updates.durationDays;
  }
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.features !== undefined) payload.features = updates.features;
  if (updates.tierBadge !== undefined) {
    payload.tier_badge = updates.tierBadge?.trim() || null;
  }
  if (updates.isPopular !== undefined) payload.is_popular = updates.isPopular;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('membership_plans')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Unable to update membership plan: ${error.message}`);
  }

  return mapPlan(data);
}

/**
 * Assign an existing plan to an existing member.
 *
 * Authorization is enforced by the memberships INSERT RLS policy:
 * only Admin and Staff may create memberships.
 *
 * The database exclusion constraint prevents overlapping pending/active
 * memberships for the same member, including concurrent requests.
 */
export async function createSupabaseMembership(params: {
  memberId: string;
  planId: string;
  startDate: string;
  notes?: string;
}): Promise<Membership> {
  if (!params.memberId || !params.planId || !params.startDate) {
    throw new Error('Member, plan, and start date are required.');
  }

  const { data: plan, error: planError } = await supabase
    .from('membership_plans')
    .select('id, duration_days, is_active')
    .eq('id', params.planId)
    .single();

  if (planError) {
    throw new Error(`Unable to load membership plan: ${planError.message}`);
  }

  if (!plan.is_active) {
    throw new Error('This membership plan is inactive and cannot be assigned.');
  }

  // A 30-day plan starting on Oct 24 covers Oct 24 through Nov 22.
  const endDate = addDaysToDate(params.startDate, Number(plan.duration_days) - 1);

  const { data: created, error } = await supabase
    .from('memberships')
    .insert({
      member_id: params.memberId,
      plan_id: params.planId,
      start_date: params.startDate,
      end_date: endDate,
      status: 'active',
      notes: params.notes?.trim() || null,
    })
    .select(`
      id,
      member_id,
      plan_id,
      start_date,
      end_date,
      status,
      created_at,
      updated_at,
      members (
        id,
        full_name
      ),
      membership_plans (
        id,
        name,
        price
      )
    `)
    .single();

  if (error) {
    if (error.code === '23P01') {
      throw new Error(
        'This member already has an active or pending membership covering those dates.'
      );
    }

    throw new Error(`Unable to assign membership: ${error.message}`);
  }

  return mapMembershipRow(created);
}

export async function getSupabaseMemberships(): Promise<Membership[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id,
      member_id,
      plan_id,
      start_date,
      end_date,
      status,
      created_at,
      updated_at,
      members (
        id,
        full_name
      ),
      membership_plans (
        id,
        name,
        price
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Unable to load memberships: ${error.message}`);
  }

  return (data ?? []).map(mapMembershipRow);
}


export async function renewSupabaseMembership(params: {
  memberId: string;
  planId?: string;
  performedBy?: string;
}): Promise<Membership> {
  const current = (await getSupabaseMemberships()).find(
    membership => membership.memberId === params.memberId &&
      membership.status !== 'CANCELLED'
  );

  let planId = params.planId ?? current?.planId;
  if (!planId) {
    const plans = await getSupabaseMembershipPlans();
    planId = plans.find(plan => plan.isActive)?.id;
  }
  if (!planId) throw new Error('No active membership plan is available.');

  const { data: plan, error: planError } = await supabase
    .from('membership_plans')
    .select('id, duration_days, price, name, is_active')
    .eq('id', planId)
    .single();

  if (planError) throw new Error(`Unable to load membership plan: ${planError.message}`);
  if (!plan.is_active) throw new Error('This membership plan is inactive.');

  const todayString = new Date().toISOString().slice(0, 10);
  const currentEnd = current ? new Date(`${current.expiryDate}T00:00:00`) : null;
  const wasActive = Boolean(currentEnd && currentEnd >= new Date(`${todayString}T00:00:00`));
  const startDate = current && wasActive ? current.startDate : todayString;
  const endDate = current && wasActive
    ? addDaysToDate(current.expiryDate, Number(plan.duration_days))
    : addDaysToDate(startDate, Number(plan.duration_days) - 1);

  if (!current) {
    return createSupabaseMembership({ memberId: params.memberId, planId, startDate });
  }

  const { data, error } = await supabase
    .from('memberships')
    .update({
      plan_id: planId,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
    })
    .eq('id', current.id)
    .select(`
      id, member_id, plan_id, start_date, end_date, status, created_at, updated_at,
      members (id, full_name),
      membership_plans (id, name, price)
    `)
    .single();

  if (error) throw new Error(`Unable to renew membership: ${error.message}`);
  return mapMembershipRow(data);
}

export async function cancelSupabaseMembership(membershipId: string): Promise<void> {
  const { error } = await supabase
    .from('memberships')
    .update({ status: 'cancelled' })
    .eq('id', membershipId);

  if (error) throw new Error(`Unable to cancel membership: ${error.message}`);
}
