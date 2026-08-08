import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function useStatus(config) {
  const [current, setCurrent] = useState(null);
  const [recent, setRecent] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const { current, recent } = await api.getStatus();
      setCurrent(current ?? null);
      setRecent(recent ?? []);
    } catch {
      // ignore — realtime or next refresh will reconcile
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config) return undefined;
    const client = getSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
    const channel = client
      .channel('status-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_events' }, () => refresh())
      .subscribe();
    return () => client.removeChannel(channel);
  }, [config, refresh]);

  const setStatus = useCallback(
    async (payload) => {
      await api.setStatus(payload);
      await refresh();
    },
    [refresh],
  );

  return { current, recent, setStatus, refresh };
}
