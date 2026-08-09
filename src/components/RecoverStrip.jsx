import { useState } from 'react';
import { RotateCcw, ChevronRight } from 'lucide-react';
import { formatDateTimePT } from '../lib/format.js';

// You look for a lost thing in the room you lost it in — not a central trash can you have
// to remember exists. This renders only when there is something to recover, so an empty
// state costs nothing. That is the whole reason it isn't a tab.
export default function RecoverStrip({ items, noun, onRestore, describe, highlightId }) {
  const [open, setOpen] = useState(false);

  // If search lands on something removed, the strip has to open itself — otherwise the
  // result is "found" but still invisible behind a collapsed row.
  const hit = highlightId && items?.some((i) => i.id === highlightId);
  const expanded = open || hit;

  if (!items || items.length === 0) return null;

  const label = items.length === 1 ? noun : `${noun}s`;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="tap-scale inline-flex items-center gap-1.5 text-[11px] text-ink-muted hover:text-ink"
      >
        <span>
          {items.length} {label} removed
        </span>
        <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 rounded-lg border border-dashed border-hairline px-3 py-2 ${
                highlightId === item.id ? 'ring-2 ring-clay bg-clay-soft/50' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-[13px] text-ink-muted line-through truncate">
                  {item.title ?? item.name}
                </p>
                {describe?.(item) && (
                  <p className="text-[10px] text-ink-muted mt-0.5">{describe(item)}</p>
                )}
              </div>
              <button
                onClick={() => onRestore(item)}
                className="tap-scale shrink-0 inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-ink hover:bg-black/5"
              >
                <RotateCcw size={11} />
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function removedAt(item) {
  const when = item.deleted_at ?? item.resolved_at;
  return when ? `removed ${formatDateTimePT(when)}` : null;
}
