import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

export function useProfile(config) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { sections } = await api.getProfile();
      setSections(sections ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config) return undefined;
    const client = getSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
    const channel = client
      .channel('profile-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_sections' }, () => refresh())
      .subscribe();
    return () => client.removeChannel(channel);
  }, [config, refresh]);

  const updateSection = useCallback(async (id, fields) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));
    try {
      await api.updateProfileSection(id, fields);
    } catch {
      refresh();
    }
  }, [refresh]);

  return { sections, loading, updateSection };
}
