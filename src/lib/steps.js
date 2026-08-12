// Steps under a goal.
//
// Amy's shape, in her words: one goal — "Get access to Gavin's inbox" — with the
// prerequisite work under it as its own movable cards. She works by dragging a card into
// Doing, so a step has to be a real card on the board, not a checkbox buried in a panel.
// The goal card mirrors where each of its steps currently sits.
//
// A goal is any task nothing points at. A step is any task carrying a parent_id. There is
// no third kind and no nesting below one level: a step that needs its own steps is a goal
// that was named too broadly.

export function indexSteps(todos) {
  const byParent = new Map();
  const byId = new Map();

  for (const t of todos) byId.set(t.id, t);
  for (const t of todos) {
    if (!t.parent_id || t.parent_id === t.id) continue;
    if (!byParent.has(t.parent_id)) byParent.set(t.parent_id, []);
    byParent.get(t.parent_id).push(t);
  }

  // Steps read in the order the work has to happen, which is the order they were asked for
  // — not by status. A list that reshuffles itself every time she ticks something is a list
  // she has to re-read from the top.
  for (const steps of byParent.values()) {
    steps.sort((a, b) => new Date(a.received_at ?? a.created_at) - new Date(b.received_at ?? b.created_at));
  }

  return {
    stepsOf: (id) => byParent.get(id) ?? [],
    goalOf: (todo) => (todo?.parent_id ? byId.get(todo.parent_id) ?? null : null),
    hasSteps: (id) => (byParent.get(id)?.length ?? 0) > 0,
  };
}

export function stepProgress(steps) {
  const total = steps.length;
  const done = steps.filter((s) => s.status === 'done').length;
  return { done, total, complete: total > 0 && done === total };
}
