// TIMEZONE RULE
// Every source stores an absolute instant (Fireflies = UTC, Slack = epoch, Gmail = offset),
// so there is nothing to guess: we render every *timestamp* in Pacific — the Lance team's
// shared clock. Amy's own tools stay in her local time; only the dashboard normalizes.
//
// The one exception: plain DATES (due dates, all-day) carry no instant. "Aug 10" is Aug 10
// everywhere — converting them would slide them a day. So dates are never shifted.

const PT = 'America/Los_Angeles';

export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  // Plain date — parse as local midnight and never timezone-shift it.
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// A timestamp rendered on the Lance clock (Pacific).
export function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString('en-US', {
    timeZone: PT,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTimePT(value) {
  const base = formatDateTime(value);
  return base ? `${base} PT` : null;
}

// Amy's local (Philippines) rendering — used for hover, so a Pacific date is never ambiguous.
export function formatLocal(value) {
  if (!value) return null;
  return `${new Date(value).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} PH`;
}

// Which Pacific calendar day a timestamp belongs to (YYYY-MM-DD).
export function toPacificDateKey(value) {
  if (!value) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PT,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
  return parts;
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  const due = new Date(`${dateStr}T23:59:59`);
  return due.getTime() < Date.now();
}

export function shortId(id) {
  return id ? id.slice(0, 8) : '';
}
