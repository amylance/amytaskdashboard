import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { STATUSES } from '../_lib/priority.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
  if (updates.length === 0) {
    res.status(400).json({ error: 'updates array is required' });
    return;
  }

  const db = supabaseAdmin();
  const now = new Date().toISOString();

  const results = await Promise.all(
    updates.map(({ id, status, sort_order }) => {
      const patch = { sort_order, updated_at: now };
      if (status && STATUSES.includes(status)) patch.status = status;
      return db.from('todos').update(patch).eq('id', id);
    }),
  );

  const failed = results.find((r) => r.error);
  if (failed) {
    res.status(500).json({ error: failed.error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
