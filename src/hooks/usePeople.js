import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function usePeople(config) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { people } = await api.listPeople();
    setPeople(people);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config) return undefined;
    const client = getSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);

    const channel = client
      .channel('people-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, (payload) => {
        setPeople((prev) => applyPersonChange(prev, payload));
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [config]);

  return { people, loading, refresh, setPeople };
}

function applyPersonChange(prev, payload) {
  if (payload.eventType === 'INSERT') {
    if (payload.new.deleted_at) return prev;
    if (prev.some((p) => p.id === payload.new.id)) return prev;
    return [...prev, payload.new].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (payload.eventType === 'UPDATE') {
    if (payload.new.deleted_at) {
      return prev.filter((p) => p.id !== payload.new.id);
    }
    const exists = prev.some((p) => p.id === payload.new.id);
    const next = exists
      ? prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
      : [...prev, payload.new];
    return next.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (payload.eventType === 'DELETE') {
    return prev.filter((p) => p.id !== payload.old?.id);
  }

  return prev;
}
