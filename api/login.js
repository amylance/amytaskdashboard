import { timingSafeEqual } from 'node:crypto';
import { checkPassphrase, createSessionToken, setSessionCookie, hashPassphrase } from './_lib/auth.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

// Two passphrases, one door. The editor passphrase (hash in the database, never shared)
// grants full control; the original shared passphrase — already known to Gavin and Isaac,
// and sitting in Slack history — now grants viewing only. Demoting the exposed credential
// beats rotating it: nobody has to be told anything.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.DASHBOARD_PASSPHRASE) {
    res.status(500).json({ error: 'Server is not configured: DASHBOARD_PASSPHRASE is not set' });
    return;
  }

  const { passphrase } = req.body ?? {};
  if (typeof passphrase !== 'string' || passphrase.length === 0) {
    res.status(401).json({ error: 'Incorrect passphrase' });
    return;
  }

  const { data: gate } = await supabaseAdmin()
    .from('access_gate')
    .select('editor_hash')
    .eq('id', true)
    .maybeSingle();

  if (gate?.editor_hash) {
    const a = Buffer.from(hashPassphrase(passphrase));
    const b = Buffer.from(gate.editor_hash);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      setSessionCookie(res, createSessionToken('editor'));
      res.status(200).json({ ok: true, role: 'editor' });
      return;
    }
  }

  if (checkPassphrase(passphrase)) {
    setSessionCookie(res, createSessionToken('viewer'));
    res.status(200).json({ ok: true, role: 'viewer' });
    return;
  }

  res.status(401).json({ error: 'Incorrect passphrase' });
}
