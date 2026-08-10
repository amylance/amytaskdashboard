import { requireAuth, requireEditor } from '../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET' && !requireEditor(req, res)) return;
  const db = supabaseAdmin();
  const { id } = req.query;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!body) {
    res.status(400).json({ error: 'body is required' });
    return;
  }

  const { data, error } = await db
    .from('todo_comments')
    .insert({ todo_id: id, body, source: 'app' })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  await db.from('todo_activity').insert({ todo_id: id, action: 'commented', detail: { body } });

  res.status(201).json({ comment: data });
}
