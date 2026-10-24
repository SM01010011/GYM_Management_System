-- Warrior Fitness: membership plan CRUD fields and RLS
-- Non-destructive: adds optional metadata columns and preserves existing data.

alter table public.membership_plans
  add column if not exists features text[] not null default '{}',
  add column if not exists tier_badge text,
  add column if not exists is_popular boolean not null default false;

create index if not exists membership_plans_active_idx
  on public.membership_plans (is_active, created_at desc);

alter table public.membership_plans enable row level security;

drop policy if exists plans_admin_manage on public.membership_plans;
create policy plans_admin_manage
  on public.membership_plans
  for all
  to authenticated
  using ((select private.current_app_role()) = 'admin'::app_role)
  with check ((select private.current_app_role()) = 'admin'::app_role);

drop policy if exists plans_authenticated_read on public.membership_plans;
create policy plans_authenticated_read
  on public.membership_plans
  for select
  to authenticated
  using (
    is_active = true
    or (select private.current_app_role()) = any (
      array['admin'::app_role, 'staff'::app_role, 'trainer'::app_role]
    )
  );

drop policy if exists plans_public_read_active on public.membership_plans;
create policy plans_public_read_active
  on public.membership_plans
  for select
  to anon
  using (is_active = true);
