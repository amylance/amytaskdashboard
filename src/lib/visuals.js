// One visual language, used by every view so a colour or icon always means the same thing.
//
// Design principles applied here:
// 1. ONLY EXCEPTIONS GET COLOUR. "Normal" priority shows no badge at all — if everything
//    is coloured, nothing stands out. Silence = normal, so the eye lands on High/Urgent.
// 2. REDUNDANT CODING. Every colour is paired with an icon or word, never colour alone —
//    it survives colour-blindness, greyscale, and a glance from across the room.
// 3. FINISHED WORK RECEDES. Done items get lower contrast so live work holds attention.
// 4. CONSISTENCY ACROSS VIEWS. The same source mark and status colour appear on Kanban,
//    List, Timeline and Calendar — one thing to learn, not four.

// --- Where it came from -----------------------------------------------------
export const SOURCES = {
  fireflies: { mark: '🎙', label: 'Fireflies' },
  slack: { mark: '💬', label: 'Slack' },
  email: { mark: '✉️', label: 'Email' },
  google: { mark: '📅', label: 'Google' },
  lance_live: { mark: '🏨', label: 'Lance Live' },
  rippling: { mark: '🧾', label: 'Rippling' },
  app: { mark: '✏️', label: 'Added by me' },
};

export function sourceOf(source) {
  return SOURCES[source] ?? SOURCES.app;
}

// --- Status -----------------------------------------------------------------
// Cool → warm → resolved: grey (waiting), blue (moving), amber (needs a look), green (done).
export const STATUS_VISUALS = {
  todo: { label: 'To Do', mark: '○', dot: 'bg-slate-400', text: 'text-slate-600', bar: 'bg-slate-300' },
  doing: { label: 'Doing', mark: '◐', dot: 'bg-blue-500', text: 'text-blue-700', bar: 'bg-blue-400' },
  review: { label: 'Review', mark: '◔', dot: 'bg-amber-500', text: 'text-amber-700', bar: 'bg-amber-400' },
  done: { label: 'Done', mark: '✓', dot: 'bg-emerald-500', text: 'text-emerald-700', bar: 'bg-emerald-400' },
};

export function statusOf(status) {
  return STATUS_VISUALS[status] ?? STATUS_VISUALS.todo;
}

// --- Priority ---------------------------------------------------------------
// `show: false` for normal — deliberately invisible so urgency is the only thing shouting.
export const PRIORITY_VISUALS = {
  normal: { label: 'Normal', show: false, chip: '', mark: '' },
  high: { label: 'High', show: true, chip: 'bg-amber-500/15 text-amber-700 border border-amber-500/30', mark: '▲' },
  urgent: { label: 'Urgent', show: true, chip: 'bg-clay-soft text-clay border border-clay/35 font-semibold', mark: '⬤' },
};

export function priorityOf(priority) {
  return PRIORITY_VISUALS[priority] ?? PRIORITY_VISUALS.normal;
}
