export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  const due = new Date(`${dateStr}T23:59:59`);
  return due.getTime() < Date.now();
}

export function shortId(id) {
  return id ? id.slice(0, 8) : '';
}
