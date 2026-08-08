import { useState } from 'react';
import { useStatus } from '../hooks/useStatus.js';

// General away/status toggle with a dog-walk preset. Each change logs a status_event,
// so the record accumulates into a living picture of Amy's rhythm (transparency).
const PRESETS = [
  { status: 'walking_dogs', label: 'Walking the dogs', emoji: '🐕' },
  { status: 'away', label: 'Away', emoji: '🚶' },
  { status: 'focus', label: 'Heads-down', emoji: '🎧' },
];

export default function StatusToggle({ config }) {
  const { current, setStatus } = useStatus(config);
  const [open, setOpen] = useState(false);
  const active = Boolean(current);
  const label = current?.label || (current ? current.status : 'Available');

  async function choose(payload) {
    setOpen(false);
    await setStatus(payload);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="tap-scale inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel px-3 py-1.5 text-xs font-medium text-ink"
      >
        <span className={`w-2 h-2 rounded-full ${active ? 'bg-clay' : 'bg-emerald-500'}`} />
        {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-52 glass-panel rounded-xl p-1.5 slide-in-panel">
            {active && (
              <button
                onClick={() => choose({ status: 'available' })}
                className="tap-scale w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-black/5 text-left"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> I&apos;m back (Available)
              </button>
            )}
            {PRESETS.map((p) => (
              <button
                key={p.status}
                onClick={() => choose(p)}
                className="tap-scale w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-black/5 text-left"
              >
                <span aria-hidden>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
