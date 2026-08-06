-- People CRM: standalone contact records populated via Slack ("I heard X
-- about this person on a call") or the app. Notes are an append-only,
-- timestamped log (mirrors todo_comments) rather than a single overwritten
-- field, so history of what was heard when is preserved.
create table public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  role text,
  phone text,
  email text,
  created_by uuid,
  last_actor_id uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.person_notes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  author_id uuid,
  source text not null default 'app' check (source = any (array['app', 'slack'])),
  body text not null,
  created_at timestamptz not null default now()
);

-- Optional link between a todo and CRM people, independent of the existing
-- free-text `contact` column on todos (which is left untouched). A todo can
-- reference any number of people; a person can be referenced by any number
-- of todos.
create table public.todo_people (
  todo_id uuid not null references public.todos(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (todo_id, person_id)
);

alter table public.people enable row level security;
alter table public.person_notes enable row level security;
alter table public.todo_people enable row level security;

create policy "service role full access people"
  on public.people for all
  using (auth.role() = 'service_role'::text);

create policy "service role full access person notes"
  on public.person_notes for all
  using (auth.role() = 'service_role'::text);

create policy "service role full access todo people"
  on public.todo_people for all
  using (auth.role() = 'service_role'::text);

-- Same narrow read-only pattern as todos/todo_comments: anon/authenticated
-- get SELECT only, just enough for Realtime postgres_changes delivery so
-- the People tab updates live when Claude Tag adds someone via Slack.
create policy "anon read-only people for realtime"
  on public.people for select
  to anon, authenticated
  using (deleted_at is null);

create policy "anon read-only person notes for realtime"
  on public.person_notes for select
  to anon, authenticated
  using (true);

alter table public.people replica identity full;
alter table public.person_notes replica identity full;

alter publication supabase_realtime add table public.people;
alter publication supabase_realtime add table public.person_notes;
