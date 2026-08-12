import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function useCalendarEvents(config) {
  const [meetings, setMeetings] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const { meetings } = await api.getCalendar();
      setMeetings(meetings ?? []);
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
      .channel('meetings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => refresh())
      .subscribe();
    return () => client.removeChannel(channel);
  }, [config, refresh]);

  return { meetings };
}
