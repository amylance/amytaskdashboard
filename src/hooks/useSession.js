import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export function useSession() {
  const [status, setStatus] = useState('loading'); // loading | gate | ready
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const session = await api.getSession();
      if (session.authenticated) {
        // config stays null when realtime isn't usable — every live-update hook already
        // guards on it, so they skip cleanly rather than retrying a doomed handshake.
        setConfig(
          session.supabaseUrl && session.supabaseAnonKey
            ? { supabaseUrl: session.supabaseUrl, supabaseAnonKey: session.supabaseAnonKey }
            : null,
        );
        setStatus('ready');
      } else {
        setStatus('gate');
      }
    } catch {
      setStatus('gate');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (passphrase) => {
      setError(null);
      try {
        await api.login(passphrase);
        await refresh();
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setConfig(null);
    setStatus('gate');
  }, []);

  return { status, config, error, login, logout };
}
