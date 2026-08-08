# Tools Inventory & Surface Model (Items 7–9)

Assembled 2026-08-08 from Amy's three onboarding meetings (Onboarding Aug 5;
Sync I & II Aug 6), the submissions log, and the tools actually connected in this
workspace right now. **This is for discussion — nothing is being built from it yet.**

Provenance note: the Fireflies transcripts have scrambled speaker labels (most of
Gavin's speech in the onboarding call is mis-tagged as Isaac) and mistranscribe
names ("Perplexity Comet" → "Comment/Computer", "Gatik" → "Guthic"). Facts below
are role-inferred and cross-checked, not label-derived.

## The surface model (Item 8) — Amy's own division of labour

Amy explicitly chose *not* to just inherit Isaac's setup. Her stated model:

- **Claude (chat)** = thinking, discussion, and execution. The working surface.
  *"Claude for me is more on discussion and then execution."*
- **Slack** = team communication and receiving updates. Also where the Claude Tag
  app lives, so she can capture "I heard X about person Y" without leaving Slack.
  *"Slack would be communications with teams and getting updates."*
- **The Vercel dashboard** = the **headquarters / output surface**. One place that
  everything feeds into, that Gavin and Isaac can open to see what she's doing.
  *"this one is just my headquarters… anything you're doing ever should be in this
  dashboard so that anybody can see it."*
- **Claude Code** = the build surface for the dashboard itself (talk to it, it edits
  the site). She never touches Supabase/GitHub/Vercel by hand.

One source of truth (Supabase), two surfaces to reach it (talk in Slack/Claude,
view on the dashboard) — they auto-sync. That is the whole design intent.

## Inventory

| Tool | What it's for (in Amy's workflow) | Status in this workspace | Recommended home |
|---|---|---|---|
| **Claude (chat)** | Primary AI surface — discuss, execute, draft, run the on-demand brief | Live (gifted Lance plan, Lance pays) | The working surface |
| **Claude Code** | Build/edit the dashboard by talking to it | Live (this) | Build surface only |
| **Slack** | Team comms + updates; Claude Tag app for quick capture | Live · *MFA was pending at Sync I — verify* | Communication + capture |
| **Vercel dashboard** | The HQ: tasks (4 views), People log, brief, profile, clocks, status | Live, password-gated | The output surface |
| **Supabase** | The database everything lives in | Live (read-only connector) | Invisible backend |
| **Vercel (hosting)** | Hosts the dashboard as a live link | Live | Invisible |
| **GitHub** | Stores the dashboard code | Live (repo `amytaskdashboard`) | Invisible (via Claude Code) |
| **Fireflies** | Meeting capture across the company; feeds People log + action items | Live | Source → dashboard |
| **Gmail** | Read for briefs; triage **Gavin's inbox** (as his EA) | Amy's own: live. **Gavin-inbox delegation: BLOCKED at Sync I** (missing delegation toggle, escalated to Google support) — verify current status | Source → brief |
| **Google Calendar** | Her schedule; possible overlay on the dashboard calendar | Live | Source (+ maybe dashboard) |
| **Google Drive** | Onboarding docs, PRDs, the Lance tool guide | Live | Source |
| **Linear** | Read "what tickets exist / who owns what" (Gavin's product work) | Live | Source (read) |
| **PostHog** | Product analytics; read when Gavin asks (esp. calls data) | Live | Source (read) |
| **Whisper Flow** | Higher-quality voice dictation, esp. emails | Amy has it; **Note Taker to be disabled** (Fireflies covers meetings). *Not* a Claude connector | Input layer |
| **Perplexity Comet ("Computer")** | Isaac's optional org hub (auto-brief, moves cards). Amy chose **Claude-only** | Not set up (by choice) | Skip unless revisited |
| **Rippling** | HR / payroll / org chart; self-serve auto-payment toggle (auto-approve Aug 10) | Amy's account exists | Occasional, not daily |
| **lance.live/internal** | Lance's internal tools: **GM CRM**, deal center, adoption/support metrics, devices dashboard, reimbursements, flight tracker | **No Claude access** — screenshots only. This is **Item 25** (ask Isaac Monday) | Reference (blocked) |

Named at onboarding but eng-facing / not Amy's daily tools: Statsig (A/B testing),
Codex. Zoom explicitly not used (Google Meet instead).

## Two different "CRMs" — keep them apart

- **Lance product GM CRM** (inside lance.live/internal) — Gavin *assigned* Amy to
  populate/build this out as she learns hotel contacts: *"use this as your own
  internal tool and as you hear about people, you add the contacts."* It covers
  hotel GMs, is "half baked," and does **not** cover OTO. This is a **mandate**.
- **Personal People / awareness log** (her dashboard) — Amy's *own* idea, reasoned
  from watching Gavin's OTO WiFi call: an encounter log of who crossed her awareness,
  verified/unverified with source links. This is a **design she invented**.

They share the word "CRM" and nothing else. The boundary is deliberate.

## Overlaps resolved

- **Claude vs Slack vs dashboard** → one DB, talk to input, dashboard to view; auto-sync.
- **Fireflies vs Whisper Note Taker** → keep Fireflies, disable Whisper's note-taker.
- **Perplexity Computer vs Claude** → Claude-only.
- **Dashboard Calendar vs Google Calendar** → the dashboard calendar shows *task
  deadlines* (same to-do data as Kanban/Timeline), not a second calendar. Open
  question: should it also overlay Google Calendar meetings?

## Open decisions (need Amy)

1. **Item 9 — Fireflies checkbox.** A task can exist in both Fireflies (My Tasks/All
   Tasks) and the dashboard. Where does the checkbox *live* so the two don't drift?
   Unresolved; the sharpest open question in the whole project.
2. **Item 25 — lance.live/internal access.** Ask Isaac to connect it to Claude, to
   end the screenshot workaround. For Monday.
3. **Gmail delegation to Gavin's inbox** — was blocked at Sync I; verify whether the
   Google support ticket resolved it.
4. **Dashboard calendar** — task-deadlines only, or overlay Google Calendar meetings?
5. **Perplexity Comet** — confirm staying skipped.
