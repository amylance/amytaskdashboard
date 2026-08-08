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

## Still open (need Amy)
1. After reviewing `meeting-action-items.md`: which items become live dashboard tasks?
2. Is the Fireflies per-item "edit before save" control worth building for v1?
3. Item 25 — connect lance.live/internal to Claude (Monday, with Isaac).
4. Verify: Gmail delegation to Gavin's inbox; Slack MFA.
