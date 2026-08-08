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

## Still open (need Amy)
1. After reviewing `meeting-action-items.md`: which items become live dashboard tasks?
2. Is the Fireflies per-item "edit before save" control worth building for v1?
3. Item 25 — connect lance.live/internal to Claude (Monday, with Isaac).
4. Verify: Gmail delegation to Gavin's inbox; Slack MFA.
