-- Analytics events table for all projects
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

create table if not exists events (
  id bigint generated always as identity primary key,
  site text not null,
  event text not null,
  props jsonb default '{}',
  pathname text,
  referrer text,
  user_agent text,
  screen_width smallint,
  created_at timestamptz default now()
);

-- Prevent storage abuse via oversized payloads
alter table events add constraint props_size_limit
  check (octet_length(props::text) < 4096);

alter table events add constraint event_length_limit
  check (length(event) < 100);

alter table events add constraint pathname_length_limit
  check (length(pathname) < 500);

-- Index for dashboard queries
create index if not exists idx_events_site_created on events (site, created_at desc);
create index if not exists idx_events_site_event on events (site, event);

-- Enable RLS
alter table events enable row level security;

-- Allow anonymous inserts only — validate known sites and field sizes
create policy "Allow anonymous inserts"
  on events for insert
  to anon
  with check (
    site in ('tiderpenge.dk') AND
    length(event) < 100 AND
    length(pathname) < 500 AND
    octet_length(props::text) < 4096
  );

-- Only service_role can read (bypasses RLS anyway, but explicit is better)
-- If you add Supabase Auth for a dashboard later, scope this to specific users
create policy "Authenticated can read"
  on events for select
  to authenticated
  using (true);
