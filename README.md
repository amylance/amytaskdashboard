# Amy Task Dashboard

Single-tenant task board backed by Supabase, kept live via Realtime, driven both from this
web UI and from Claude Tag in Slack writing directly to the same tables.

## Stack

- React + Vite, Tailwind CSS v4, lucide-react icons
- Supabase JS client with Realtime subscriptions on `todos`, `inbox_items` and `meetings`
- Vercel serverless functions under `/api` for the passphrase gate and all data writes
  (using the service role key, kept server-only)

## How access control works

The app is gated by a single shared passphrase, not full user auth:

- `POST /api/login` checks the submitted passphrase against `DASHBOARD_PASSPHRASE`
  (server-side only) and sets a signed, httpOnly session cookie.
- `GET /api/session` returns `{ authenticated: false }` until that cookie is valid. Once
  authenticated, it also hands the browser the Supabase URL + anon key so the client can
  open a Realtime websocket — those values are never in the static JS bundle.
- All task reads and writes go through `/api/todos/*` and `/api/hq/*`, which run
  server-side with the Supabase **service role** key. The anon key the browser holds is
  scoped by RLS to read-only `SELECT` on non-deleted, non-private `todos` — just enough for
  Realtime's `postgres_changes` delivery to work, with no INSERT/UPDATE/DELETE grant.
  Private tasks are filtered both in the API and by the RLS policy, so the lock holds even
  if someone reaches the database directly.

## Local development

```bash
npm install
cp .env.example .env   # fill in real values locally, never commit .env
vercel dev             # serves the Vite app + /api/* functions together
```

Plain `vite dev` only serves the frontend — the `/api` routes need `vercel dev` (or an
equivalent Node server) to run.

## Environment variables

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | server (`/api/*`) | Supabase project API URL |
| `SUPABASE_ANON_KEY` | server → handed to client post-auth | Restricted by RLS to read-only |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Never exposed to the browser |
| `DASHBOARD_PASSPHRASE` | server only | Checked in `/api/login` |

See `.env.example`. Real values are set in Vercel's dashboard, not in this repo.

## Data model

Schema and RLS policies live in Supabase migrations (`init_task_dashboard_schema`,
`passphrase_app_rls_and_realtime`).

A task with a `parent_id` is a **step** of the goal it points at — one level only. The
`todos_close_goal` trigger closes a goal when its last step closes and reopens it when a
step reopens, so an evidence-driven sweep and a click in the browser behave identically.
`is_method` marks the work whose full history is worth keeping.

`public.todo_audit` is the integrity check — it must return no rows. Nine unused tables and
eleven unused columns were dropped in `steps_under_a_goal_and_card_cleanup` after measuring
that nothing wrote to them.
