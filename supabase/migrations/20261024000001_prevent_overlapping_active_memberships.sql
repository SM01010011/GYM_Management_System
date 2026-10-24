-- Prevent overlapping active/pending memberships for the same member.
-- This is a database-level invariant, so concurrent requests cannot bypass it.
create extension if not exists btree_gist;

alter table public.memberships
  add constraint memberships_no_active_overlap
  exclude using gist (
    member_id with =,
    daterange(start_date, end_date + 1, '[]') with &&
  )
  where (status in ('pending', 'active'));
