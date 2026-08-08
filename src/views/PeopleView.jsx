import { useMemo, useState } from 'react';
import { Search, BadgeCheck, HelpCircle, Database } from 'lucide-react';
import PersonCard from '../components/PersonCard.jsx';

export default function PeopleView({ people, onOpen }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) =>
      [p.name, p.company, p.role, p.phone, p.email, p.department]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [people, query]);

  const verified = filtered.filter((p) => p.verification_tier === 'verified');
  const unverified = filtered.filter((p) => p.verification_tier !== 'verified');

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="relative max-w-sm w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-full border border-hairline bg-panel pl-9 pr-4 py-2 text-sm outline-none focus:border-ink/30"
          />
        </div>

        {/* Gated action — lights up only once lance.live/internal is connected (see the Pending note). */}
        <button
          disabled
          title="Available after connecting lance.live/internal with Isaac (Mon)"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel px-3.5 py-2 text-sm text-ink-muted opacity-50 cursor-not-allowed"
        >
          <Database size={14} />
          Populate the GM CRM?
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-ink-muted text-center py-16 border border-dashed border-hairline rounded-2xl">
          {people.length === 0
            ? 'No people logged yet — add one, or mention someone to Claude in Slack.'
            : 'No matches.'}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <Section
            icon={<BadgeCheck size={13} className="text-emerald-600" />}
            title="Verified"
            count={verified.length}
            people={verified}
            onOpen={onOpen}
            emptyLabel="No verified people yet."
          />
          <Section
            icon={<HelpCircle size={13} className="text-clay" />}
            title="Unverified — needs confirmation"
            count={unverified.length}
            people={unverified}
            onOpen={onOpen}
            emptyLabel="Nothing unverified."
          />
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, count, people, onOpen, emptyLabel }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
        <span className="text-[11px] font-mono text-ink-muted">{count}</span>
      </div>
      {people.length === 0 ? (
        <p className="text-xs text-ink-muted">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} onClick={() => onOpen(person.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
