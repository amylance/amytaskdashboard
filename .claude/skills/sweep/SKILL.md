---
name: sweep
description: Sweep Amy's tools (Fireflies, Slack, Gmail) for new commitments since the last sweep, verify each against the record, and file them into the dashboard Inbox for her to approve, edit, or dismiss. Use when Amy says "sweep", "catch me up", "what did I miss", "brief me", or asks what's landed since she last looked. On-demand only — never scheduled. Version 2026-08-11a.
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

1. **Fireflies first** — `fireflies_get_transcripts` with
   `participants: ["amy@lance.live"]`, `fromDate`. **Only meetings she attended.** Her
   action items are the day's asks. Hold as candidates; do not file yet.
2. **Slack** — DMs, threads, @-mentions since the window. Her ID is `U0BMZ75ANDT`.
   **This is where she says a thing is finished**, and where a task gets pivoted.
3. **Notebook** — `select * from public.notebook order by created_at`. Her Home sessions
   are where the work actually happened; entries carry her process and often settle or
   redirect a task the tools only hint at. Evidence and method, not new commitments.
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
- **Is the timestamp the real instant?** Slack's API renders times in Amy's *local*
  timezone while labelling them `CST`. Taking that at face value pushes work forward a
  day — an "Aug 9" Slack message is usually Aug 8 Pacific. Always convert from the epoch
  in `message_ts`, never from the displayed string. Gmail and Fireflies both return true
  UTC and need no correction.

## 4b. Write the story — this is the record

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

## 4b. Verify finished-times on done tasks

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

## 4c. Also propose disclosures (memory)

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
      "claude_note": "Verification finding — already done / mis-attributed / open",
      "suggested_status": "todo|done",
      "received_at": "2026-08-06T23:23:33Z"
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
