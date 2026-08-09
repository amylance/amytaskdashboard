import { toPacificDateKey } from './format.js';

// Search exists for the case where Amy remembers a fragment — a name, a word someone used —
// but not when it happened. So the index spans every month at once and reaches into the
// bodies too: a meeting's checklist lines, a task's Claude note, an event's detail. Matching
// only titles would miss exactly the thing she is trying to find.
const KIND_MARK = { meeting: '🎙', event: '•', done: '✓', due: '○', removed: '↺' };

function push(out, entry) {
  if (entry.dayKey) out.push(entry);
}

export function buildCalendarIndex({ meetings = [], events = [], todos = [], removed = [] }) {
  const out = [];

  for (const m of meetings) {
    push(out, {
      id: m.id,
      kind: 'meeting',
      dayKey: toPacificDateKey(m.occurred_at),
      title: m.title,
      subtitle: m.with_whom ?? null,
      // Checklist lines are the richest thing in the calendar and the likeliest match.
      body: [m.summary, ...(m.items ?? []).map((i) => i.label)].filter(Boolean).join(' · '),
    });
  }

  for (const ev of events) {
    push(out, {
      id: ev.id,
      kind: 'event',
      dayKey: ev.event_date,
      title: ev.title,
      subtitle: null,
      body: ev.detail ?? '',
    });
  }

  for (const t of todos) {
    const done = t.status === 'done' && t.completed_at;
    if (!done && !(t.due_date && t.status !== 'done')) continue;
    push(out, {
      id: t.id,
      kind: done ? 'done' : 'due',
      dayKey: done ? toPacificDateKey(t.completed_at) : t.due_date,
      title: t.title,
      subtitle: t.category ?? null,
      body: [t.description, t.claude_note, t.waiting_on].filter(Boolean).join(' · '),
    });
  }

  for (const t of removed) {
    push(out, {
      id: t.id,
      kind: 'removed',
      dayKey: t.completed_at ? toPacificDateKey(t.completed_at) : t.due_date,
      title: t.title,
      subtitle: 'removed',
      body: '',
    });
  }

  return out;
}

// Title hits outrank body hits, then most recent first. Amy usually half-remembers a name,
// so an exact word in a title is almost always the thing she means.
export function searchCalendar(index, query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored = [];
  for (const entry of index) {
    const title = (entry.title ?? '').toLowerCase();
    const body = (entry.body ?? '').toLowerCase();
    const sub = (entry.subtitle ?? '').toLowerCase();

    let score = 0;
    if (title.startsWith(q)) score = 4;
    else if (title.includes(q)) score = 3;
    else if (sub.includes(q)) score = 2;
    else if (body.includes(q)) score = 1;
    if (!score) continue;

    // Show the sentence the word actually appeared in, not the whole body.
    let excerpt = null;
    if (score === 1) {
      const at = body.indexOf(q);
      const from = Math.max(0, at - 30);
      excerpt = `${from > 0 ? '…' : ''}${entry.body.slice(from, at + q.length + 45).trim()}…`;
    }

    scored.push({ ...entry, score, excerpt, mark: KIND_MARK[entry.kind] });
  }

  scored.sort((a, b) => b.score - a.score || (a.dayKey > b.dayKey ? -1 : 1));
  return scored.slice(0, limit);
}
