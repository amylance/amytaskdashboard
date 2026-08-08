-- Activity events: Amy's "what I did" record, placed on real dates for the calendar
-- (her proof-of-work for Gavin/Isaac). Distinct from tasks; bucketed by San Francisco day.
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text,
  event_date date not null,
  kind text not null default 'action' check (kind in ('meeting', 'action', 'milestone')),
  source text,
  source_url text,
  created_at timestamptz not null default now()
);

alter table public.activity_events enable row level security;
create policy "service role full access activity events"
  on public.activity_events for all using (auth.role() = 'service_role'::text);
create policy "anon read-only activity events for realtime"
  on public.activity_events for select to anon, authenticated using (true);
alter table public.activity_events replica identity full;
alter publication supabase_realtime add table public.activity_events;
