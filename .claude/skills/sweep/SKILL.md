---
name: sweep
description: Sweep Amy's tools (Fireflies, Slack, Gmail) for new commitments since the last sweep, verify each against the record, and file them into the dashboard Inbox for her to approve, edit, or dismiss. Use when Amy says "sweep", "catch me up", "what did I miss", "brief me", or asks what's landed since she last looked. On-demand only — never scheduled. Version 2026-08-12a.
---

# Sweep

Pull everything that crossed Amy's plate since the last sweep, filter it down to real
commitments, verify each one, and file it into the dashboard Inbox. She reviews; nothing
becomes a task without her.

**Amy Pacaldo** — EA to Gavin Brennen (COO) at **Lance** (always L-A-N-C-E).
Supabase project `liwmuwkcsurfgjugdvfm`.

## 1. Find the window

```sql
select last_swept_at from public.sweep_state where id = true;
```

Sweep from that timestamp to now. If it's null, use the last 24 hours.

## 2. Pull from each source — in this order, it matters

Amy's day opens with a cadence meeting that hands her the asks; everything after is
execution and confirmation. Sweep in that order so the later sources can settle the first.

**Her ruling on which source wins a timestamp dispute:** *"the most reliable source of
timestamps is my slack, and my log activities within claude home."* When two sources
disagree about when something happened, Slack and the notebook are right — and Slack times
must be converted from the epoch, never from the displayed string.

**No source owns a single role.** Do not read Fireflies as "the asks" and Slack as "the
finishes":

- **A DM is an ask.** Isaac and Gavin hand her work in Slack constantly — MFA on Google,
  the Rippling toggle, the Hilton support link. Treat a DM asking for something exactly as
  you would a meeting action item.
- **A transcript carries status, not just new work.** The meeting is where she and Gavin
  say out loud what is done, what is stuck and what she has started. Read every transcript
  for the state of tasks *already on the board*, not only for items to file. A commitment
  she reports finished on a call is evidence of a finish, with the transcript timestamp as
  the instant.

1. **Fireflies first** — `fireflies_get_transcripts` with
   `participants: ["amy@lance.live"]`, `fromDate`. **Only meetings she attended.** Her
   action items are the day's asks. Hold as candidates; do not file yet.
2. **Slack** — DMs, threads, @-mentions since the window. Her ID is `U0BMZ75ANDT`.
   **This is where she says a thing is finished**, and where a task gets pivoted.
3. **Notebook** — **not windowed.** Read every entry not yet acted on:

   ```sql
   select * from public.notebook where processed_at is null order by created_at;
   ```

   A note she wrote days ago is no less unread than one from an hour ago, and the
   watermark once cut seven minutes after she logged her most valuable procedure. Her
   Home sessions are where the work actually happened; entries carry her process and
   often settle or redirect a task the tools only hint at. Evidence and method, not new
   commitments — never turn a note into a task by itself.

   Stamp what you use: `update notebook set processed_at = now(), outcome = '<one line>'`
   for any entry that changed a filing decision or fed a story. Leave the rest unstamped
   — a Code session will handle them.
4. **Gmail** — `in:sent` plus anything awaiting a reply.

Then **cross-reference every candidate from step 1 against steps 2–4 before filing.** A
task asked and finished the same day must arrive already marked done — never as an open
to-do she has to remember she already did.

## 3. Filter — this is what keeps the noise out

An item reaches the Inbox **only if it is a commitment**:
- Someone asked Amy to do something, **or**
- Amy said she would do something.

**One deliberate exception — announcements that may involve Amy.** If an announcement in
a channel she's in could plausibly require something *from her* (she's named, her team is
named, or it changes something she owns), file it with a `claude_note` saying why it might
be hers and that it needs verifying. She'd rather see it and dismiss it than miss it. If
an announcement clearly has nothing to do with her, leave it out.

**Everything else stays in its tool.** General FYIs, chatter, things assigned to other
people, notifications — these do NOT belong on the dashboard. Slack is already live; the
dashboard is not a second feed. When in doubt about a non-announcement, leave it out.

## 4. Verify each item (the Claude layer)

For every candidate, check it against the record before filing:

- **Is it actually hers?** Fireflies frequently mis-attributes. (It once assigned Amy
  "go onsite to Hyatt Centric" when the transcript shows Gavin gave that to Vanita.)
  If it's not hers → still file it, with a `claude_note` recommending dismissal.
- **Is it already done?** Search later Slack/email for natural completion language —
  "2FA both active now", "here's the link", "it looks like it's done", "sent it".
  **Do not keyword-match on the word "done".** If complete → `suggested_status: 'done'`
  and say so in the note, with the quote as evidence.
- **Is the wording right?** Fireflies is often garbled. Put a clean version in `title`
  and keep the original verbatim in `source_raw`.
