---
name: log
description: Capture a decision, idea, feature request, or preference from Amy's current conversation into her dashboard notebook (Supabase), in her own words with the reasoning attached, so her Claude Code sessions pick it up with full context. Use when Amy says "log this", "note this", "add to my notebook", "remember this for the dashboard", "I want a feature — log it", or asks to save a thought or decision for later. Not for tasks or commitments — those go through sweep. Version 2026-08-11a.
---

# Log

Amy thinks out loud in Home conversations — dissecting a Fireflies meeting, working
through a problem — and mid-thought realizes she wants something built or has decided
something. This skill catches that moment before it evaporates. Claude Code cannot see
this conversation; the notebook is how her thinking travels.

**Amy Pacaldo** — EA to Gavin Brennen (COO) at **Lance** (always L-A-N-C-E).
Supabase project `liwmuwkcsurfgjugdvfm`, table `public.notebook`.

## What to capture

One insert per logged thought:

- **title** — one clean line naming the thing.
- **body** — the substance, and above all **the why**. Quote her verbatim where the
  phrasing carries reasoning ("I don't want X because Y"). Include what she considered
  and rejected if she said it. This field is the entire point of the skill — a title
  without the reasoning is exactly the handoff-file failure this replaces.
- **context** — what prompted it: the meeting being discussed, the thread, the problem
  ("while dissecting the Aug 5 onboarding transcript").
- **kind** — `decision` (she chose something), `feature` (she wants something built),
  `idea` (worth keeping, not yet chosen), `preference` (how she wants Claude or the
  dashboard to behave), `context` (background a Code session would need).

- **related_todo_id** — when the thought belongs to a task she is working (a booking, a
  write-up), attach it. Match on the task title:

```sql
select id, title, status from public.todos
where deleted_at is null and title ilike '%flight%';
```

  Attach when she names the task ("log this for the flight booking"), or when the
  conversation is plainly about one open task and there is a single obvious match. If two
  tasks could match, ask which — one short question, then log. If none match, leave it
  null; an unattached entry is fine and still reaches Claude Code.

```sql
insert into public.notebook (kind, title, body, context, related_todo_id)
values ('feature', '...', '...', '...', null);
```

Attaching matters: the sweep pulls attached entries into that task's **story** under
**Related**, so her process becomes part of the task's history instead of a loose note.

## Rules

- **Her words, not a summary.** Tighten for length if needed, but never launder her
  reasoning into generic prose. If she said why, the why goes in.
- **Confirm in one line** — "Logged: <title>" — and continue the conversation. No
  ceremony.
- **Log only what she asked to log.** Never volunteer entries from things she merely
  mentioned; never log inferred personality or reflective content — the record must stay
  something she trusts.
- **Not a task queue.** A commitment ("I told Isaac I'd send feedback") belongs to the
  sweep/Inbox pipeline, not here. If she tries to log one, say so and offer both.
- One thought = one row. If she logs three things, three rows.
- What happens next: her Claude Code sessions read unprocessed entries at session start,
  act on or discuss each, and stamp `processed_at` + `outcome`. If she asks whether
  something was picked up, query for her.
