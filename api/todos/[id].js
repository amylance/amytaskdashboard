import { requireAuth, requireEditor } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { PRIORITY_RANK, STATUSES, PRIORITIES } from '../_lib/priority.js';

const EDITABLE_FIELDS = [
  'story',
  'completed_at',
  'waiting_on',
  'waiting_since',
  'title',
  'description',
  'due_date',
  'status',
  'priority',
  'is_private',
  'sort_order',
  'contact',
  'category',
  'link_url',
  'link_label',
];

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET' && !requireEditor(req, res)) return;
  const db = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'GET') {
    const [{ data: todo, error }, { data: comments }, { data: activity }, { data: assignees }, { data: links }] =
      await Promise.all([
        db.from('todos').select('*').eq('id', id).is('deleted_at', null).single(),
        db.from('todo_comments').select('*').eq('todo_id', id).order('created_at', { ascending: true }),
        db.from('todo_activity').select('*').eq('todo_id', id).order('created_at', { ascending: false }),
        db.from('todo_assignees').select('user_id').eq('todo_id', id),
        db.from('todo_people').select('people(id, name, company, role)').eq('todo_id', id),
      ]);

    if (error || !todo) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.status(200).json({
      todo: {
        ...todo,
        assignee_ids: (assignees ?? []).map((a) => a.user_id),
        people: (links ?? []).map((l) => l.people).filter(Boolean),
      },
      comments: comments ?? [],
      activity: activity ?? [],
    });
    return;
  }

  if (req.method === 'PATCH') {
    const body = req.body ?? {};

    const { data: current, error: fetchError } = await db
      .from('todos')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !current) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const updates = { updated_at: new Date().toISOString() };
    const changes = [];

    for (const field of EDITABLE_FIELDS) {
      if (!(field in body)) continue;
      if (field === 'status' && !STATUSES.includes(body.status)) continue;
      if (field === 'priority' && !PRIORITIES.includes(body.priority)) continue;
      if (body[field] === current[field]) continue;
      updates[field] = body[field];
      changes.push({ field, from: current[field], to: body[field] });
    }

    if (updates.priority) {
      updates.priority_rank = PRIORITY_RANK[updates.priority];
    }

    // Amy editing the Finished time directly is her overruling weaker evidence.
    if ('completed_at' in updates && !updates.status) {
      updates.completed_source = updates.completed_at ? 'manual' : null;
    }

    if (updates.status && updates.status !== current.status) {
      const now = new Date().toISOString();
      if (updates.status === 'doing' && !current.started_at) {
        updates.started_at = now;
      }
      if (updates.status === 'done') {
        // The click is provisional testimony, not verified fact — a sweep may later
        // propose a correction from tool evidence, and Amy arbitrates in the Inbox.
        updates.completed_at = now;
        updates.completed_source = 'click';
        updates.decided_at = now;
      } else if (current.status === 'done') {
        updates.completed_at = null;
        updates.completed_source = null;
      }
      if (updates.status === 'review') {
        updates.decided_at = now;
      }
    }

    if (changes.length === 0) {
      res.status(200).json({ todo: current });
      return;
    }

    const { data, error } = await db.from('todos').update(updates).eq('id', id).select().single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const statusOrPriorityChange = changes.find((c) => c.field === 'status' || c.field === 'priority');
    await db.from('todo_activity').insert({
      todo_id: id,
      action: statusOrPriorityChange ? `${statusOrPriorityChange.field}_changed` : 'updated',
      detail: { changes },
    });

    res.status(200).json({ todo: data });
    return;
  }

  if (req.method === 'DELETE') {
    const { error } = await db
      .from('todos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await db.from('todo_activity').insert({ todo_id: id, action: 'deleted', detail: {} });

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
