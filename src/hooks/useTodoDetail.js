import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function useTodoDetail(todoId, config) {
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!todoId) return;
    setLoading(true);
    const data = await api.getTodo(todoId);
    setComments(data.comments);
    setActivity(data.activity);
    setLoading(false);
  }, [todoId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config || !todoId) return undefined;
    const client = getSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);

    const channel = client
      .channel(`todo-comments-${todoId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'todo_comments', filter: `todo_id=eq.${todoId}` },
        (payload) => {
          setComments((prev) => (prev.some((c) => c.id === payload.new.id) ? prev : [...prev, payload.new]));
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [config, todoId]);

  const addComment = useCallback(
    async (body) => {
      await api.addComment(todoId, body);
      await refresh();
    },
    [todoId, refresh],
  );

  return { comments, activity, loading, addComment, refresh };
}
