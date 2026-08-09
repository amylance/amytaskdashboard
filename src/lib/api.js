async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const message = body?.error ?? `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return body;
}

export const api = {
  getSession: () => request('/api/session'),
  login: (passphrase) => request('/api/login', { method: 'POST', body: JSON.stringify({ passphrase }) }),
  logout: () => request('/api/logout', { method: 'POST' }),

  listTodos: () => request('/api/todos'),
  createTodo: (payload) => request('/api/todos', { method: 'POST', body: JSON.stringify(payload) }),
  getTodo: (id) => request(`/api/todos/${id}`),
  updateTodo: (id, patch) => request(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTodo: (id) => request(`/api/todos/${id}`, { method: 'DELETE' }),
  reorderTodos: (updates) => request('/api/todos/reorder', { method: 'POST', body: JSON.stringify({ updates }) }),

  addComment: (id, body) => request(`/api/todos/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),

  linkPerson: (todoId, personId) =>
    request(`/api/todos/${todoId}/people`, { method: 'POST', body: JSON.stringify({ person_id: personId }) }),
  unlinkPerson: (todoId, personId) =>
    request(`/api/todos/${todoId}/people?person_id=${personId}`, { method: 'DELETE' }),

  listPeople: () => request('/api/people'),
  createPerson: (payload) => request('/api/people', { method: 'POST', body: JSON.stringify(payload) }),
  getPerson: (id) => request(`/api/people/${id}`),
  updatePerson: (id, patch) => request(`/api/people/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deletePerson: (id) => request(`/api/people/${id}`, { method: 'DELETE' }),
  addPersonNote: (id, body) => request(`/api/people/${id}/notes`, { method: 'POST', body: JSON.stringify({ body }) }),

  getPeopleFeed: () => request('/api/hq/feed'),

  getProfile: () => request('/api/hq/profile'),
  unlockProfile: (passphrase) =>
    request('/api/hq/profile', { method: 'POST', body: JSON.stringify({ action: 'unlock', passphrase }) }),
  updateProfileSection: (id, fields) =>
    request('/api/hq/profile', { method: 'POST', body: JSON.stringify({ id, ...fields }) }),

  getInbox: () => request('/api/hq/inbox'),
  resolveInboxItem: (id, action, fields = {}) =>
    request('/api/hq/inbox', { method: 'POST', body: JSON.stringify({ id, action, ...fields }) }),

  getCalendar: () => request('/api/hq/calendar'),
  addActivityEvent: (payload) => request('/api/hq/calendar', { method: 'POST', body: JSON.stringify(payload) }),
};
