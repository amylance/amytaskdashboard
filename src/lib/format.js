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

// Today, on the dashboard's clock (Pacific) — never the browser's.
export function pacificTodayKey() {
  return toPacificDateKey(new Date());
}

// Whole days from the Pacific today to a plain due date. Compares dates as dates, so no
// timezone conversion is applied to a value that has no time in it.
export function daysUntilPT(dateStr) {
  if (!dateStr) return null;
  const toUTC = (k) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(dateStr) - toUTC(pacificTodayKey())) / 86400000);
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  const days = daysUntilPT(dateStr);
  return days != null && days < 0;
}

export function shortId(id) {
  return id ? id.slice(0, 8) : '';
}

// The Finished field edits a timestamp as Pacific wall time — the dashboard's clock —
// regardless of the browser being in Manila. Round-trips at minute precision.
export function pacificInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: PT, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: PT, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
  return `${date}T${time}`;
}

export function pacificToISO(wall) {
  if (!wall) return null;
  // Interpret the wall time as UTC, then shift by however far PT is from UTC at that
  // moment. Two passes so a DST boundary lands on the right side.
  let guess = new Date(`${wall}:00Z`);
  for (let i = 0; i < 2; i++) {
    const seen = pacificInputValue(guess.toISOString());
    const drift = new Date(`${wall}:00Z`) - new Date(`${seen}:00Z`);
    guess = new Date(guess.getTime() + drift);
  }
  return guess.toISOString();
}
