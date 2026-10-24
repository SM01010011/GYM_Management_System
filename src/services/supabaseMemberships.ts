/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabase';
import type { Membership, MembershipPlan } from '../types';

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

/**
 * Create a membership plan.
 * Database RLS is the authorization boundary; only admin may write.
 */
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

/**
 * Update a membership plan.
 * Database RLS is the authorization boundary; only admin may write.
 */
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

  return (data ?? []).map((membership) => {
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
  });
}
