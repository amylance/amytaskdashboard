// Two orderings living together. A task Amy has moved by hand is "pinned" and holds its
// place at the top of the column; everything else flows beneath it by most recent
// activity. Neither alone was right: pure activity ordering took away her ability to say
// "this one first", and pure manual ordering is a list she has to maintain by hand.

export function lastActivity(t) {
  const stamps = [t.completed_at, t.started_at, t.waiting_since, t.updated_at, t.received_at, t.created_at]
    .filter(Boolean)
    .map((v) => new Date(v).getTime());
  return stamps.length ? Math.max(...stamps) : 0;
}

export function orderColumn(items) {
  const pinned = items.filter((t) => t.manual_rank != null).sort((a, b) => a.manual_rank - b.manual_rank);
  const flowing = items.filter((t) => t.manual_rank == null).sort((a, b) => lastActivity(b) - lastActivity(a));
  return [...pinned, ...flowing];
}

// Moving a card pins it, and pins everything above it — the top of a column becomes
// hand-ordered down to wherever she stopped, and the rest keeps flowing. Dragging the
// bottom-most pinned card down releases it back to the flow, which is how she undoes a
// pin without needing a separate control for it.
export function reorderWithin(items, id, direction) {
  const ordered = orderColumn(items);
  const from = ordered.findIndex((t) => t.id === id);
  if (from === -1) return null;

  const to = direction === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= ordered.length) return null;

  const pinnedCount = ordered.filter((t) => t.manual_rank != null).length;

  // Last pinned card pushed downward leaves the pinned block entirely.
  if (direction === 'down' && ordered[from].manual_rank != null && from === pinnedCount - 1) {
    return [{ id, manual_rank: null }];
  }

  const next = [...ordered];
  [next[from], next[to]] = [next[to], next[from]];

  // Pin everything from the top through the moved card's new position.
  const cutoff = Math.max(to, pinnedCount - 1);
  return next.slice(0, cutoff + 1).map((t, i) => ({ id: t.id, manual_rank: i }));
}
