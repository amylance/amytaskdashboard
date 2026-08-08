-- Version 1 foundation: Awareness Log + Status + Pending notes
--
-- Extends the People CRM into Amy's "awareness log" — verified/unverified tiers with
-- clickable source provenance — and adds an away/status log and a per-page "pending"
-- notes table. Everything here is ADDITIVE and idempotent (IF NOT EXISTS / guarded
-- constraints), so it is safe to run once against the current (reverted-to-basic)
-- schema without touching existing rows.
--
-- Note: this migration is SCHEMA ONLY. Re-populating people (the verified team + the
-- now-verified hotel contacts) and seeding the "pending" notes are separate, explicitly
-- approved steps — nothing is inserted here.

-- 1. people — verification tiers, classification, and encounter/source metadata
alter table public.people add column if not exists verification_tier text not null default 'unverified'
  check (verification_tier in ('verified', 'unverified'));
alter table public.people add column if not exists verification_source text;
alter table public.people add column if not exists crm_type text not null default 'hotel_contact'
  check (crm_type in ('lance_team', 'hotel_contact'));
alter table public.people add column if not exists department text;
alter table public.people add column if not exists reports_to text;
alter table public.people add column if not exists location text;
alter table public.people add column if not exists tenure_note text;
alter table public.people add column if not exists employment_type text;
alter table public.people add column if not exists is_intern boolean not null default false;
alter table public.people add column if not exists last_day date;
alter table public.people add column if not exists source_url text;

-- 2. person_notes — encounter entries with clickable provenance
--    (why the name showed up, what they said, where it came from, with a link to jump to it)
alter table public.person_notes add column if not exists occurred_at timestamptz;
alter table public.person_notes add column if not exists source_url text;
alter table public.person_notes add column if not exists activity_type text
  check (activity_type in ('meeting', 'slack_thread', 'slack_message', 'email', 'note'));
-- widen the source check to include fireflies + email (was: app, slack only)
alter table public.person_notes drop constraint if exists person_notes_source_check;
alter table public.person_notes add constraint person_notes_source_check
  check (source in ('app', 'slack', 'fireflies', 'email'));

-- 3. status_events — the away/status log (a living record of Amy's rhythm)
--    current status = the most recent row with ended_at IS NULL
create table if not exists public.status_events (
  id uuid primary key default gen_random_uuid(),
  status text not null,            -- 'walking_dogs' | 'away' | 'focus' | 'available' | ...
  label text,                      -- human label / free text
  note text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,            -- NULL = currently active
  created_at timestamptz not null default now()
);

-- 4. pending_items — the per-page "Pending" corner note
--    (dashboard items waiting on approval / access / a conversation with Isaac)
create table if not exists public.pending_items (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global',   -- 'people' | 'tasks' | 'global' | ...
  title text not null,
  reason text,                             -- why it's pending
  blocked_on text,                         -- what unblocks it (e.g. 'Isaac / lance.live access')
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- RLS + Realtime for the two new tables (mirrors the existing people/person_notes pattern:
-- service role full access; anon/authenticated read-only for Realtime delivery)
alter table public.status_events enable row level security;
alter table public.pending_items enable row level security;

create policy "service role full access status events"
  on public.status_events for all using (auth.role() = 'service_role'::text);
create policy "anon read-only status events for realtime"
  on public.status_events for select to anon, authenticated using (true);

create policy "service role full access pending items"
  on public.pending_items for all using (auth.role() = 'service_role'::text);
create policy "anon read-only pending items for realtime"
  on public.pending_items for select to anon, authenticated using (true);

alter table public.status_events replica identity full;
alter table public.pending_items replica identity full;
alter publication supabase_realtime add table public.status_events;
alter publication supabase_realtime add table public.pending_items;
