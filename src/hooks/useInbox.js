import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function useInbox(config) {
  const [items, setItems] = useState([]);
  const [sweep, setSweep] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { items, sweep } = await api.getInbox();
      setItems(items ?? []);
      setSweep(sweep ?? null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config) return undefined;
    const client = getSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
    const channel = client
      .channel('inbox-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_items' }, () => refresh())
      .subscribe();
    return () => client.removeChannel(channel);
  }, [config, refresh]);

  const resolve = useCallback(
    async (id, action, fields) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      try {
        await api.resolveInboxItem(id, action, fields);
      } catch {
        refresh();
      }
    },
    [refresh],
  );

  return { items, sweep, resolve, refresh };
}
