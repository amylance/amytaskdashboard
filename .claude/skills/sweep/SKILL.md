---
name: sweep
description: Update Amy's dashboard and catch her up. Enforces the rules, sweeps every rostered Slack conversation including threaded replies, plus Fireflies, Gmail, Calendar and her notebook, reconciles all of it against the board, and files only genuinely new work to her Inbox. Use for "brief", "debrief", "sweep", "catch me up", "what did I miss", "what needs me", "update my dashboard", "I'm done for the day" — all the same command. On-demand only, never scheduled. Version 2026-08-12j.
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

**A search that returns nothing proves nothing.** It tells you about your query, not about
the world. Never conclude a message does not exist because a keyword search missed it —
open the DM or channel and read it. Never write a quote unless it appears verbatim in text
you actually retrieved this run. This has already produced a wrong card: a search for
*"let's do this"* came back empty and was written up as a fabricated quote, when the real
phrase was *"lets do it"* from the other speaker, present in the thread all along.

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

### Slack — walk the roster, never a search

```sql
select id, label, kind, why from public.slack_sources where active order by kind, label;
```

**Open every row by ID.** Search is not a substitute and never proof: a search for
`from:@Amy` across her channels returned zero results while she had messages in all of
them, and a search for the wrong phrase was written up as a fabricated quote. Search may
find things; it can never show that something is absent.

Two rules that cost her a whole evening:

- **Always `response_format: 'detailed'`.** `concise` silently omits the `Thread: N replies`
  marker, so threads become invisible rather than merely unread.
- **Follow every thread marker** with `slack_read_thread`. Nine replies in the Gavin DM
  alone had never been read — including Gavin settling who owes the API key.

Count as you go and write the result down:

```sql
update public.sweep_state
   set threads_found = <n>, threads_read = <n>,
       sources_checked = '["D0BN411RCCV","C0AQXA7K1MZ", ...]'::jsonb
 where id = true;
```

`hq_enforce()` reports any gap between found and read, so an unread thread surfaces at the
top of her next brief instead of disappearing.

### Then the rest

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

## 4b-synth. Reconcile against the board BEFORE filing anything

Amy's ruling, and the gap that produced a wrong Vanta timestamp for two days: the sweep read
her Slack message *"Hi Gatik, this is done btw"* and never matched it to the Vanta card
sitting in the dashboard. Reading a source is not the same as reconciling it.

**Load the whole board first**, goals and steps:

```sql
select id, title, status, parent_id, is_method, received_at, completed_at,
       completed_source, waiting_on, contact, left(story, 400) as story
from public.todos where deleted_at is null order by parent_id nulls first, received_at;
```

Then every piece of evidence resolves to **exactly one of three outcomes**:

1. **It is about a task already on the board** → **update that task.** Correct the timestamp,
   the status, the blocked-on, add a line to the story. **No Inbox card.** Work already
   tracked never arrives twice.
2. **It belongs under an existing goal** → file an Inbox candidate with `parent_todo_id` set.
   She approves and it lands as a step of that goal.
3. **It is neither** → file an Inbox candidate as a new task.

Never a fourth outcome. If you cannot tell which of the three, it is (3) and the
`claude_note` says why you were unsure.

**Every card gets checked, parent and step alike** — against Fireflies, every rostered Slack
source and its threads, Gmail, Calendar, Linear and the notebook. A card nobody has touched
in the window is still verified; silence is not confirmation.

## 4c-pre. Is it a step of something already on the board?

Most of what lands is not a new commitment — it is the next move on work that already
exists. Amy's ruling: *"All these related tasks only lead to one task."* Getting access to
Gavin's inbox is one goal; asking Google support, chasing Gavin, confirming the delegation
are steps of it. Six loose cards for one goal is the duplicate problem at a larger scale.

**Before filing anything, check whether it belongs under a live task.**

```sql
select id, title, status from public.todos
where deleted_at is null and status <> 'done' and parent_id is null;
```

If it does, set `parent_todo_id` on the Inbox item. Approving then lands it under that goal
instead of dropping another card on the Kanban.

- A step is still filed to the **Inbox first**. Attaching to a goal is not approval.
- **One level only.** A step that needs its own steps means the goal was named too broadly
  — file it as its own goal instead.
- **Never invent the goal.** If no live task fits, file it flat. A goal is created when Amy
  approves one, not because a sweep guessed a theme.
- **A goal never closes itself.** Ticking the last step only unlocks a confirmation; Amy's
  click finishes it. A sweep must never set a goal to done — tick the steps the evidence
  supports and leave the goal for her. Only the reopen direction is automatic, so a goal
  can never sit in Done above live work.

## 4c-name. Naming — verb first, and grammatical

- **Start with a verb, then the object.** "Get access to Gavin's inbox." "Ask Google tech."
- **Active voice. 2–5 words is the target, not a cap** — grammar wins over brevity. Never
  drop a possessive to save a word: *"Get Gavin inbox access"* is a noun pile and wrong;
  *"Get access to Gavin's inbox"* is right.
- **Hard ceiling: 32 characters.** Past that the title truncates inside the step list on a
  goal card, which is exactly where Amy reads it. `todo_audit` fails any title over 32 and
  any title that does not open with a verb, so this is checked every sweep rather than left
  to notice. Writing the rule down was not enough — she had to catch a long title twice.
