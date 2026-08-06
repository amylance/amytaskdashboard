import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PersonCard from '../components/PersonCard.jsx';

export default function PeopleView({ people, onOpen }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) =>
      [p.name, p.company, p.role, p.phone, p.email].filter(Boolean).some((v) => v.toLowerCase().includes(q)),
    );
  }, [people, query]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people…"
          className="w-full rounded-full border border-hairline bg-panel pl-9 pr-4 py-2 text-sm outline-none focus:border-ink/30"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((person) => (
          <PersonCard key={person.id} person={person} onClick={() => onOpen(person.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-ink-muted text-center py-16 border border-dashed border-hairline rounded-2xl">
          {people.length === 0 ? 'No people yet — add one, or mention someone to Claude in Slack.' : 'No matches.'}
        </div>
      )}
    </div>
  );
}
