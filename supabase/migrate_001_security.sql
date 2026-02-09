-- Run this in Supabase SQL Editor to apply security fixes to the existing events table
-- https://supabase.com/dashboard/project/_/sql

-- 1. Add CHECK constraints to prevent oversized payloads
alter table events add constraint props_size_limit
  check (octet_length(props::text) < 4096);

alter table events add constraint event_length_limit
  check (length(event) < 100);

alter table events add constraint pathname_length_limit
  check (length(pathname) < 500);

-- 2. Replace the permissive RLS insert policy with a validated one
drop policy if exists "Allow anonymous inserts" on events;

create policy "Allow anonymous inserts"
  on events for insert
  to anon
  with check (
    site in ('tiderpenge.dk') AND
    length(event) < 100 AND
    length(pathname) < 500 AND
    octet_length(props::text) < 4096
  );

-- 3. Delete the test row
delete from events where event = 'test_event';
