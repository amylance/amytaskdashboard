import {
  requireAuth,
  requireEditor,
  hashPassphrase,
  createProfileToken,
  setProfileCookie,
  isProfileUnlocked,
} from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

// Consolidated HQ endpoint. Handles both the away/status log and the pending notes
// from a single serverless function, to stay under Vercel's 12-function limit.
// Routes: /api/hq/status  ·  /api/hq/pending
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();
  const { resource } = req.query;

  // Writes are editor-only. Profile is exempt: it has its own, stronger passphrase that
  // only Amy holds, and locking its unlock action behind editor would let a role problem
  // strand her out of her own private tab.
  if (req.method !== 'GET' && resource !== 'profile' && !requireEditor(req, res)) return;

  if (resource === 'status') return handleStatus(req, res, db);
  if (resource === 'pending') return handlePending(req, res, db);
  if (resource === 'feed') return handleFeed(req, res, db);
  if (resource === 'profile') return handleProfile(req, res, db);
  if (resource === 'calendar') return handleCalendar(req, res, db);
  if (resource === 'inbox') return handleInbox(req, res, db);
  if (resource === 'recover') return handleRecover(req, res, db);

  res.status(404).json({ error: 'Not found' });
  return undefined;
}

// --- Inbox: raw commitment candidates awaiting approve / edit / dismiss.
// Nothing here is a task until Amy approves it. ---
async function handleInbox(req, res, db) {
  if (req.method === 'GET') {
    const [{ data, error }, { data: sweep }] = await Promise.all([
      db.from('inbox_items').select('*').eq('state', 'pending').order('received_at', { ascending: false }),
      db.from('sweep_state').select('*').eq('id', true).maybeSingle(),
    ]);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ items: data ?? [], sweep: sweep ?? null });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
    const { id, action } = body;

    // The sweep writes new candidates here. Dedupe on (source, source_raw) so
    // re-sweeping the same window never creates duplicates.
    if (action === 'create') {
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) {
        res.status(400).json({ error: 'items[] is required' });
        return;
      }
      const inserted = [];
      for (const it of items) {
        if (!it?.title || !it?.received_at) continue;
        const { data: dupe } = await db
          .from('inbox_items')
          .select('id')
          .eq('source', it.source ?? 'fireflies')
          .eq('source_raw', it.source_raw ?? '')
          .maybeSingle();
        if (dupe) continue;
        const { data: row } = await db
          .from('inbox_items')
          .insert({
            title: it.title,
            source: it.source ?? 'fireflies',
            source_raw: it.source_raw ?? null,
            source_url: it.source_url ?? null,
            source_context: it.source_context ?? null,
            claude_note: it.claude_note ?? null,
            story: it.story ?? null,
            suggested_status: it.suggested_status === 'done' ? 'done' : 'todo',
            received_at: it.received_at,
            kind: ['task', 'memory', 'correction'].includes(it.kind) ? it.kind : 'task',
            to_whom: it.to_whom ?? null,
            target_todo_id: it.target_todo_id ?? null,
            proposed_completed_at: it.proposed_completed_at ?? null,
          })
          .select()
          .single();
        if (row) inserted.push(row);
      }
      await db
        .from('sweep_state')
        .update({
          last_swept_at: new Date().toISOString(),
          last_summary: body.summary ?? `Swept — ${inserted.length} new item(s).`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', true);
      res.status(201).json({ inserted: inserted.length });
      return;
    }

    if (!id || !['approve', 'dismiss'].includes(action)) {
      res.status(400).json({ error: 'id and action (approve|dismiss|create) are required' });
      return;
    }

    const { data: item, error: findErr } = await db.from('inbox_items').select('*').eq('id', id).single();
    if (findErr || !item) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (action === 'dismiss') {
      await db
        .from('inbox_items')
        .update({ state: 'dismissed', resolved_at: new Date().toISOString() })
        .eq('id', id);
      res.status(200).json({ ok: true });
      return;
    }

    // A correction proposes a better finished-time for an existing task. Approving moves
    // the timestamp to the evidenced moment; dismissing keeps Amy's click. Either way she
    // arbitrated — the machine never rewrites her record on its own.
    if (item.kind === 'correction') {
      if (!item.target_todo_id || !item.proposed_completed_at) {
        res.status(400).json({ error: 'Correction item is missing its target or proposal' });
        return;
      }
      const { error: fixErr } = await db
        .from('todos')
        .update({ completed_at: item.proposed_completed_at, completed_source: 'evidence' })
        .eq('id', item.target_todo_id);
      if (fixErr) {
        res.status(500).json({ error: fixErr.message });
        return;
      }
      await db
        .from('inbox_items')
        .update({ state: 'approved', resolved_at: new Date().toISOString(), created_todo_id: item.target_todo_id })
        .eq('id', id);
      res.status(200).json({ ok: true });
      return;
    }

    // Approve — Amy may have edited the title/status before accepting.
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : item.title;

    // A memory proposal becomes a disclosure-ledger entry, not a task.
    if (item.kind === 'memory') {
      const { data: disc, error: discErr } = await db
        .from('disclosures')
        .insert({
          what: title,
          to_whom: item.to_whom ?? null,
          occurred_at: item.received_at,
          source: item.source,
          source_url: item.source_url,
          evidence: item.source_raw,
        })
        .select()
        .single();
      if (discErr) {
        res.status(500).json({ error: discErr.message });
        return;
      }
      await db
        .from('inbox_items')
        .update({ state: 'approved', resolved_at: new Date().toISOString(), created_disclosure_id: disc.id })
        .eq('id', id);
      res.status(201).json({ disclosure: disc });
      return;
    }

    const status = ['todo', 'doing', 'waiting', 'done'].includes(body.status)
      ? body.status
      : item.suggested_status;
    const edited = title !== item.title;

    const { data: todo, error: todoErr } = await db
      .from('todos')
      .insert({
        title,
        description: item.source_context ? `From ${item.source_context}` : null,
        status,
        priority: 'normal',
        source: item.source,
        source_url: item.source_url,
        source_raw: item.source_raw,
        claude_note: item.claude_note,
        story: item.story ?? null,
        edited_from_source: edited,
        received_at: item.received_at,
        // An item approved as "already done" was NOT finished now — stamping it with the
        // current time drops days-old work onto today's calendar. Prefer the instant the
        // sweep actually evidenced; received_at is only a floor, and on a card filed from a
        // meeting it is when the work was *assigned*, which reads as finished-before-started.
        completed_at:
          status === 'done' ? (item.proposed_completed_at ?? item.received_at) : null,
        completed_source: status === 'done' ? 'evidence' : null,
        // Approving straight into doing/pending carries the same side effects a Kanban
        // drag would have applied — the shortcut must not produce a different record.
        started_at: status === 'doing' ? new Date().toISOString() : null,
        waiting_since: status === 'waiting' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (todoErr) {
      res.status(500).json({ error: todoErr.message });
      return;
    }

    await db
      .from('inbox_items')
      .update({ state: 'approved', resolved_at: new Date().toISOString(), created_todo_id: todo.id })
      .eq('id', id);

    res.status(201).json({ todo });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

// --- Recovery. Nothing in this dashboard is ever destroyed: tasks and people carry a
// deleted_at, inbox items carry a 'dismissed' state. This exposes both so a mistake is
// always reversible. Amy lost a person this way once (Maanya, re-added by hand) — that
// is the failure mode this closes. ---
const RECOVER_KINDS = {
  todo: { table: 'todos', restore: { deleted_at: null }, filter: (q) => q.not('deleted_at', 'is', null) },
  person: { table: 'people', restore: { deleted_at: null }, filter: (q) => q.not('deleted_at', 'is', null) },
  inbox: {
    table: 'inbox_items',
    restore: { state: 'pending', resolved_at: null },
    filter: (q) => q.eq('state', 'dismissed'),
  },
};

async function handleRecover(req, res, db) {
  if (req.method === 'GET') {
    const [todos, people, inbox] = await Promise.all([
      db
        .from('todos')
        .select('id, title, status, category, due_date, completed_at, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
      db
        .from('people')
        .select('id, name, role, company, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
      db
        .from('inbox_items')
        .select('id, title, source, source_context, claude_note, received_at, resolved_at')
        .eq('state', 'dismissed')
        .order('resolved_at', { ascending: false }),
    ]);

    const failed = [todos, people, inbox].find((r) => r.error);
    if (failed) {
      res.status(500).json({ error: failed.error.message });
      return;
    }

    res.status(200).json({
      todos: todos.data ?? [],
      people: people.data ?? [],
      inbox: inbox.data ?? [],
    });
    return;
  }

  if (req.method === 'POST') {
    const { kind, id } = req.body ?? {};
    const spec = RECOVER_KINDS[kind];
    if (!spec || !id) {
      res.status(400).json({ error: 'kind and id are required' });
      return;
    }

    const { data, error } = await db
      .from(spec.table)
      .update(spec.restore)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ restored: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

// --- Activity events for the calendar (Amy's "what I did" record), plus meetings
// with the checklist of what was actually discussed. One fetch serves both. ---
async function handleCalendar(req, res, db) {
  if (req.method === 'GET') {
    const [{ data, error }, { data: meetings, error: meetErr }] = await Promise.all([
      db
        .from('activity_events')
        .select('*')
        .is('deleted_at', null)
        .order('event_date', { ascending: false }),
      db
        .from('meetings')
        .select('*, items:meeting_items(id, label, discussed, sort_order, todo_id)')
        .is('deleted_at', null)
        .order('occurred_at', { ascending: false }),
    ]);
    if (error || meetErr) {
      res.status(500).json({ error: (error ?? meetErr).message });
      return;
    }
    // Keep each checklist in the order it was written; Supabase does not sort embeds.
    for (const m of meetings ?? []) {
      m.items?.sort((a, b) => a.sort_order - b.sort_order);
    }
    res.status(200).json({ events: data ?? [], meetings: meetings ?? [] });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || !body.event_date) {
      res.status(400).json({ error: 'title and event_date are required' });
      return;
    }
    const kind = ['meeting', 'action', 'milestone'].includes(body.kind) ? body.kind : 'action';
    const { data, error } = await db
      .from('activity_events')
      .insert({
        title,
        detail: body.detail || null,
        event_date: body.event_date,
        kind,
        source: body.source || null,
        source_url: body.source_url || null,
      })
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json({ event: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

// --- Profile / Memory sections (public or private). ---
async function handleProfile(req, res, db) {
  // Gated by its own passphrase — the shared dashboard passphrase is not enough.
  if (req.method === 'GET') {
    if (!isProfileUnlocked(req)) {
      res.status(403).json({ error: 'locked', locked: true });
      return;
    }
    const [{ data, error }, { data: disclosures }] = await Promise.all([
      db.from('profile_sections').select('*').order('sort_order', { ascending: true }),
      db.from('disclosures').select('*').order('occurred_at', { ascending: false }),
    ]);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ sections: data ?? [], disclosures: disclosures ?? [] });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};

    if (body.action === 'unlock') {
      const { data: gate } = await db.from('profile_gate').select('passphrase_hash').eq('id', true).maybeSingle();
      if (!gate?.passphrase_hash) {
        res.status(500).json({ error: 'Profile gate is not configured' });
        return;
      }
      if (hashPassphrase(body.passphrase ?? '') !== gate.passphrase_hash) {
        res.status(401).json({ error: 'Incorrect passphrase' });
        return;
      }
      setProfileCookie(res, createProfileToken());
      res.status(200).json({ ok: true });
      return;
    }

    if (!isProfileUnlocked(req)) {
      res.status(403).json({ error: 'locked', locked: true });
      return;
    }

    const { id } = body;
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }
    const updates = { updated_at: new Date().toISOString() };
    if (typeof body.heading === 'string') updates.heading = body.heading;
    if (typeof body.body === 'string') updates.body = body.body;
    if (body.visibility === 'public' || body.visibility === 'private') updates.visibility = body.visibility;

    const { data, error } = await db.from('profile_sections').update(updates).eq('id', id).select().single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ section: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

// --- People awareness timeline: every encounter entry (person_notes) joined to its
// person, newest first. This is the primary People view — a feed of who crossed Amy's
// awareness, why, and from where. ---
async function handleFeed(req, res, db) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { data, error } = await db
    .from('person_notes')
    .select(
      'id, person_id, body, source, source_url, activity_type, occurred_at, created_at, ' +
        'people!inner(id, name, verification_tier, crm_type, company, role, deleted_at)',
    )
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const feed = (data ?? [])
    .filter((n) => n.people && !n.people.deleted_at)
    .map((n) => ({
      id: n.id,
      person_id: n.person_id,
      body: n.body,
      source: n.source,
      source_url: n.source_url,
      activity_type: n.activity_type,
      occurred_at: n.occurred_at,
      created_at: n.created_at,
      person: {
        id: n.people.id,
        name: n.people.name,
        verification_tier: n.people.verification_tier,
        crm_type: n.people.crm_type,
        company: n.people.company,
        role: n.people.role,
      },
    }))
    .sort((a, b) => new Date(b.occurred_at || b.created_at) - new Date(a.occurred_at || a.created_at));

  res.status(200).json({ feed });
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
