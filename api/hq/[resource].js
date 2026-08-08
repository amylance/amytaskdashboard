import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

// Consolidated HQ endpoint. Handles both the away/status log and the pending notes
// from a single serverless function, to stay under Vercel's 12-function limit.
// Routes: /api/hq/status  ·  /api/hq/pending
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();
  const { resource } = req.query;

  if (resource === 'status') return handleStatus(req, res, db);
  if (resource === 'pending') return handlePending(req, res, db);
  if (resource === 'feed') return handleFeed(req, res, db);
  if (resource === 'profile') return handleProfile(req, res, db);
  if (resource === 'calendar') return handleCalendar(req, res, db);

  res.status(404).json({ error: 'Not found' });
  return undefined;
}

// --- Activity events for the calendar (Amy's "what I did" record). ---
async function handleCalendar(req, res, db) {
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('activity_events')
      .select('*')
      .order('event_date', { ascending: false });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ events: data ?? [] });
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
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('profile_sections')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ sections: data ?? [] });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
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
