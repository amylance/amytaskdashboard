export const STATUSES = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'Doing' },
  { id: 'review', label: 'Review' },
  // Most of Amy's work is blocked on someone else — this is a real state, not a parking lot.
  { id: 'waiting', label: 'Waiting on' },
  { id: 'done', label: 'Done' },
];

// A waiting item that nobody has chased in this many days is going stale.
export const STALE_AFTER_DAYS = 2;

export const PRIORITIES = [
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

// Inbox first — it's where the day starts. List and Timeline were removed: their jobs are
// covered by Kanban (current state), Calendar (the record) and People (work by counterpart).
export const VIEWS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'kanban', label: 'Board' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'people', label: 'People' },
  { id: 'profile', label: 'Profile' },
];
