import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { formatDateTimePT, formatLocal, toPacificDateKey } from '../lib/format.js';
import { sourceOf, statusOf } from '../lib/visuals.js';

function dayLabel(key) {
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Timeline = the RECEIVED log: when each task landed on Amy's plate, newest first.
// This is the view that answers "when was this given to me?" without digging through Slack.
export default function TimelineView({ todos, onOpen }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const todo of todos) {
      const stamp = todo.received_at ?? todo.created_at;
      if (!stamp) continue;
      const key = toPacificDateKey(stamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(todo);
    }
    for (const items of map.values()) {
      items.sort(
        (a, b) => new Date(b.received_at ?? b.created_at) - new Date(a.received_at ?? a.created_at),
      );
    }
    return [...map.entries()].sort(([a], [b]) => (a > b ? -1 : a < b ? 1 : 0));
  }, [todos]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink">When this landed on my plate</h2>
        <p className="text-[11px] text-ink-muted mt-0.5">
          Every task at the moment it was given — newest first, on Pacific time.
        </p>
      </div>

      <div className="relative border-l border-hairline ml-2">
        {groups.map(([key, items]) => (
          <div key={key} className="relative pl-6 pb-7">
            <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-ink" />
            <h3 className="text-sm font-semibold text-ink mb-2.5">{dayLabel(key)}</h3>
            <div className="flex flex-col gap-2">
              {items.map((todo) => {
                const stamp = todo.received_at ?? todo.created_at;
                const src = sourceOf(todo.source);
                const st = statusOf(todo.status);
                const isDone = todo.status === 'done';
                return (
                  <button
                    key={todo.id}
                    onClick={() => onOpen(todo.id)}
                    className={`tap-scale relative overflow-hidden text-left rounded-xl border border-hairline bg-panel p-3 pl-4 hover:bg-black/[0.03] ${
                      isDone ? 'opacity-65' : ''
                    }`}
                  >
                    <span className={`absolute left-0 top-0 bottom-0 w-1 ${st.bar}`} aria-hidden />
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-ink-muted">
                        <span aria-hidden>{src.mark}</span>
                        {src.label}
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted" title={formatLocal(stamp)}>
                        {formatDateTimePT(stamp)}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${isDone ? 'text-ink-muted line-through' : 'text-ink'}`}>
                      {todo.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] ${st.text}`}>
                        <span aria-hidden>{st.mark}</span>
                        {st.label}
                      </span>
                      {todo.source_url && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-clay">
                          <ExternalLink size={9} /> source
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="pl-6 text-sm text-ink-muted">Nothing received yet.</p>}
      </div>
    </div>
  );
}
