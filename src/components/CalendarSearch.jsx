import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchCalendar } from '../lib/calendarSearch.js';

const KIND_LABEL = {
  meeting: 'Meeting',
  event: 'Activity',
  done: 'Finished',
  due: 'Due',
  removed: 'Removed',
};

function dayLabel(dayKey) {
  return new Date(`${dayKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// "I remember something but not when." Type a fragment, get every month at once, jump
// straight to the day with the item lit up.
export default function CalendarSearch({ index, onJump }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef(null);

  const results = useMemo(() => searchCalendar(index, query), [index, query]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    function onClickAway(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setQuery('');
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  function choose(result) {
    onJump(result);
    setQuery('');
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') return setQuery('');
    if (!results.length) return undefined;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[cursor]);
    }
    return undefined;
  }

  const showEmpty = query.trim().length >= 2 && results.length === 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-xs">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Find anything on the calendar…"
        className="w-full rounded-full border border-hairline bg-panel pl-9 pr-8 py-2 text-sm outline-none focus:border-ink/30"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-5 h-5 rounded-full text-ink-muted hover:bg-black/10"
        >
          <X size={12} />
        </button>
      )}

      {(results.length > 0 || showEmpty) && (
        <div className="absolute z-30 mt-1.5 w-full min-w-[22rem] rounded-xl border border-hairline bg-panel shadow-lg overflow-hidden">
          {showEmpty ? (
            <p className="px-4 py-3 text-[12px] text-ink-muted">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => choose(r)}
                onMouseEnter={() => setCursor(i)}
                className={`w-full text-left px-3.5 py-2.5 border-b border-hairline last:border-0 ${
                  i === cursor ? 'bg-black/[0.05]' : ''
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-ink truncate">
                    <span className="mr-1.5">{r.mark}</span>
                    {r.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-ink-muted">
                    {dayLabel(r.dayKey)}
                  </span>
                </div>
                <p className="text-[10px] text-ink-muted mt-0.5 truncate">
                  {KIND_LABEL[r.kind]}
                  {r.subtitle && <> · {r.subtitle}</>}
                  {r.excerpt && <> · {r.excerpt}</>}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
