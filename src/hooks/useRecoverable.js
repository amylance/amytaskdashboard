import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// One source of truth for everything Amy has removed — deleted tasks, deleted people,
// dismissed inbox items. Views read the slice they care about, so recovery always appears
// where the loss happened rather than in a separate tab nobody remembers to open.
export function useRecoverable() {
  const [removed, setRemoved] = useState({ todos: [], people: [], inbox: [] });

  const refresh = useCallback(async () => {
    try {
      const data = await api.getRecoverable();
      setRemoved({ todos: data.todos ?? [], people: data.people ?? [], inbox: data.inbox ?? [] });
    } catch {
      // Recovery is a safety net, never a blocker — a failure here stays silent.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const restore = useCallback(
    async (kind, id) => {
      const { restored } = await api.restore(kind, id);
      await refresh();
      return restored;
    },
    [refresh],
  );

  return { removed, refreshRemoved: refresh, restore };
}
