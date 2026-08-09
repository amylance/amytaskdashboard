# Sweep log

## Full rebuild — Sun Aug 9, 2026

Clean slate. Everything in `todos`, `inbox_items`, `activity_events`, `status_events`
and `pending_items` was deleted and rebuilt from the four sources. `people`,
`person_notes`, `profile_sections` and `disclosures` were left untouched — those were
built from verified meeting content and nothing in this sweep contradicts them.

Backup of the pre-sweep database: `docs/backups/db-snapshot-2026-08-09.json`.

### Window

Day 1 is **Wed Aug 5, 2026** — the first trace of `amy@lance.live` anywhere is the
onboarding call at 11:00 AM PT and the Slack signup that afternoon. Nothing before that.

### Sources swept

| Source | What was pulled | Kept |
|---|---|---|
| Fireflies | 50 transcripts, Jul 1 – Aug 9 | 3 meetings Amy was in, plus one Rippling call about her payroll |
| Gmail | 67 threads since Aug 1 | ~15 with real signal; the rest are product onboarding blasts and Vercel build noise |
| Google Calendar | Jul 20 – Aug 16 | Onboarding, both Isaac syncs, weekly Lance Townhall |
| Slack | Every message from Amy, plus the full Gavin and Isaac DMs | Both DM threads end to end |

### Timezone correction

Slack renders timestamps in Amy's local time (Philippines, PT+15) while labelling them
`CST`. Taking those at face value would have pushed roughly half the week's work forward
by a day — the Aug 9 Slack messages are really Aug 8 PT. Every timestamp was converted
from its true instant, and the day distribution was verified against Pacific afterwards:

| PT day | Done |
|---|---|
| Wed Aug 5 | 6 |
| Thu Aug 6 | 11 |
| Fri Aug 7 | 5 |
| Sat Aug 8 | 2 |
| Sun Aug 9 | 1 |

### What landed

**25 done** — only with hard evidence: a meeting that happened, a confirmation email, a
Slack message where someone said it was finished.

**17 pending in the Inbox** — nothing was auto-approved into the board. Everything open
waits for Amy's review.

### Judgement calls made during the sweep

- **Hyatt Centric on-site Wi-Fi diagnosis** — Fireflies filed this under Amy's name in the
  onboarding call, and Gavin's own action item names her alongside Vanita. But Amy is in
  the Philippines and the hotel is in the US. Filed as a **Verify** item rather than
  dropped or accepted, so she decides.
- **Gavin's inbox, not Isaac's** — the onboarding transcript says "review Isaac's email
  inbox". Amy's own Slack message to Gavin ("You mentioned giving me inbox access on the
  call") settles it. Recorded as Gavin's.
- **Fireflies EA access question** — asked Aug 5, never answered. Kept as an open item
  rather than assumed resolved.
- **KYC** — the Aug 7 Rippling email asking for employment-eligibility documents is closed,
  because Isaac confirmed approval on Aug 7 at 11:51 AM PT. The separate auto-payment
  toggle he sent minutes later is still open.
- **Vercel deploy-failure emails** were treated as noise, not tasks. They are build output
  from this dashboard's own development.

### Still unanswered by anyone

- Who administers the Google Workspace admin console (blocks Gmail delegation)
- Whether an EA needs Fireflies access to calls she is not on
- Isaac's end-of-week onboarding form has not been sent yet
