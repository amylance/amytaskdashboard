import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

// Per-page "Pending" corner note: dashboard items waiting on approval / access / a conversation.
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();

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
