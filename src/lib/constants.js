export const STATUSES = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'Doing' },
  // Most of Amy's work is blocked on someone else — this is a real state, not a parking lot.
  { id: 'waiting', label: 'Pending' },
  { id: 'done', label: 'Done' },
];

// A step is re-statused inside its goal's card, never dragged. Done is not in the list:
// ticking the circle does that, and untucking it returns the step to To Do.
export const STEP_STATUSES = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'Doing' },
  { id: 'waiting', label: 'Pending' },
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
  { id: 'kanban', label: 'Kanban' },
  { id: 'list', label: 'List' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'people', label: 'People' },
  { id: 'profile', label: 'Profile' },
];

// The ops areas Amy handles for Gavin. Used to filter the List.
export const CATEGORIES = [
  'Inbox & Email',
  'Access & Tools',
  'Admin & HR',
  'People & CRM',
  'Dashboard',
  'Comms & Sync',
  'General',
];
