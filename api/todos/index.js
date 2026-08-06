import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { PRIORITY_RANK, STATUSES, PRIORITIES } from '../_lib/priority.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('todos')
      .select('*, todo_assignees(user_id)')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const todos = data.map(({ todo_assignees, ...todo }) => ({
      ...todo,
      assignee_ids: todo_assignees.map((a) => a.user_id),
    }));

    res.status(200).json({ todos });
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
        sort_order,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await db.from('todo_activity').insert({
      todo_id: data.id,
      action: 'created',
      detail: { title, status, priority },
    });

    res.status(201).json({ todo: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