- **The ask is not the finish.** A task's `received_at` is when someone handed it over;
  `completed_at` is when the work ended. Collapsing them is the single most common error in
  this record — it once marked Isaac's unanswered Fireflies question "done" at the moment
  Amy asked it, and marked Gmail delegation done four days before it worked. Only a title
  that *is* the act ("Ask Gavin…", "Send Gavin…") legitimately finishes on arrival.
- **Is the timestamp the real instant?** Slack's API renders times in Amy's *local*
  timezone while labelling them `CST`. Taking that at face value pushes work forward a
  day — an "Aug 9" Slack message is usually Aug 8 Pacific. Always convert from the epoch
  in `message_ts`, never from the displayed string. Gmail and Fireflies both return true
  UTC and need no correction.

## 4b. Meetings — file them, and mark her 1:1s

A meeting Amy attended belongs in `public.meetings` with its discussion points in
`meeting_items`. Without this the Calendar shows a day where work appeared with no cause.

- **`is_one_on_one = true`** when it is her and exactly one other person. Her 1:1s are the
  spine of her week — they hand her the work — and the Calendar highlights them so she can
  find them at a glance. Group calls and all-hands stay false; a mark every meeting carries
  is a mark that says nothing.
- **Title 1:1s as `Sync — Amy & <first name>`** so the series reads as a series. Everything
  else keeps its real name.
- `with_whom` is the other person's full name for a 1:1, or a short description for a group.

## 4c. Write the story — this is the record

Every filed item carries a `story`: the whole history in markdown, succinct. The card
stays short; the story is what she sees when she clicks in. Bullets, never paragraphs.

```
**From** · Gavin — Monday sync, Aug 10 11:15 AM PT
**Asked** · Cheapest flight to DC, matched to Caleb's itinerary

**What happened**
• Searched, shortlisted, pre-filled the booking
• Blocked — no way to book without his login; he confirmed in-app himself
• Booked **LE6HZR**, SFO→IAD, Wed Aug 12 8:10 AM

⚠ **Changed** · *"I'll send you the details for the flight that Caleb…"* — Caleb flies
into **DCA**, Gavin is booked into **IAD**. Flagged, **not resolved**.

**Open** · Confirm IAD vs DCA with Gavin
**Related** · Fix the flight-booking workflow — notebook, Aug 10
```

Rules for the story:
- **Titles are short and plain.** "Book Gavin's flight to DC" — not the sentence someone
  said, not the meeting's phrasing. The detail carries the nuance; the title carries none.
- **Verbatim only at a pivot.** Quote someone — her included — only where their words
  *changed* the task or created the caveat. One quote per story is usually right; zero is
  common and fine. Never quote to prove you read the source.
- **`⚠` marks an unresolved consequence**, and nothing else. It renders as a callout.
- **Compress ruthlessly.** Each bullet is one clause. No narration of the search, no
  restating the title, no "as discussed".
- **Related** lists notebook entries that belong to this task, by title and date.
- A trivial task needs no story at all. Do not manufacture history.

