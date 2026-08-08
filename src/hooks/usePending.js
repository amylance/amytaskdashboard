import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function usePending(config) {
  const [pending, setPending] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const { pending } = await api.listPending();
      setPending(pending ?? []);
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
      .channel('pending-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_items' }, () => refresh())
      .subscribe();
    return () => client.removeChannel(channel);
  }, [config, refresh]);

  return { pending, refresh };
}
