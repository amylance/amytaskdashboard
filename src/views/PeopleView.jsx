import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, BadgeCheck, HelpCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';
import { formatDateTimePT } from '../lib/format.js';
import { sourceOf, statusOf } from '../lib/visuals.js';

// People Amy works with daily — she doesn't need reminding who they are, so they stay out
// of the awareness log. Their value here is "what's open with them".
const CORE_TEAM = ['Gavin Brennen', 'Isaac Gutierrez', 'Caleb Chan'];

// People = where names crossed Amy's awareness, grouped by the tool they came from, then
// by date, newest first. Collapsed to a count; click to see who.
export default function PeopleView({ people, todos = [], onOpen, onOpenTodo, config }) {
  const [feed, setFeed] = useState([]);
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState({});

  const refresh = useCallback(async () => {
    try {
      const { feed } = await api.getPeopleFeed();
      setFeed(feed ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config) return undefined;
    const client = getSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
    const channel = client
      .channel('people-feed-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'person_notes' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, () => refresh())
      .subscribe();
    return () => client.removeChannel(channel);
  }, [config, refresh]);

  // Group: source tool → date → the people who surfaced there.
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = feed.filter((e) => {
      if (CORE_TEAM.includes(e.person?.name)) return false;
      if (!q) return true;
      return [e.person?.name, e.body, e.person?.company, e.person?.role]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });

    const bySource = new Map();
    for (const e of rows) {
      const src = e.source ?? 'app';
      const when = e.occurred_at ?? e.created_at;
      const day = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(when));

      if (!bySource.has(src)) bySource.set(src, new Map());
      const days = bySource.get(src);
      if (!days.has(day)) days.set(day, { day, context: e.source_context ?? null, entries: [] });
      days.get(day).entries.push(e);
    }

    return [...bySource.entries()]
      .map(([source, days]) => ({
        source,
        days: [...days.values()].sort((a, b) => (a.day > b.day ? -1 : 1)),
        total: [...days.values()].reduce((n, d) => n + d.entries.length, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [feed, query]);

  const verifiedCount = people.filter((p) => p.verification_tier === 'verified').length;
  const unverifiedCount = people.filter((p) => p.verification_tier !== 'verified').length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-full border border-hairline bg-panel pl-9 pr-4 py-2 text-sm outline-none focus:border-ink/30"
          />
        </div>
        <p className="text-[11px] text-ink-muted mt-2">
          <BadgeCheck size={11} className="inline text-emerald-600" /> {verifiedCount} verified ·{' '}
          <HelpCircle size={11} className="inline text-clay" /> {unverifiedCount} still to confirm
        </p>
      </div>

      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">
        Where names came from
      </h2>

      {grouped.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-12 border border-dashed border-hairline rounded-2xl">
          No one new has crossed your awareness yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map((g) => {
            const src = sourceOf(g.source);
            return (
              <div key={g.source}>
                <h3 className="text-sm font-medium text-ink mb-1.5">
                  <span aria-hidden className="mr-1">
                    {src.mark}
                  </span>
                  {src.label}
                  <span className="ml-2 font-mono text-[11px] text-ink-muted">{g.total}</span>
                </h3>
                <div className="flex flex-col gap-1.5">
                  {g.days.map((d) => {
                    const id = `${g.source}-${d.day}`;
                    const open = openGroups[id];
                    return (
                      <div key={id} className="rounded-xl border border-hairline bg-panel overflow-hidden">
                        <button
                          onClick={() => setOpenGroups((o) => ({ ...o, [id]: !o[id] }))}
                          className="tap-scale w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left"
                        >
                          <span className="text-sm text-ink">
                            {new Date(`${d.day}T12:00:00`).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {d.context && <span className="text-ink-muted"> · {d.context}</span>}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                            {d.entries.length} {d.entries.length === 1 ? 'name' : 'names'}
                            <ChevronRight
                              size={13}
                              className={`transition-transform ${open ? 'rotate-90' : ''}`}
                            />
                          </span>
                        </button>

                        {open && (
                          <div className="px-4 pb-3 flex flex-col gap-2 border-t border-hairline pt-2.5">
                            {d.entries.map((e) => {
                              const verified = e.person?.verification_tier === 'verified';
                              return (
                                <button
                                  key={e.id}
                                  onClick={() => onOpen(e.person_id)}
                                  className="tap-scale text-left rounded-lg border border-hairline px-3 py-2 hover:bg-black/[0.03]"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <span className="inline-flex items-center gap-1.5 min-w-0">
                                      <span className="text-sm font-medium text-ink truncate">
                                        {e.person?.name}
                                      </span>
                                      <span
                                        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                                          verified
                                            ? 'bg-emerald-500/10 text-emerald-700'
                                            : 'bg-clay-soft text-clay'
                                        }`}
                                      >
                                        {verified ? <BadgeCheck size={9} /> : <HelpCircle size={9} />}
                                        {verified ? 'Verified' : 'To confirm'}
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-[10px] font-mono text-ink-muted">
                                      {formatDateTimePT(e.occurred_at ?? e.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-ink-muted">{e.body}</p>
                                  {e.source_url && (
                                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-clay">
                                      <ExternalLink size={9} /> source
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
