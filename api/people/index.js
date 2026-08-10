import { requireAuth, requireEditor } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET' && !requireEditor(req, res)) return;
  const db = supabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('people')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ people: data });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const { data, error } = await db
      .from('people')
      .insert({
        name,
        company: body.company || null,
        role: body.role || null,
        phone: body.phone || null,
        email: body.email || null,
        // Guardrail: anyone added manually defaults to UNVERIFIED. Nothing auto-promotes.
        verification_tier: body.verification_tier === 'verified' ? 'verified' : 'unverified',
        verification_source: body.verification_source || null,
        crm_type: body.crm_type === 'lance_team' ? 'lance_team' : 'hotel_contact',
        department: body.department || null,
        reports_to: body.reports_to || null,
        location: body.location || null,
        source_url: body.source_url || null,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const firstNote = typeof body.note === 'string' ? body.note.trim() : '';
    if (firstNote) {
      await db.from('person_notes').insert({ person_id: data.id, body: firstNote, source: 'app' });
    }

    res.status(201).json({ person: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
