import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

const EDITABLE_FIELDS = ['name', 'company', 'role', 'phone', 'email'];

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'GET') {
    const [{ data: person, error }, { data: notes }, { data: links }] = await Promise.all([
      db.from('people').select('*').eq('id', id).is('deleted_at', null).single(),
      db.from('person_notes').select('*').eq('person_id', id).order('created_at', { ascending: false }),
      db.from('todo_people').select('todo_id, todos(id, title, status, due_date)').eq('person_id', id),
    ]);

    if (error || !person) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const todos = (links ?? [])
      .map((l) => l.todos)
      .filter((t) => t && !t.deleted_at);

    res.status(200).json({ person, notes: notes ?? [], todos });
    return;
  }

  if (req.method === 'PATCH') {
    const body = req.body ?? {};
    const updates = { updated_at: new Date().toISOString() };

    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }

    if (updates.name != null && !String(updates.name).trim()) {
      res.status(400).json({ error: 'name cannot be empty' });
      return;
    }

    const { data, error } = await db.from('people').update(updates).eq('id', id).select().single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ person: data });
    return;
  }

  if (req.method === 'DELETE') {
    const { error } = await db.from('people').update({ deleted_at: new Date().toISOString() }).eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
