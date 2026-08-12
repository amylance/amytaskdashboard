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
(dated work only, forward-looking), Calendar (proof-of-work: what she did, meetings with
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
3b. **A search that returns nothing is not evidence of absence.** It is evidence about the
   query. This cost her real trust once: a Slack search for *"let's do this"* came back
   empty and was reported as a fabricated quote; the phrase was *"lets do it"*, said by
   Gavin, sitting in the thread the whole time. **Before concluding something was never
   said, open the actual thread and read it.** And never write a quote that is not present
   verbatim in retrieved text — not a paraphrase promoted to a quote, not a remembered one.
3c. **Verify before you conclude, not after she checks.** Every correction this file
   records was caught by Amy, not by the work. Her standard: *"I don't want to keep
   checking your work."*
4. **Time.** The dashboard renders **Pacific**; her tools stay Manila-local. Timestamps
   are absolute instants converted deliberately. **Plain dates never timezone-shift.**
   The Slack API prints times in her local zone while labelling them `CST` — always
   convert from the epoch in `message_ts`, never the displayed string. Never write a
   timestamp (especially `sweep_state.last_swept_at`) without reading the actual clock;
   when unsure, err earlier — dedupe is free, a blind window is not.
4b. **Finished-times.** `completed_at` = when the work actually finished, per best
   evidence; `completed_source` says which ('click' provisional, 'evidence', 'manual').
   A Done click stamps immediately so work is never invisible. When a sweep finds evidence
   the work finished at a different time, it **updates the task in place** and says so in
   the `story` — no Inbox card. Her ruling: *"an item is an item that spreads out to all
   views. It just updates it, not create a separate card."* A card for work already finished
   read as a duplicate. **Silent edits are for *when*, never for *whether*** — evidence that
   disputes the task is done at all still goes to the Inbox as `kind='correction'`.
   Never flag mere absence of evidence.
   **The ask is not the finish.** `received_at` is when the work was handed over;
   collapsing it into `completed_at` produced eleven wrong records in week one, including
   Isaac's unanswered question marked done at the moment she asked it. `public.todo_audit`
   catches that class and seven others — the sweep must return it empty or explain every
   row. An unevidenced finish keeps `completed_source` null instead of claiming a source.
4c. **Short front, deep behind.** Task titles are plain and short; the whole history
   lives in `todos.story` (markdown, bullets, written by the sweep) and shows when she
   opens the task. Quote verbatim only where someone's words *changed* the task. `⚠`
   marks an unresolved consequence and nothing else. A queue she must read twice is a
   queue she stops trusting. **Depth follows `is_method`:** only work that will become a
   repeatable system (weekly hotel write-up, processing Gavin's inbox) keeps a full history
   of what pivoted. Routine work — "talk to the tech", "request this" — gets a bullet or
   two. Her words: those *"don't need that verbatim shit."*
4d. **Goals and steps.** A task with a `parent_id` is a **step** of the goal it points at.
   Her shape, in her words: *"All these related tasks only lead to one task."*
   **A step is never its own card** — not in any column, not in Done. It is ticked,
   re-statused (To Do / Doing / Pending) and read from inside the goal that owns it. She
   reversed the draggable-step design after watching one goal drawn three times in a single
   column. The goal's own status decides its column.
   **Nothing closes a goal on her behalf.** Every step ticked unlocks a confirmation; her
   click finishes it. The trigger keeps only the protective half — reopening a step reopens
   the goal, so a goal can never sit in Done above live work.
   A finished step shows **the day it happened** in place of the word "Done"; open it to
   set the date if evidence has not supplied one.
   One level only — the database refuses a step of a step.
   **Calendar bookends a goal:** the day it landed and the day its last step closed, two
   entries for one goal, with each step on its own finish day. Clicking a step opens the
   goal with that step lit.
4e. **Due dates come from sources, never judgement.** Set `due_date` only when a meeting,
   Slack message, email or her notebook actually named a date; quote it in the story. No
   date is the normal case, not a gap to fill — the Timeline shows dated work only, so an
   invented deadline puts phantom pressure on her week. Never flag a task for lacking one.
4f. **Naming.** Verb first, then the object; active voice. 2–5 words is the target, **not a
   cap — grammar beats brevity**, and a possessive is never dropped to save a word
   ("Get access to Gavin's inbox", never "Get Gavin inbox access"). No names, dates or
   ticket numbers in a title; that is the story's job. A goal states what done means.
   **32 characters is a hard ceiling** — longer truncates in the step list on a goal card.
   `todo_audit` enforces both the ceiling and the leading verb, because writing the rule in
   this file did not stop it being broken and she had to catch it twice.
4h. **Errors do not accumulate, because every check is retroactive.** `todo_audit` and
   `hq_enforce()` re-examine **every** card on every run, never just the new ones. A defect
   written today is caught by any run after it. When the quote-source check was added it
   immediately surfaced twelve cards from previous days — that is the mechanism working, not
   a backlog forming. **The count of ways the board can be silently wrong only ever goes
   down**, because each thing Amy catches becomes a query that catches it from then on.
4g. **A rule is not done until something enforces it.** Every rule here that can be checked
   mechanically belongs in `public.todo_audit`, not only in prose. **`public.hq_enforce()`
   is the pass that runs first and last in every sweep and every brief** — it repairs what
   needs no judgement and returns what does, and it must come back empty before a run ends.
   Two triggers back it: goals follow their steps, and steps stay one level deep (the
   database refuses a step of a step). Her standard: *"I don't want to keep checking your
   work."*
5. **Minimal but efficient.** No feature without a job. She cut tabs deliberately.
   Suggest something better if it exists; don't add surface area.
5b. **Change what she asked for and nothing else.** She asked for a line of copy to be
   reworded; the wording changed and then the element moved too. Stated plainly:
   *"if I ask you to change something, just the text, you tend to change the placement of
   it. Why don't you just change what is asked?"* A follow-up question is a question —
   answer it. "Why don't I see it?" is not authorisation to redesign. If a second change
   looks warranted, name it in one line and let her decide.
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
- **Never tell her to refresh until the deploy is verified.** Compare the bundle filename
  served by the live site against `dist/assets/*.js` from the local build. She was told a
  fix was live and then shown the bug again, because the deploy had not landed yet. The
  build passing is not the same as the fix being in front of her.
- Push to **both** branches: the working branch and
  `claude/amy-task-dashboard-deploy-16f9gc` (Vercel deploys from the repo's default
  branch; ~20s builds).
- **12 serverless functions is the ceiling** (Vercel Hobby). New API surface goes inside
  `api/hq/[resource].js`. Currently at 10 — the per-task comments and people-link endpoints
  went with the card cleanup.
- **Slack is swept from a roster, never a search.** `public.slack_sources` holds every DM
  and channel by ID; the sweep opens each one in **`detailed`** format (`concise` silently
  hides the `Thread: N replies` marker) and follows every thread. It records
  `threads_found` / `threads_read` / `sources_checked` in `sweep_state`, and `hq_enforce()`
  reports any gap. Nine threaded replies sat unread in the Gavin DM before this existed.
- **A sweep must prove it read every source.** `sweep_required_sources` names the five —
  Fireflies, Slack, Gmail, Calendar, notebook — and `hq_enforce()` refuses to come back
  clean until `sweep_state.sources_checked` accounts for all of them plus every active row
  of `slack_sources`. A run once read Slack, corrected what it found, and reported itself
  swept having touched nothing else. **Empty is a finding; skipped is a failure. They must
  never look alike.**
- **Reconcile before filing.** Every piece of evidence resolves to exactly one of three
  outcomes: update a task already on the board, file as a step of an existing goal, or file
  as new. Never a fourth. Reading a source is not reconciling it — her Vanta timestamp was
  wrong for two days because a sweep read *"Hi Gatik, this is done btw"* and never matched
  it to the card.
- **Her click is authoritative.** `completed_source = 'click'` is her testimony. Evidence
  may contradict it; evidence is never required to confirm it. Never ask her to re-verify
  something only she can see.
- **No field without evidence it is used.** The card carried eleven dead columns and eight
  empty tables into week two. Before adding one, say which measurement showed the gap;
  before keeping one, check it is populated. Measured, not assumed.
- Realtime is degraded until Amy fixes `SUPABASE_ANON_KEY` in Vercel (it holds a URL) —
  the app polls/refreshes fine; don't "fix" this in code.
- Reference code as `file:line`. Match the existing comment voice — comments explain
  *why*, in plain prose.

## Known live threads (check, don't assume)

**This section rots. Verify every line against the board before repeating it.** As of
2026-08-12: Gmail delegation is live and browser access works; codebase, Supabase and the
Lance tool were all provisioned by Isaac; the three separate access cards were one tool and
are deleted. What is actually open — Gavin owes the shape of a read API key so Claude can
reach his inbox, and Gavin owes an introduction to Gatik so Claude can reach the Lance
tool. Vanta security tasks are due **Aug 18** and the card is marked done by click, which
is testimony rather than evidence — worth one look before the deadline. Lance Live password
is still `testing`. Passphrases have been shared in Slack — flag exposure when relevant,
don't lecture.
