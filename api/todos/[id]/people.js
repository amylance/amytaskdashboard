import { requireAuth, requireEditor } from '../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET' && !requireEditor(req, res)) return;
  const db = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'POST') {
    const personId = req.body?.person_id;
    if (!personId) {
      res.status(400).json({ error: 'person_id is required' });
      return;
    }

    const { error } = await db.from('todo_people').insert({ todo_id: id, person_id: personId });

    if (error && error.code !== '23505') {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ ok: true });
    return;
  }

  if (req.method === 'DELETE') {
    const personId = req.query.person_id ?? req.body?.person_id;
    if (!personId) {
      res.status(400).json({ error: 'person_id is required' });
      return;
    }

    const { error } = await db.from('todo_people').delete().eq('todo_id', id).eq('person_id', personId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
