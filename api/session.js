import { isAuthenticated } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthenticated(req)) {
    res.status(200).json({ authenticated: false });
    return;
  }

  // Only hand the browser a key that actually looks like a Supabase key. A misconfigured
  // env var (e.g. the project URL pasted into SUPABASE_ANON_KEY) otherwise produces an
  // endless stream of failed realtime WebSocket handshakes. Better to skip realtime
  // cleanly — the dashboard still works, it just needs a refresh to show new data.
  const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
  const looksValid = anonKey.startsWith('eyJ') || anonKey.startsWith('sb_publishable_');

  res.status(200).json({
    authenticated: true,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: looksValid ? anonKey : null,
    realtime: looksValid,
  });
}
