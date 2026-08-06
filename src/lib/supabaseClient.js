import { createClient } from '@supabase/supabase-js';

let client;
let clientKey;

// Lazily built once we have the anon key from /api/session (only served
// to already-authenticated requests) — never bundled into the static JS.
export function getSupabaseClient(url, anonKey) {
  const key = `${url}:${anonKey}`;
  if (client && clientKey === key) return client;
  client = createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 5 } } });
  clientKey = key;
  return client;
}
