import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

// Away / status log. Current status = the most recent event still open (ended_at null).
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();

  if (req.method === 'GET') {
    const [{ data: openRows }, { data: recent }] = await Promise.all([
      db.from('status_events').select('*').is('ended_at', null).order('started_at', { ascending: false }).limit(1),
      db.from('status_events').select('*').order('started_at', { ascending: false }).limit(20),
    ]);
    res.status(200).json({ current: openRows?.[0] ?? null, recent: recent ?? [] });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    // Close any currently-open status before starting a new one.
    await db.from('status_events').update({ ended_at: new Date().toISOString() }).is('ended_at', null);

    // 'available' just means "I'm back" — no open event.
    if (status === 'available') {
      res.status(200).json({ current: null });
      return;
    }

    const { data, error } = await db
      .from('status_events')
      .insert({ status, label: body.label || null, note: body.note || null })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ current: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
