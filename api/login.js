import { checkPassphrase, createSessionToken, setSessionCookie } from './_lib/auth.js';

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

  if (!checkPassphrase(passphrase)) {
    res.status(401).json({ error: 'Incorrect passphrase' });
    return;
  }

  setSessionCookie(res, createSessionToken());
  res.status(200).json({ ok: true });
}
