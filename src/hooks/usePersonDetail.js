import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function usePersonDetail(personId, config) {
  const [notes, setNotes] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!personId) return;
    setLoading(true);
    const data = await api.getPerson(personId);
    setNotes(data.notes);
    setTodos(data.todos);
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config || !personId) return undefined;
    const client = getSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);

    const channel = client
      .channel(`person-notes-${personId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'person_notes', filter: `person_id=eq.${personId}` },
        (payload) => {
          setNotes((prev) => (prev.some((n) => n.id === payload.new.id) ? prev : [payload.new, ...prev]));
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [config, personId]);

  const addNote = useCallback(
    async (body) => {
      await api.addPersonNote(personId, body);
      await refresh();
    },
    [personId, refresh],
  );

  return { notes, todos, loading, addNote, refresh };
}
