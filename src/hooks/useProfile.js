import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// The Profile/Memory tab is gated by its own passphrase. Content is never fetched —
// and the browser's realtime key cannot read it — until the gate is unlocked.
export function useProfile() {
  const [sections, setSections] = useState([]);
  const [disclosures, setDisclosures] = useState([]);
  const [locked, setLocked] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { sections, disclosures } = await api.getProfile();
      setSections(sections ?? []);
      setDisclosures(disclosures ?? []);
      setLocked(false);
    } catch (err) {
      if (err.status === 403) {
        setLocked(true);
        setSections([]);
        setDisclosures([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlock = useCallback(
    async (passphrase) => {
      await api.unlockProfile(passphrase);
      await refresh();
    },
    [refresh],
  );

  const updateSection = useCallback(
    async (id, fields) => {
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));
      try {
        await api.updateProfileSection(id, fields);
      } catch {
        refresh();
      }
    },
    [refresh],
  );

  return { sections, disclosures, locked, loading, unlock, updateSection };
}
