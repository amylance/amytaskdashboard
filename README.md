# Amy Task Dashboard

Single-tenant task board backed by Supabase, kept live via Realtime, driven both from this
web UI and from Claude Tag in Slack writing directly to the same tables.

## Stack

- React + Vite, Tailwind CSS v4, lucide-react icons
- Supabase JS client with Realtime subscriptions on `todos` and `todo_comments`
- Vercel serverless functions under `/api` for the passphrase gate and all data writes
  (using the service role key, kept server-only)

## How access control works

The app is gated by a single shared passphrase, not full user auth:

- `POST /api/login` checks the submitted passphrase against `DASHBOARD_PASSPHRASE`
  (server-side only) and sets a signed, httpOnly session cookie.
- `GET /api/session` returns `{ authenticated: false }` until that cookie is valid. Once
  authenticated, it also hands the browser the Supabase URL + anon key so the client can
  open a Realtime websocket — those values are never in the static JS bundle.
- All todo/comment reads and writes go through `/api/todos/*`, which run server-side with
  the Supabase **service role** key. The anon key the browser holds is scoped by RLS to
  read-only `SELECT` on `todos` (non-deleted rows) and `todo_comments` — just enough for
  Realtime's `postgres_changes` delivery to work, with no INSERT/UPDATE/DELETE grant.

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
`passphrase_app_rls_and_realtime`). `todo_proposals`, `slack_sync_state`, and
`calendar_events` are reserved for future work and unused by this app today.
