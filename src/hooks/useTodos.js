import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function useTodos(config) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const todosRef = useRef(todos);
  todosRef.current = todos;

  const refresh = useCallback(async () => {
    const { todos } = await api.listTodos();
    setTodos(todos);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config) return undefined;
    const client = getSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);

    const channel = client
      .channel('todos-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
        setTodos((prev) => applyTodoChange(prev, payload));
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [config]);

  return { todos, loading, refresh, setTodos };
}

function applyTodoChange(prev, payload) {
  if (payload.eventType === 'INSERT') {
    const row = withAssigneeIds(payload.new, prev);
    if (row.deleted_at) return prev;
    if (prev.some((t) => t.id === row.id)) return prev;
    return [...prev, row];
  }

  if (payload.eventType === 'UPDATE') {
    const row = withAssigneeIds(payload.new, prev);
    if (row.deleted_at) {
      return prev.filter((t) => t.id !== row.id);
    }
    const exists = prev.some((t) => t.id === row.id);
    if (!exists) return [...prev, row];
    return prev.map((t) => (t.id === row.id ? { ...t, ...row } : t));
  }

  if (payload.eventType === 'DELETE') {
    const id = payload.old?.id;
    return prev.filter((t) => t.id !== id);
  }

  return prev;
}

function withAssigneeIds(row, prev) {
  const existing = prev.find((t) => t.id === row.id);
  return { assignee_ids: existing?.assignee_ids ?? [], people: existing?.people ?? [], ...row };
}
