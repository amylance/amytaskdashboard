---
name: sweep
description: Sweep Amy's tools (Fireflies, Slack, Gmail) for new commitments since the last sweep, verify each against the record, and file them into the dashboard Inbox for her to approve, edit, or dismiss. Use when Amy says "sweep", "catch me up", "what did I miss", "brief me", or asks what's landed since she last looked. On-demand only — never scheduled.
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

## 2. Pull from each source

- **Fireflies** — `fireflies_get_transcripts` with `participants: ["amy@lance.live"]` and
  `fromDate`. **Only meetings Amy actually attended.** Take her action items.
- **Slack** — messages to/from Amy since the window: DMs, threads she's in, @-mentions.
  Her Slack ID is `U0BMZ75ANDT`.
- **Gmail** — `in:sent` plus anything requiring a reply since the window.

## 3. Filter — this is what keeps the noise out

An item reaches the Inbox **only if it is a commitment**:
- Someone asked Amy to do something, **or**
- Amy said she would do something.

**Everything else stays in its tool.** Announcements, FYIs, chatter, things assigned to
other people, notifications — these do NOT belong on the dashboard. Slack is already live;
the dashboard is not a second feed. When in doubt, leave it out.

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

Always write a short, specific `claude_note`. That note is the whole point — it's what
lets Amy trust the queue at a glance.

## 4b. Also propose disclosures (memory)

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

## 6. Report back

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