`claude_note` stays a one-line verdict for the card ("already done", "looks
mis-attributed"). If the note would run past a line, it belongs in the story instead.

## 4d. Verify finished-times on done tasks

Amy's timestamp protocol: `completed_at` is when the work actually finished, per best
evidence; `completed_source` says which evidence ('click', 'evidence', 'manual'). A
'click' stamp is provisional testimony — she often batch-updates the dashboard hours
after the work, and her 15-hour offset makes crossing the Pacific midnight routine.

For each done task with `completed_source = 'click'`, check the swept window for
completion evidence (the Slack message announcing it, the email that shipped it).
**File a correction only when the evidence disagrees with the click on which Pacific
day the work happened.** Same PT day → the click stands, silently. No evidence at
all → the click stands, silently; absence is not a finding, and flags she learns to
ignore are worse than none.

A correction is an inbox item with `kind: 'correction'`, `target_todo_id`,
`proposed_completed_at` (the evidenced instant, UTC), the evidence quoted verbatim in
`source_raw`, and a `claude_note` naming both days plainly: "Your Slack message landed
Fri 4:12 PM PT; your click stamped Sat. The Calendar currently shows Saturday." Never
update the todo directly — she arbitrates from the Inbox, where the card offers
"Move to <day>" and "Keep as is". Both answers are legitimate.

## 4e. Refresh the cards already waiting — they go stale

A card sitting pending in the Inbox is **not finished business**. Amy may not review it for
a day, and the work keeps moving in Slack while it waits. Filing it once and never looking
again produced a card whose story stopped at *"you said soon"* hours after she had actually
delivered the thing.

So on every sweep, after step 2 and before filing anything new:

```sql
select id, title, source_context, suggested_status, received_at, story
from public.inbox_items where state = 'pending' order by received_at;
```

For each one, check the window you just pulled for anything that moved it. If something
did, **update that card in place** — extend the `story`, correct `suggested_status`, refresh
`claude_note`. Do not file a second card for the same thing. Say in the report which pending
cards you refreshed, so she knows the queue was re-read and not just appended to.

Do the same for **open tasks already on the board** — a transcript or DM in the window may
report one of them finished, started or blocked. Those become `kind='correction'` cards, not
direct edits.

The same applies to the `Open` line of any story: if it names something that has since
happened, it is no longer open and must not still say so.

## 4f. Every "done" card needs the instant it finished

A card filed with `suggested_status: 'done'` must also carry **`proposed_completed_at`** —
the UTC instant the evidence shows the work finished. Approval writes this straight through
to `todos.completed_at`, and the Kanban Done column ranks on that value alone.

Without it, approval falls back to `received_at`, which on a Fireflies card is when the task
was **assigned**. That stamps the work as finished at the moment it was handed to her, sorts
it above things genuinely finished later, and puts it on the wrong day of her Calendar.

Name the evidence in the story. "Delivered 3:38 PM PT" is a finish; "he asked at 10:17 AM"
is not.

## 4g. Run the audit before you finish — every time

```sql
select * from public.todo_audit order by issue, title;
```

`todo_audit` is a view over `todos` holding every class of error found in the Aug 11
full audit: a finish time before the arrival time, a finish stamped at the exact instant
someone asked, a done task with no finish time or no `completed_source`, a blocked task
with no `waiting_since`, a task with no contact, a task with no story.

**A clean run returns nothing.** Resolve every row, or say in the report why a row is
correct as it stands. Never leave rows in it silently — the whole point is that Amy is not
the one who notices. She said so plainly: *"I dont want to keep checking your work every
sweep."*

If a row is genuinely unknowable — the evidence does not exist in any tool — leave
`completed_source` null, say so in the story, and name it in the report as a one-line
question for her. An honest gap is fine. False precision is not.

## 4h. Also propose disclosures (memory)

Alongside commitments, capture **what Amy gave the Lance network** — her stated purpose
for the Profile tab: *"what I've poured in, what I've given Claude, the tools, my emails."*

Only **factual, verifiable disclosure events**. Examples:
- "Shared dashboard link + passphrase with Gavin and Isaac"
- "Submitted BIR TIN ID to Rippling"
- "Granted Claude access to Slack, Gmail, Fireflies, Supabase"

File these with `"kind": "memory"` and a `to_whom`. They land in the same Inbox and,
when Amy approves, become entries in her **disclosure ledger** (Profile tab).

**Never propose reflective content** — how she works, her voice, her background, her
rhythm. That section is hers to write. Inferring personality from messages is exactly
the kind of guess that pollutes a record she has to trust.

## 5. File them

POST to `/api/hq/inbox` with `action: "create"` (dedupes on source + source_raw):

```json
{
  "action": "create",
  "summary": "Swept Fireflies + Slack + Gmail since <window>.",
  "items": [
    {
      "title": "Clean, actionable wording",
      "source": "fireflies|slack|email",
      "source_raw": "exactly what the source said",
      "source_url": "https://app.fireflies.ai/view/<id>",
      "source_context": "Sync II, Aug 6",
      "claude_note": "One-line verdict for the card",
      "story": "**From** · …\n**Asked** · …\n\n**What happened**\n• …",
      "suggested_status": "todo|done",
      "received_at": "2026-08-06T23:23:33Z",
      "proposed_completed_at": "2026-08-06T23:41:02Z"
    }
  ]
}
```

Or write directly to `public.inbox_items` via Supabase if the API isn't reachable.
`received_at` must be the **absolute instant** it landed (UTC) — the dashboard renders
everything in Pacific.

## 6. Move the watermark — with the real clock

```sql
update public.sweep_state set last_swept_at = <the moment the sweep finished> where id = true;
```

**Read the actual current time before writing this. Never guess it, never round it up, and
never reuse a timestamp written earlier in the run.** The watermark is the floor of the next
sweep, so a value even slightly in the future creates a blind window that nothing will ever
look at again — items that land in it are lost silently, with no error and no gap in the UI.

If in doubt, set it *earlier* than the true finish time. Re-seeing a few items is free; the
`create` call dedupes on source + source_raw. Missing them is not recoverable.

Skip this step entirely on an unattended run — see the `brief` skill.

## 7. Report back

Tell Amy in plain prose: how many items filed, which are already-done, which look
mis-attributed, and anything genuinely urgent. Then stop — she decides from the dashboard.

## Rules

- **On-demand only.** Never schedule this. Amy's sleep is irregular by design.
- **Never auto-create tasks.** Everything lands in the Inbox as pending.
- **People:** if a new person crossed her awareness, add them to `people` as
  **unverified** with a specific `verification_source`, plus a `person_notes` entry
  (why they showed up, what was said, source link). Nothing auto-promotes to verified.
- **Timestamps** are absolute instants; **plain dates** (due dates) never shift timezone.
- Match on name/email before inserting a person — no duplicates.
