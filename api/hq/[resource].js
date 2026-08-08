import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

// Consolidated HQ endpoint. Handles both the away/status log and the pending notes
// from a single serverless function, to stay under Vercel's 12-function limit.
// Routes: /api/hq/status  ·  /api/hq/pending
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();
  const { resource } = req.query;

  if (resource === 'status') return handleStatus(req, res, db);
  if (resource === 'pending') return handlePending(req, res, db);

  res.status(404).json({ error: 'Not found' });
  return undefined;
}

// --- Away / status log. Current status = the most recent event still open. ---
async function handleStatus(req, res, db) {
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

// --- Per-page "Pending" corner note. ---
async function handlePending(req, res, db) {
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('pending_items')
      .select('*')
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ pending: data ?? [] });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const { data, error } = await db
      .from('pending_items')
      .insert({
        scope: body.scope || 'global',
        title,
        reason: body.reason || null,
        blocked_on: body.blocked_on || null,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ item: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