- **No detail in the title.** Names, dates, ticket numbers, the reason — all of that is the
  story's job.
- **A goal states what done means** in its story, so a step can never be ticked ambiguously.

## 4c-dates. Due dates come from sources, never from judgement

Set `due_date` **only when a source actually named a date** — a meeting, a Slack message, an
email, or Amy's notebook. Quote it in the story when you do.

If nobody named one, leave it null. An undated task is not an omission to correct, and a
guessed deadline is a fact the dashboard did not earn. The Timeline shows dated work only,
so an invented date puts phantom pressure on her week.

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
- **Depth follows `is_method`.** Amy's ruling: only the work that will become a repeatable
  system earns a full history — the weekly hotel write-up, processing Gavin's inbox. Set
  `is_method = true` on those and keep every pivot, every changed instruction, every
  verbatim that moved the work. Everything else — "talk to the tech", "request this",
  "upload your picture" — gets one or two bullets and nothing more. A paper trail on
  routine work is noise she has to read past to reach the history that matters.

`claude_note` stays a one-line verdict for the card ("already done", "looks
mis-attributed"). If the note would run past a line, it belongs in the story instead.

## 4c-click. Her click is authoritative

`completed_source = 'click'` is her testimony and it stands. Evidence can **contradict** it —
a Slack message showing the work landed earlier moves the timestamp, per 4d — but evidence
is never *required* to confirm it. Absence of evidence changes nothing and is never raised.

This one cost her real patience: the Vanta card was flagged as an unverified blind spot
three times over work she had clicked done and told Gatik about. Never ask her to re-confirm
something only she can see.

## 4d. Correct finished-times in place — no card

Amy's timestamp protocol: `completed_at` is when the work actually finished, per best
evidence; `completed_source` says which ('click', 'evidence', 'manual'). A 'click' stamp is
provisional testimony — she often updates the dashboard hours after the work, and her
15-hour offset makes crossing the Pacific midnight routine.

For each done task with `completed_source = 'click'`, check the window for completion
evidence (the Slack message announcing it, the email that shipped it, the transcript where
she says it is finished). When the evidence disagrees with the click, **update the task
directly**:

```sql
update public.todos
set completed_at = <evidenced instant>, completed_source = 'evidence'
where id = <todo id>;
```

Her ruling, and the reason: *"It will just silently update that card on the Done list...
because an item is an item that spreads out to all views. It just updates it, not create a
separate card."* A correction card was a second row in the Inbox for work already finished,
which read as a duplicate and cost her a click to confirm something the evidence already
proved. The click records when she reached the dashboard; the evidence records when the
work happened, and the evidence is the better answer.

**Every silent correction must leave a trail.** Add a line to the `story` naming both times
and quoting the evidence — *"Finished 4:12 PM PT per your Slack message; the Done click
stamped 9:06 AM the next day"*. Nothing about her record may change without the task itself
saying so.

**Same PT day, or no evidence at all → change nothing, silently.** Absence is not a finding.

**One thing still goes to the Inbox.** If the evidence disputes that the task is *done* at
all — she marked it done but the thread shows it reopened, or the evidence belongs to a
different task — that is not a timestamp, it is a different claim. File it as
`kind: 'correction'` with `target_todo_id` and let her arbitrate. Silent edits are for
*when*, never for *whether*.

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

## 0. Enforce the rules — first thing, before anything else

**The run cannot claim to be finished until `hq_enforce()` comes back empty, and it now
refuses to while any source is unaccounted for.** `public.sweep_required_sources` lists the
five that must be read every time — fireflies, slack, gmail, calendar, notebook — and every
active row of `public.slack_sources` must be named individually in `sweep_state.sources_checked`.

This exists because a run read Slack, found something interesting, corrected it, and reported
itself swept. Fireflies, Gmail, Calendar and the notebook were never reached. Nothing caught
it; Amy asked. Her words: *"why did you exclude the fireflies when you said that you include
all tools during the sweep?"*

**Record what you read as you read it, not at the end from memory.** A source that returned
nothing is still a source you read — say so. Empty is a finding; skipped is a failure, and
the two must never look alike.

```sql
select * from public.hq_enforce();
```

This repairs everything that can be repaired without a judgement call — a finished task
still flagged as blocked, an unfinished task carrying a finish time, a step orphaned by a
deleted goal, a goal out of step with its own steps — and returns whatever is left.

**Whatever it returns is yours to fix before the sweep ends.** Those are the ones needing a
decision: a title over the ceiling, a missing story, a missing contact, an unevidenced
finish. Never invent a value to clear a row; fix it properly or ask her.

Run it **again as the last thing you do**. Starting clean tells you which rows this run
broke; ending clean is the only proof the board is coherent.

## 4g. Run the audit before you finish — every time

Run `select * from public.hq_enforce();` **at the start of the sweep as well as the end.**
Starting clean tells you which rows this run broke. It now checks the naming ceiling, a
leading verb, blocked cards with nobody named, finished cards still flagged as blocked,
goals closed too early, goals left open after their last step, and steps orphaned by a
deleted goal. Every one of those was a real defect on her board that prose alone did not
prevent.

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
      "proposed_completed_at": "2026-08-06T23:41:02Z",
      "parent_todo_id": "<goal this is a step of, or omit>"
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
