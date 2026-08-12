# Amy's HQ — read this before touching anything

This file is how Amy's way of working survives between sessions. Update it when she
states a new preference; never infer one. Every rule below was earned in the first week —
most of them by getting something wrong once.

## Who

**Amy Pacaldo** (amy@lance.live) — Executive Assistant to **Gavin Brennen**, COO of
**Lance** (always spelled L-A-N-C-E), a hotel-operations software startup. **Isaac
Gutierrez** ran her onboarding and built the original briefing skill her `brief` skill is
adapted from. **Caleb Chan** is CEO. **Gatik Trivedi** is CTO (Fireflies garbles him as
"Guthick"). ~18 people; also OTO Development and Peachtree as hotel-side contacts.

Amy works from the Philippines — **15 hours ahead of the team**. Her formal start is
9:00 AM PT, which is midnight Manila. Her sleep and work cadence is irregular **by
design**; never schedule anything on her behalf, never comment on her hours.

Day 1 of everything is **Wed Aug 5, 2026**. Nothing about amy@lance.live predates it.

## What this repo is

Her personal HQ dashboard: React + Vite + Tailwind on Vercel (`amy-task-dashboard`),
Supabase project `liwmuwkcsurfgjugdvfm`, deployed by git push (both branches — see
Conventions). The repo is **public**; the anon key is never bundled, only served
post-auth. Purpose: efficiency, visibility, and transparency between her, Gavin, and
Isaac — "not to make too much noise."

Views, in her chosen order: **Inbox** (review queue — nothing becomes a task without
her), Kanban ("Pending" not "Waiting"; Done column shows this week, Monday onward
Pacific, and empties itself each Monday), List, Timeline
(due dates, forward-looking), Calendar (proof-of-work: what she did, meetings with
discussion checklists, deadlines), People, Profile (passphrase-gated, hers to write).

**Access model (three passphrases):** the original shared passphrase
(`DASHBOARD_PASSPHRASE` env var — known to Gavin and Isaac, present in Slack history) is
**view-only**; the editor passphrase (hash in `access_gate`, never shared, never in
Slack) grants writes — every non-GET endpoint checks `requireEditor`, profile excepted
since its own passphrase is stronger; the profile passphrase gates her private tab.
Tokens without a role prefix are viewers, so pre-split cookies demoted automatically.
Rotate the editor passphrase by updating the hash in `access_gate`.

## Standing rules — the ones that are really hers

1. **Discussion before execution.** Talk the design through with her before building
   anything she hasn't already approved. She decides; you advise. "We do the thinking" —
   then she says build.
2. **Don't be agreeable.** She has said this verbatim. Disagree with reasons, recommend
   one option, don't survey.
3. **Accuracy over speed.** She chose the slow-but-verified path explicitly. Verify
   against sources; never present a guess as a fact.
4. **Time.** The dashboard renders **Pacific**; her tools stay Manila-local. Timestamps
   are absolute instants converted deliberately. **Plain dates never timezone-shift.**
   The Slack API prints times in her local zone while labelling them `CST` — always
   convert from the epoch in `message_ts`, never the displayed string. Never write a
   timestamp (especially `sweep_state.last_swept_at`) without reading the actual clock;
   when unsure, err earlier — dedupe is free, a blind window is not.
4b. **Finished-times.** `completed_at` = when the work actually finished, per best
   evidence; `completed_source` says which ('click' provisional, 'evidence', 'manual').
   A Done click stamps immediately so work is never invisible; sweeps propose day-level
   corrections as `kind='correction'` Inbox cards — evidence quoted, Amy arbitrates.
   Never flag mere absence of evidence, and never rewrite her record directly.
   **The ask is not the finish.** `received_at` is when the work was handed over;
   collapsing it into `completed_at` produced eleven wrong records in week one, including
   Isaac's unanswered question marked done at the moment she asked it. `public.todo_audit`
   catches that class and seven others — the sweep must return it empty or explain every
   row. An unevidenced finish keeps `completed_source` null instead of claiming a source.
4c. **Short front, deep behind.** Task titles are plain and short; the whole history
   lives in `todos.story` (markdown, bullets, written by the sweep) and shows when she
   opens the task. Quote verbatim only where someone's words *changed* the task. `⚠`
   marks an unresolved consequence and nothing else. A queue she must read twice is a
   queue she stops trusting.
5. **Minimal but efficient.** No feature without a job. She cut tabs deliberately.
   Suggest something better if it exists; don't add surface area.
6. **Nothing is ever destroyed.** Every table she can delete from soft-deletes
   (`deleted_at`; inbox uses `state='dismissed'`). Undo appears where the action
   happened — there is deliberately no Trash tab.
7. **The Inbox is the gate.** Sweeps file *candidates* with a `claude_note` explaining
   the verification finding. Nothing auto-approves. Fireflies mis-attributes — check
   whether an item is actually hers, and whether it's already done, before filing.
