-- Staff RBAC hardening and secure member deletion.
alter table public.profiles
  add column if not exists email text,
  add column if not exists can_manage_members boolean not null default false,
  add column if not exists can_manage_memberships boolean not null default false,
  add column if not exists can_record_payments boolean not null default false,
  add column if not exists can_manage_attendance boolean not null default false,
  add column if not exists can_view_reports boolean not null default false,
  add column if not exists assigned_branch text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

update public.profiles
set can_manage_members = true,
    can_manage_memberships = true,
    can_record_payments = true,
    can_manage_attendance = true,
    can_view_reports = true
where role = 'admin';

create or replace function private.staff_has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'::account_status
      and (
        p.role = 'admin'::app_role
        or (p.role = 'staff'::app_role and case permission_name
          when 'members' then p.can_manage_members
          when 'memberships' then p.can_manage_memberships
          when 'payments' then p.can_record_payments
          when 'attendance' then p.can_manage_attendance
          when 'reports' then p.can_view_reports
          else false
        end)
      )
  );
$$;

revoke all on function private.staff_has_permission(text) from public;
grant execute on function private.staff_has_permission(text) to authenticated;

drop policy if exists members_select_admin_staff on public.members;
create policy members_select_admin_staff on public.members
for select to authenticated using (private.staff_has_permission('members'));

drop policy if exists members_insert_admin_staff on public.members;
create policy members_insert_admin_staff on public.members
for insert to authenticated with check (private.staff_has_permission('members'));

drop policy if exists members_update_admin_staff on public.members;
create policy members_update_admin_staff on public.members
for update to authenticated
using (private.staff_has_permission('members'))
with check (private.staff_has_permission('members'));

drop policy if exists memberships_insert_admin_staff on public.memberships;
create policy memberships_insert_admin_staff on public.memberships
for insert to authenticated with check (private.staff_has_permission('memberships'));

drop policy if exists memberships_update_admin_staff on public.memberships;
create policy memberships_update_admin_staff on public.memberships
for update to authenticated
using (private.staff_has_permission('memberships'))
with check (private.staff_has_permission('memberships'));

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
for select to authenticated using (
  private.staff_has_permission('memberships')
  or exists (select 1 from public.members m where m.id = memberships.member_id and m.user_id = auth.uid())
  or exists (select 1 from public.trainer_assignments ta where ta.member_id = memberships.member_id and ta.trainer_id = auth.uid() and ta.status = 'active'::assignment_status)
);

drop policy if exists payments_insert_admin_staff on public.payments;
create policy payments_insert_admin_staff on public.payments
for insert to authenticated with check (private.staff_has_permission('payments'));

drop policy if exists payments_update_admin_staff on public.payments;
create policy payments_update_admin_staff on public.payments
for update to authenticated
using (private.staff_has_permission('payments'))
with check (private.staff_has_permission('payments'));

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
for select to authenticated using (
  private.staff_has_permission('payments')
  or exists (select 1 from public.members m where m.id = payments.member_id and m.user_id = auth.uid())
);

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance
for insert to authenticated with check (private.staff_has_permission('attendance'));

drop policy if exists attendance_update on public.attendance;
create policy attendance_update on public.attendance
for update to authenticated
using (private.staff_has_permission('attendance'))
with check (private.staff_has_permission('attendance'));

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
for select to authenticated using (
  private.staff_has_permission('attendance')
  or exists (select 1 from public.members m where m.id = attendance.member_id and m.user_id = auth.uid())
  or exists (select 1 from public.trainer_assignments ta where ta.member_id = attendance.member_id and ta.trainer_id = auth.uid() and ta.status = 'active'::assignment_status)
);

drop policy if exists members_delete_admin on public.members;
create policy members_delete_admin on public.members
for delete to authenticated
using ((select private.current_app_role()) = 'admin'::app_role);

create or replace function public.delete_member_cascade(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  caller_role app_role;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is distinct from 'admin'::app_role then
    raise exception 'Only an admin can delete members';
  end if;
  if not exists (select 1 from public.members where id = p_member_id) then
    raise exception 'Member not found';
  end if;

  delete from public.attendance where member_id = p_member_id;
  delete from public.trainer_assignments where member_id = p_member_id;
  delete from public.workout_plans where member_id = p_member_id;
  delete from public.payments where member_id = p_member_id;
  delete from public.payments
    where membership_id in (select id from public.memberships where member_id = p_member_id);
  delete from public.memberships where member_id = p_member_id;
  delete from public.members where id = p_member_id;
end;
$$;

revoke execute on function public.delete_member_cascade(uuid) from anon;
grant execute on function public.delete_member_cascade(uuid) to authenticated;

revoke execute on function public.delete_member_cascade(uuid) from anon, authenticated;

create index if not exists attendance_recorded_by_idx on public.attendance(recorded_by);
create index if not exists payments_recorded_by_idx on public.payments(recorded_by);
