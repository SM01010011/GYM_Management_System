-- Prevent one member from having overlapping attendance sessions.
-- This is a database-level rule; frontend checks are only for user experience.
--
-- btree_gist is already present in this project, but IF NOT EXISTS keeps this
-- migration safe if it is applied to another compatible environment.

create extension if not exists btree_gist;

alter table public.attendance
  add constraint attendance_no_overlapping_sessions
  exclude using gist (
    member_id with =,
    tstzrange(
      checked_in_at,
      coalesce(checked_out_at, 'infinity'::timestamptz),
      '[)'
    ) with &&
  );
