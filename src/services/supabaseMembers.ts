/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabase';
import type { Membership, MembershipPlan } from '../types';

const EXPIRING_SOON_DAYS = 7;

/**
 * Converts a PostgreSQL membership status into the status
 * expected by the existing Warrior Fitness frontend.
 *
 * PostgreSQL:
 *   pending | active | expired | cancelled
 *
 * Frontend:
 *   ACTIVE | EXPIRING_SOON | EXPIRED | CANCELLED
 */
function mapMembershipStatus(
  status: string,
  endDate: string
): Membership['status'] {
  if (status === 'cancelled') {
    return 'CANCELLED';
  }

  if (status === 'expired') {
    return 'EXPIRED';
  }

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

  // A pending database membership does not currently have
  // a matching frontend status, so treat it as active until
  // the application gets an explicit pending state.
  return 'ACTIVE';
}

/**
 * Load membership plans from PostgreSQL.
 */
export async function getSupabaseMembershipPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `Unable to load membership plans: ${error.message}`
    );
  }

  return (data ?? []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description ?? '',
    durationDays: plan.duration_days,
    price: Number(plan.price),
    features: [],
    isActive: plan.is_active,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  }));
}

/**
 * Load memberships together with the member and plan
 * information needed by the existing frontend.
 */
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
        name,
        member_code
      ),
      membership_plans (
        name,
        price
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `Unable to load memberships: ${error.message}`
    );
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
      memberName: member?.name ?? '',
      memberCode: member?.member_code ?? '',
      planId: membership.plan_id,
      planName: plan?.name ?? '',
      startDate: membership.start_date,
      expiryDate: membership.end_date,
      price: Number(plan?.price ?? 0),
      status: mapMembershipStatus(
        membership.status,
        membership.end_date
      ),
      createdBy: '',
      createdAt: membership.created_at,
      updatedAt: membership.updated_at,
    };
  });
}