8. **On demand, never scheduled.** `sweep` and `brief` fire when she asks. A scheduled
   run once contradicted this and was deleted; `brief` carries an unattended-run guard
   (skip capture, read-only) as insurance.
9. **Acknowledgement.** Credit the people who helped — "it's never about 'I did this'."
   Isaac's structure credit stays at the top of `brief`. Model identity stays out of
   commits and repo artifacts.
10. **People = awareness log, not a roster.** Where names crossed her awareness, grouped
    by tool then date. Verified/unverified tiers with a citation — reputational
    safeguard. Core team (Gavin, Isaac, Caleb) excluded. The Rippling org chart and
    lance.live/internal screenshots are **reference for verification only**, never
    displayed as a roster.
11. **The Profile is hers to write.** Never infer or propose reflective content — voice,
    personality, rhythm. Factual disclosure events only (proposed via Inbox,
    `kind='memory'`).

## Where the record lives

- `docs/status/design-decisions.md` — **append every decision with its why.** This is
  the canonical reasoning log; it exists so decisions don't get re-litigated.
- `docs/source/` — verbatim sources (her request log, thinking-process log, Isaac's
  original brief prompt). Never paraphrase these.
- `docs/status/sweep-log.md` — what each full sweep did and the judgement calls made.
- `docs/backups/` — database snapshots before destructive operations. Always snapshot
  before a wipe.
- `.claude/skills/` — `sweep`, `brief`, and `log`. Same files are uploaded to her
  claude.ai account; keep the `Version YYYY-MM-DDx.` stamp in each description current
  so the installed copy is verifiable remotely (the description is the only field
  readable via ListSkills).
- Amy's Home project ("Lance EA — HQ") holds snapshot copies of this file and
  `design-decisions.md` in its project knowledge; its instructions also point at the
  live GitHub raw URLs. The snapshots rot as work continues and Amy must never have to
  remember to refresh them: **when a session meaningfully grows either file, end by
  sending her fresh copies** (SendUserFile) with a one-line "re-upload these to the
  project when convenient." Her cost is one click; the remembering is ours.

## The notebook — how her thinking reaches you from Home

Amy thinks out loud in claude.ai Home conversations (dissecting Fireflies meetings,
realizing she wants a feature). Home cannot reach this repo — but it writes to Supabase.
Her `log` skill captures those moments **in her own words, with the reasoning and
context**, into `public.notebook`.

**At the start of every session — and whenever she asks "anything from home?" — run:**

```sql
select * from notebook where processed_at is null order by created_at;
```

For each entry: discuss or act per rule 1, then mark it
(`update notebook set processed_at = now(), outcome = '<one line>' where id = ...`).
If an entry states a durable preference, fold it into this file — that is how this
document evolves instead of rotting.

**Her notebook rules govern your recommendations, not just your filing.** A `preference`
or `method` entry is a standing rule: check every nudge, flag and suggestion against them
before offering it. Two that have already been broken once — never recommend a reminder
without opening the thread to confirm it is genuinely unanswered and she has not closed it
herself, and never call something a contradiction without first comparing the timestamps
of the two things supposedly in conflict.

`kind='method'` entries are her **SOP library** — repeatable procedures with the failure
each step prevents. Read them before rebuilding anything they cover, and treat a stable,
recurring method as the candidate for its own skill (that is how `checkin` was proposed).
`select title, body from notebook where kind = 'method' order by created_at;`

`notebook` has RLS enabled with **no policies on purpose** — only service-role callers
(Code sessions, her Home connector) touch it; the browser never does. Don't "fix" it
with anon policies. Likewise `sweep_state.updated_at` is trigger-maintained
(`sweep_state_touch`) — it once sat unmaintained and produced a false blind-window alarm.

## Conventions

- **Build-gated pushes, no exceptions:** `set -e`, `npm run build` must pass before
  commit; never pipe the build through anything that masks its exit code.
- Push to **both** branches: the working branch and
  `claude/amy-task-dashboard-deploy-16f9gc` (Vercel deploys from the repo's default
  branch; ~20s builds).
- **12 serverless functions is the ceiling** (Vercel Hobby). New API surface goes inside
  `api/hq/[resource].js`.
- Realtime is degraded until Amy fixes `SUPABASE_ANON_KEY` in Vercel (it holds a URL) —
  the app polls/refreshes fine; don't "fix" this in code.
- Reference code as `file:line`. Match the existing comment voice — comments explain
  *why*, in plain prose.

## Known live threads (check, don't assume)

Vanta security tasks due **Aug 18**. Codebase access + Gmail delegation both sit with
Gavin. Isaac's unanswered day-1 question: does an EA get Fireflies access to calls she
isn't on? Lance Live password is still `testing`. Passphrases have been shared in Slack —
flag exposure when relevant, don't lecture.
