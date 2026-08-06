-- Passphrase-gated single-tenant access model.
-- Writes and privileged reads (activity log, assignee joins) go through the
-- Vercel serverless API using the service role key (already fully permitted
-- by the existing "service role full access *" policies).
--
-- The browser client only ever holds the anon key, and uses it for exactly
-- one purpose: receiving Supabase Realtime postgres_changes events on
-- `todos` and `todo_comments` so the board updates live when Claude Tag (or
-- anyone else) writes to these tables. Realtime's postgres_changes delivery
-- is gated by each table's SELECT RLS policy for the connecting role, so we
-- grant anon/authenticated a narrow, read-only SELECT here -- no INSERT,
-- UPDATE, or DELETE grant exists for those roles on any table, so a leaked
-- anon key cannot mutate data, only read non-deleted todos and comments.

create policy "anon read-only todos for realtime"
  on public.todos
  for select
  to anon, authenticated
  using (deleted_at is null);

create policy "anon read-only comments for realtime"
  on public.todo_comments
  for select
  to anon, authenticated
  using (true);

-- Full row images on UPDATE/DELETE so realtime payloads carry old + new data.
alter table public.todos replica identity full;
alter table public.todo_comments replica identity full;

-- Add the two live-updating tables to the realtime publication.
alter publication supabase_realtime add table public.todos;
alter publication supabase_realtime add table public.todo_comments;

-- Close the one RLS gap flagged by the advisor: slack_sync_state had RLS
-- disabled entirely. It's unused by this app (reserved for a future Slack
-- polling job) so lock it down the same way as the other placeholder
-- tables: service-role only, no client access at all.
alter table public.slack_sync_state enable row level security;

create policy "service role full access sync state"
  on public.slack_sync_state
  for all
  using (auth.role() = 'service_role'::text);
