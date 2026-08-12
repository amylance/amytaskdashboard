import { requireAuth, requireEditor, sessionRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { PRIORITY_RANK, STATUSES, PRIORITIES } from '../_lib/priority.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET' && !requireEditor(req, res)) return;
  const db = supabaseAdmin();

  if (req.method === 'GET') {
    // The lock on a card has to mean something. Until now is_private only drew an icon —
    // the row still went over the wire to anyone holding the view-only passphrase, which
    // Gavin and Isaac have and which sits in Slack history. Private tasks are filtered out
    // server-side so a viewer never receives them, story and comments included.
    let query = db.from('todos').select('*').is('deleted_at', null);

    if (sessionRole(req) !== 'editor') query = query.eq('is_private', false);

    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ todos: data ?? [] });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const status = STATUSES.includes(body.status) ? body.status : 'todo';
    const priority = PRIORITIES.includes(body.priority) ? body.priority : 'normal';

    const { data: existing } = await db
      .from('todos')
      .select('sort_order')
      .eq('status', status)
      .is('deleted_at', null)
      .order('sort_order', { ascending: false })
      .limit(1);

    const sort_order = existing?.length ? existing[0].sort_order + 1 : 0;

    const { data, error } = await db
      .from('todos')
      .insert({
        title,
        description: body.description ?? null,
        due_date: body.due_date ?? null,
        status,
        priority,
        priority_rank: PRIORITY_RANK[priority],
        is_private: Boolean(body.is_private),
        contact: body.contact || null,
        category: body.category || null,
        // A step names its goal. Everything else is a goal in its own right.
        parent_id: body.parent_id || null,
        is_method: Boolean(body.is_method),
        sort_order,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ todo: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
