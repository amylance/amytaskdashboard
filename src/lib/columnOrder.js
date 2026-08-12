// Columns order themselves by what last happened to the work. Hand-pinning existed here
// once and was used on exactly one card in a week, so it went with the rest of the card
// cleanup — an ordering Amy has to maintain by hand is a second to-do list.

// Rank on things that happened to the work, never on when the row was written. Approving
// an Inbox card writes a brand new row for work that may be days old, so created_at and
// updated_at sent backfilled history straight to the top of Done. They are bookkeeping,
// not activity, and only stand in when a task has no real event yet.
const ms = (v) => new Date(v).getTime();

export function lastActivity(t) {
  // A finished task ranks by when it finished, full stop. That is the evidence the Done
  // column is meant to show, and it must outrank a later-arriving received_at.
  if (t.status === 'done' && t.completed_at) return ms(t.completed_at);

  const events = [t.completed_at, t.started_at, t.waiting_since, t.received_at]
    .filter(Boolean)
    .map(ms);
  if (events.length) return Math.max(...events);

  const written = [t.updated_at, t.created_at].filter(Boolean).map(ms);
  return written.length ? Math.max(...written) : 0;
}

export function orderColumn(items) {
  return [...items].sort((a, b) => lastActivity(b) - lastActivity(a));
}
