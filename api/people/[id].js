import { requireAuth, requireEditor } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

const EDITABLE_FIELDS = [
  'name',
  'company',
  'role',
  'phone',
  'email',
  'verification_tier',
  'verification_source',
  'crm_type',
  'department',
  'reports_to',
  'location',
  'tenure_note',
  'employment_type',
  'is_intern',
  'last_day',
  'source_url',
];

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET' && !requireEditor(req, res)) return;
  const db = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'GET') {
    const [{ data: person, error }, { data: notes }] = await Promise.all([
      db.from('people').select('*').eq('id', id).is('deleted_at', null).single(),
      db.from('person_notes').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    ]);

    if (error || !person) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    // Nobody ever used the link table — 0 rows across the whole board. The contact field
    // on a task is what Amy actually fills in, so a person's work is matched by name.
    const { data: todos } = await db
      .from('todos')
      .select('id, title, status, due_date')
      .is('deleted_at', null)
      .ilike('contact', `%${person.name}%`);

    res.status(200).json({ person, notes: notes ?? [], todos: todos ?? [] });
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
