-- Profile / Memory tab (items 3 + 11): editable sections of "who Amy is / what she's
-- learned", each marked public or private (soft privacy — private sections are hidden
-- behind a reveal in the UI, not per-user locked). Additive and idempotent.

create table if not exists public.profile_sections (
  id uuid primary key default gen_random_uuid(),
  heading text not null,
  body text not null default '',
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_sections enable row level security;

create policy "service role full access profile sections"
  on public.profile_sections for all using (auth.role() = 'service_role'::text);
create policy "anon read-only profile sections for realtime"
  on public.profile_sections for select to anon, authenticated using (true);

alter table public.profile_sections replica identity full;
alter publication supabase_realtime add table public.profile_sections;
