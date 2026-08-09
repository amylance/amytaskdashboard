import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function useCalendarEvents(config) {
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const { events, meetings } = await api.getCalendar();
      setEvents(events ?? []);
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
      .channel('activity-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_events' }, () => refresh())
      .subscribe();
    return () => client.removeChannel(channel);
  }, [config, refresh]);

  return { events, meetings };
}
