import { useMemo, useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { usePending } from '../hooks/usePending.js';

// The per-page "Pending" corner note: dashboard items waiting on approval / access /
// a conversation with Isaac. Collapsible, lower-right. Shows items for the current
// page's scope plus anything global.
export default function PendingNote({ config, scope }) {
  const { pending } = usePending(config);
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => pending.filter((p) => p.scope === scope || p.scope === 'global'),
    [pending, scope],
  );

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-30 w-72 max-w-[calc(100vw-2rem)]">
      <div className="glass-panel rounded-2xl overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="tap-scale w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink">
            <Clock size={13} className="text-clay" /> Pending · {items.length}
          </span>
          {open ? (
            <ChevronDown size={14} className="text-ink-muted" />
          ) : (
            <ChevronUp size={14} className="text-ink-muted" />
          )}
        </button>

        {open && (
          <div className="px-3.5 pb-3 flex flex-col gap-2">
            {items.map((it) => (
              <div key={it.id} className="rounded-lg border border-hairline bg-panel/70 px-3 py-2">
                <p className="text-sm font-medium text-ink">{it.title}</p>
                {it.reason && <p className="text-xs text-ink-muted mt-0.5">{it.reason}</p>}
                {it.blocked_on && (
                  <p className="text-[11px] font-mono text-clay mt-1">waiting on: {it.blocked_on}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
