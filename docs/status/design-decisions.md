# Design Decisions — Running Log

Decisions reached in discussion with Amy, in order. This is the agreed spec for
when building starts. **Still discussion-first — nothing is built until Amy says go.**

## 2026-08-08

### Dashboard calendar
- Shows **two things only**: (1) meetings Amy was in, sourced from **Fireflies**;
  (2) **task deadlines** by due date.
- **Google Calendar is NOT surfaced** on the dashboard — it stays Amy's private
  scheduling tool. The dashboard calendar is a *record* ("meetings I was in +
  what's due"), not a forward look-ahead.

### People CRM ⇄ GM CRM boundary
- The personal **People awareness log** and Lance's product **GM CRM** stay
  **separate by default**.
- Add an **optional "Populate the GM CRM?" action** on the dashboard — a deliberate
  push Amy chooses, never automatic. Stays **inactive/greyed-out until access to
  lance.live/internal is decided** with Isaac (Monday, Item 25). If access never
  happens, it simply never activates.

### New feature — per-page "Pending" corner note
- Every tab/page gets a small, **collapsible/minimizable note in the lower-right
  corner**.
- It holds **dashboard items waiting on something external**: pending approval, an
  access grant, or a conversation with Isaac. A task list *about the dashboard itself*.
- Example: the "Populate GM CRM?" button's *why* ("waiting on Isaac/access — Mon")
  lives in this note on the People page, next to the greyed-out button.
- Label TBD (Amy: "label it the way you want, clean and nice"). Candidates:
  "Pending", "On Hold", "Waiting On".

### Fireflies → dashboard task inbox (resolves Item 9)
- **Dashboard is the single source of truth for "done."** Amy never ticks action
  items off inside Fireflies.
- Incoming items are **categorized by source**, not dumped together: a list *from
  Fireflies*, a list *from Slack*, *from Google*, *from Lance Live*, etc.
- Fireflies action items **auto-populate a review queue**. Per item, Amy gets:
  - **Save as task** — she **edits/customizes** the wording first (Fireflies' version
    may be wrong), then it becomes a real dashboard task.
  - **Delete / mark unnecessary.**
- Open question Amy is still weighing: whether the per-item "edit before save" control
  is worth building — she wants to review the real extracted task lists first
  (see `meeting-action-items.md`).

### Task provenance — the Fireflies → Claude → Amy verification stack
Every task carries a **three-layer, all-visible provenance stack** (the same
verified/unverified discipline as the People tiers in Item 20, applied to tasks):

1. **Source layer (automated).** The raw item exactly as the source generated it,
   verbatim, with a source icon (Fireflies / Slack / Google / Lance Live). Kept
   because it's the automated record — never silently overwritten.
2. **Claude verification layer.** A visible comment from Claude assessing the source
   item's accuracy against the transcript/context — e.g. *"Fireflies attributed this
   to you; the transcript shows it was Vanita's."* Claude's reasoning is shown, not
   hidden. This is the second layer of verification.
3. **Amy decision layer.** With both layers in view, Amy acts: **accept (✓)**,
   **edit & save** as her own task, or **mark unnecessary (✗)**.

Example card:
> 🎙️ Fireflies: "Go onsite to Hyatt Centric to diagnose WiFi" (00:16:54)
> 🤖 Claude: Fireflies attributed this to you — transcript shows it was Vanita's, Tyler briefing. Likely not yours.
> [ ✓ accept ] [ ✎ edit & save ] [ ✗ mark unnecessary ]

Proven doable: Claude already caught the Hyatt Centric mis-attribution by reading the
transcript. The workflow is: source auto-generates → Claude cross-checks & annotates
→ Amy decides.

### Task / activity list display
- **Newest at the top**, oldest at the bottom — Amy never scrolls down to find today.
- **Include everything Fireflies generates** from her meetings, and **keep done items
  visible as history** (not hidden) — so Amy can check them for accuracy, since
  Fireflies' auto-generated wording is often wrong.
- Lists are **categorized by source** (Fireflies / Slack / Google / Lance Live).

### Feature — "Why this exists" explainer layer (for future hires / successors)
- Motivation: future EAs/hires may not share Amy's systems-mindset. If they open her
  dashboard, a clickable explainer answers *"why Amy built this / why this feature
  works this way"* so they can self-serve before having to ask her.
- Each feature/page carries an optional info affordance (ⓘ / "Why this exists") that
  opens the rationale in-context.
- **Content source = the docs we're already writing** — `design-decisions.md` and
  `thinking-process-log.md`. The dashboard surfaces that reasoning; it doesn't need
  new content authored separately.
- Ties to: Item 18 (headquarters helping a future VA understand how Amy works —
  attributed to Isaac in Amy's notes) and Item 11 (public/private memory tab). Makes
  the dashboard self-documenting and a legacy for whoever comes next.

### Editing a Fireflies task — where the edit goes
- **Never overwrite the Fireflies original; never write back to Fireflies** (separate
  system; the dashboard is the source of truth). The raw Fireflies item is frozen
  layer-1 history.
- **Edit → creates a new "live" task = Amy's customized version**, tagged "edited from
  Fireflies," linked to the original. The active list shows Amy's version; the original
  + Claude's verification note sit one click away in the provenance stack.
- **Accept (✓)** = Fireflies text becomes a task unchanged, still linked to source.
- **Mark unnecessary (✗)** = dismissed but kept as history (not hard-deleted).

### The morning-briefing skill — kept, schedule dropped, output to dashboard
Isaac built a morning-briefing **skill** with Amy (skill-creator, saved as .md;
sweeps all connectors + dashboard; output = top-3 / focus for the day / what to do
now / open threads / blind spots; originally scheduled 3am PT). He also built it to
run on-demand ("use your morning brief skill to give me an update").
- **KEEP the skill** — it's the engine (present here as `/brief` and `/morning`).
  Isaac's work is not discarded.
- **DROP only the schedule** — the automatic 3am PT timer. (No scheduled jobs exist
  in this build environment; any schedule set in Amy's personal Claude account is a
  one-click removal there.)
- **ADD** — the brief's output lands **on the dashboard** with a "last updated"
  timestamp (Item 14), triggered on-demand when Amy asks.

### Standing value — always acknowledge who helped (NEW standing rule)
Amy always acknowledges the people who helped, inspired, or encouraged her. Never
"I did this / I thought of this" — always the acknowledgement. Concretely: the
"Why this exists" explainers, dashboard copy, and docs must credit that **Isaac
provided the structure and Amy modified it**, and name others who helped wherever
relevant. This is a standing rule (see tracker Rule 26), in force everywhere.

### Away / status toggle — general, with dog-walk preset
- A **general** away/status toggle (purpose: transparency into Amy's pattern), NOT
  dog-specific.
- One-tap presets: **"Walking the dogs"** (signature), Away, Heads-down/Focus,
  "back at ~time", plus free text.
- **Logs each away period** so it accumulates into a living record of Amy's rhythm —
  Gavin/Isaac learn her pattern without her re-explaining (ties to New Hire form
  disclosure and Item 13).

### Proposed Version 1 scope (PENDING Amy's go-ahead)
Foundation first (mostly invisible, but everything depends on it):
1. **Schema + migration reconcile.** Rebuild the DB properly and capture it as a repo
   migration so code and DB never drift again (the gap that caused the earlier
   revert): people with verified/unverified tiers + source links + crm_type; person
   encounter notes (source, occurred_at, activity_type); tasks with source +
   provenance fields (raw source text, Claude verification note, edited-from link,
   status). *Writes to the live Supabase project — get explicit go before applying.*

Visible v1 (recommended lean slice):
2. **HQ header:** live Philippines + San Francisco clocks + the away/status toggle.
3. **People awareness log:** verified/unverified with source links, encounter entries,
   greyed "Populate GM CRM?" button + the "Pending" corner note.

Right after v1 (v1.1+):
4. Task provenance + Fireflies inbox (source→Claude→Amy stack, categorized, newest-first).
5. Calendar overlay (Fireflies meetings + task deadlines).
6. Profile/memory tab + "Why this exists" explainer (crediting Isaac) + public/private toggle.
7. Daily brief landing + "last updated" timestamp.
8. Gavin/Isaac view toggles.

## Still open (need Amy)
1. After reviewing `meeting-action-items.md`: which items become live dashboard tasks?
2. Is the Fireflies per-item "edit before save" control worth building for v1?
3. Item 25 — connect lance.live/internal to Claude (Monday, with Isaac).
4. Verify: Gmail delegation to Gavin's inbox; Slack MFA.

---

## Aug 9, 2026 — Scheduled briefing deleted, on-demand confirmed

Amy uploaded her `sweep` and `brief` skills to her Claude account and, in doing so,
replaced an earlier `brief` she had built from Isaac's prompt on Aug 7. Isaac's original
prompt is preserved verbatim at `docs/source/isaac-brief-prompt.md`, so nothing is lost.
She chose not to restore the old skill: the new one supersedes it by capturing before it
reads.

Two problems surfaced in her Claude account, both now resolved:

1. **A scheduled task ("Weekday morning brief", weekdays 3:00 AM) invoked `brief` by
   name**, while declaring the run strictly read-only. Phase 1 of `brief` writes to
   `inbox_items`, so the two instructions contradicted each other and an unattended run
   would have resolved that ambiguity unpredictably.

2. **The schedule was losing a working day.** 3:00 AM Manila is noon Pacific *the
   previous day*. Against Manila weekdays that put a briefing on Pacific Sunday and none
   on Pacific Friday.

**Decision: the scheduled task is deleted. Briefings stay on-demand, permanently.** This
is the same rule already recorded for `sweep`, applied consistently — Amy's cadence is
irregular by design and a fixed trigger cannot match it.

`brief` still carries an unattended-run guard (skip Phase 1, stay read-only, leave
`sweep_state` untouched). That path is now dormant. It stays in the skill as insurance in
case a schedule is ever created again, by her or by anyone helping her.

**Also decided:** Anthropic's built-in `morning` skill is turned off. It overlaps `brief`
on the phrase "morning brief", and two skills competing for the same words is what made
this confusing in the first place. `skill-creator` stays — it is the tool that builds
skills, and it only fires when explicitly asked.

---

## Aug 9, 2026 — Meeting wrap-ups on the calendar

Amy's ask, verbatim: *"when a meeting is done to the period of calendar and when you click
it, it should show a checklist of things that was discussed."* Built.

**Schema fix first.** `meeting_items` had `todo_id NOT NULL`, so every checklist line had to
be a task. Most of what gets discussed in a meeting is not a task, which made the table
unusable for its stated purpose. `todo_id` is now nullable, a free-text `label` was added,
and a check constraint requires each line to carry one or the other. Ordering comes from a
new `sort_order`.

**Seeded** from the three Fireflies meetings Amy actually attended (onboarding, and both
Isaac syncs) plus the two upcoming Townhalls pulled from Google Calendar. Checklist content
comes from the transcript summaries, not invented.

**Served from the existing `/api/hq/calendar` route** rather than a new endpoint — the
project sits at Vercel's 12-function ceiling, and one fetch serving both events and meetings
is fewer round trips anyway.

Past meetings render solid, upcoming ones muted and italic, so the calendar never implies
something has happened when it has not.

### Gap this surfaced

Amy's Google Calendar contains **nothing but the weekly Townhall**. The Monday sync with
Gavin — where codebase access and Gmail delegation both get resolved — exists only as an
intention in a Slack message. It is not on anyone's calendar, so nothing will remind either
of them. Worth booking rather than trusting to memory.

---

## Aug 9, 2026 — Recovery: undo everywhere, no Trash tab

Amy asked where deleted and dismissed things should go so a mistake is reversible, and
which placement is easiest to navigate psychologically.

**Rejected: a Trash tab.** It fails on recognition — you have to remember it exists, and you
only think of it while already panicking. It also costs a permanent slot in navigation for a
room entered twice a year, right after Amy deliberately cut the tab count.

**Built instead, two layers:**

1. **Undo toast, every view.** Any delete or dismiss raises a bar at the bottom of the
   screen — the action, and an Undo button — for ten seconds, with a draining progress bar
   so "time left" reads without a number. The moment of highest anxiety is the two seconds
   after the click; that is where the affordance belongs.

2. **A contextual strip where the loss happened.** A quiet line — `2 tasks removed ›` —
   at the bottom of the view. It renders **only when there is something to recover**, so the
   empty state costs nothing. That property is the whole reason it is not a tab.

| View | Strip |
|---|---|
| Inbox | dismissed items |
| Kanban / List / Timeline | deleted tasks |
| Calendar | deleted entries **scoped to the open day** — a task you deleted vanished from a specific date, and that date is where you will look for it |
| People | removed people |
| Profile | none — the disclosure ledger is deliberate, not triage |

**The real argument is speed, not recovery.** Knowing undo exists is what lets Amy clear a
17-item inbox in one sitting instead of second-guessing each call. Most of the value is
spent before the feature is ever used, which is why the undo is visible rather than tucked
away.

**Schema work this required.** `activity_events` and `meetings` had no `deleted_at`, so any
delete button added later would have been permanent. Both are now soft-deletable and read
paths filter to live rows. Every table Amy can delete from is now recoverable.

**No auto-purge.** Volume is tiny and Amy values the record.

Served from `/api/hq/recover` inside the existing consolidated route — the project sits at
Vercel's 12-function ceiling and a new endpoint would have broken the deploy.

*Precedent: Amy trimmed the People list during onboarding and lost Maanya Kashyap with it,
catching the mistake days later only because she heard the name on a call with Gavin. That
is the failure mode this closes.*
