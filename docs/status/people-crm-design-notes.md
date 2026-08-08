# People CRM — Design Notes (from discussion, not yet built)

Captured from Amy's answers during discussion on 2026-08-08. This is discussion
capture for when we design the People view — **nothing here is built yet.**

## The model: People = an awareness/encounter log, not a roster

The Rippling org chart and lance.live/internal screenshots are **reference material
for verification only** — they are *not* displayed as a roster on the dashboard.
The People view is the **timeline log of who crossed Amy's awareness**, when, and where.

## Confirmed design rules

1. **Inclusion rule — yes.** Log everyone who crosses her awareness, including interns
   and the ones who have left. If a name left a mark, it gets recorded.
2. **Meeting-only (Fireflies) — yes.** Only meetings Amy is *actually in* trigger a log
   entry — not meetings she was merely tagged on or has visibility into.
3. **Log granularity / provenance.** Each entry records the name and where it came from,
   with a **clickable link** that leads to the actual source (Slack thread, email) so Amy
   can see it in context and reply herself.
4. **"Crossed my awareness" entries.** When a name appears in any channel (e.g.
   #announcements, or any of the many channels), the entry should capture: **why the name
   showed up, what they said, and where it came from** — with the clickable button to jump
   to and verify the source.
5. **Verification by cross-reference.** Moving unverified → verified means cross-referencing
   against the reference sources: "according to lance.live / according to Rippling / according
   to what Gavin said, she is from here." The verification carries its citation.

## Ties back to
- Item 20 (verified/unverified tiers with a link to the source) — reputational safeguard.
- Item 22 (ongoing logging from meetings, Slack, email) — final model is on-demand.
- Standing rule: unverified is the default; nothing auto-promotes to verified.
