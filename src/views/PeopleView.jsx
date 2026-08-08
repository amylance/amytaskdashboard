import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, BadgeCheck, HelpCircle, Database, ExternalLink } from 'lucide-react';
import { api } from '../lib/api.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';
import { formatDateTime } from '../lib/format.js';

const SOURCE_LABEL = { app: 'App', slack: 'Slack', fireflies: 'Fireflies', email: 'Email' };
const ACTIVITY_LABEL = {
  meeting: 'Meeting',
  slack_thread: 'Slack thread',
  slack_message: 'Slack message',
  email: 'Email',
  note: 'Note',
};

// People = an awareness timeline: a feed of who crossed Amy's awareness, why, and from
// where — newest first — with a verified/unverified badge and a clickable source link.
export default function PeopleView({ people, onOpen, config }) {
  const [feed, setFeed] = useState([]);
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all'); // all | verified | unverified

  const refresh = useCallback(async () => {
    try {
      const { feed } = await api.getPeopleFeed();
      setFeed(feed ?? []);
    } catch {
      // ignore
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.filter((e) => {
      const t = e.person?.verification_tier === 'verified' ? 'verified' : 'unverified';
      if (tier !== 'all' && t !== tier) return false;
      if (!q) return true;
      return [e.person?.name, e.body, e.person?.company, e.person?.role]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [feed, query, tier]);

  const verifiedCount = people.filter((p) => p.verification_tier === 'verified').length;
  const unverifiedCount = people.filter((p) => p.verification_tier !== 'verified').length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative max-w-sm w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the timeline…"
            className="w-full rounded-full border border-hairline bg-panel pl-9 pr-4 py-2 text-sm outline-none focus:border-ink/30"
          />
        </div>
        <button
          disabled
          title="Available after connecting lance.live/internal with Isaac (Mon)"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel px-3.5 py-2 text-sm text-ink-muted opacity-50 cursor-not-allowed"
        >
          <Database size={14} />
          Populate the GM CRM?
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-5">
        <TierChip label="All" active={tier === 'all'} onClick={() => setTier('all')} count={verifiedCount + unverifiedCount} />
        <TierChip
          label="Verified"
          active={tier === 'verified'}
          onClick={() => setTier('verified')}
          count={verifiedCount}
          icon={<BadgeCheck size={11} className="text-emerald-600" />}
        />
        <TierChip
          label="Unverified"
          active={tier === 'unverified'}
          onClick={() => setTier('unverified')}
          count={unverifiedCount}
          icon={<HelpCircle size={11} className="text-clay" />}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-ink-muted text-center py-16 border border-dashed border-hairline rounded-2xl">
          {feed.length === 0
            ? 'No one has crossed your awareness yet — add a person, or mention someone to Claude in Slack.'
            : 'No matches.'}
        </div>
      ) : (
        <ol className="relative border-l border-hairline ml-2 flex flex-col gap-4 pl-6">
          {filtered.map((e) => (
            <TimelineEntry key={e.id} entry={e} onOpen={onOpen} />
          ))}
        </ol>
      )}
    </div>
  );
}

function TierChip({ label, active, onClick, count, icon }) {
  return (
    <button
      onClick={onClick}
      className={`tap-scale inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        active ? 'border-ink bg-ink text-white' : 'border-hairline bg-panel text-ink-muted hover:text-ink'
      }`}
    >
      {icon}
      {label}
      <span className={`font-mono text-[10px] ${active ? 'text-white/70' : 'text-ink-muted'}`}>{count}</span>
    </button>
  );
}

function TimelineEntry({ entry, onOpen }) {
  const verified = entry.person?.verification_tier === 'verified';
  const when = entry.occurred_at ?? entry.created_at;

  return (
    <li className="relative">
      <span
        className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-backdrop ${
          verified ? 'bg-emerald-500' : 'bg-clay'
        }`}
      />
      <div
        onClick={() => onOpen(entry.person_id)}
        className="tap-scale cursor-pointer rounded-xl border border-hairline bg-panel p-4 hover:bg-black/[0.03]"
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-ink truncate">{entry.person?.name}</h3>
            <span
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                verified ? 'bg-emerald-500/10 text-emerald-700' : 'bg-clay-soft text-clay'
              }`}
            >
              {verified ? <BadgeCheck size={10} /> : <HelpCircle size={10} />}
              {verified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-mono text-ink-muted">{formatDateTime(when)}</span>
        </div>

        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-ink-muted">
          <span>{SOURCE_LABEL[entry.source] ?? 'App'}</span>
          {entry.activity_type && <span>· {ACTIVITY_LABEL[entry.activity_type] ?? entry.activity_type}</span>}
        </div>

        <p className="text-sm text-ink whitespace-pre-wrap">{entry.body}</p>

        {entry.source_url && (
          <a
            href={entry.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={(ev) => ev.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-clay hover:underline"
          >
            <ExternalLink size={11} /> Open source
          </a>
        )}
      </div>
    </li>
  );
}
