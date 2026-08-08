import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarEvents } from '../hooks/useCalendarEvents.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KIND_MARK = { meeting: '🎙', milestone: '✦', action: '•' };

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Calendar = Amy's proof-of-work: what she DID (activity events, on their real dates)
// plus task deadlines (what's coming). Bucketed by day.
export default function CalendarView({ todos, onOpen, config }) {
  const { events } = useCalendarEvents(config);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const byDate = useMemo(() => {
    const map = new Map();
    const bucket = (key) => {
      if (!map.has(key)) map.set(key, { events: [], tasks: [] });
      return map.get(key);
    };
    for (const ev of events) {
      if (ev.event_date) bucket(ev.event_date).events.push(ev);
    }
    for (const todo of todos) {
      if (todo.due_date && todo.status !== 'done') bucket(todo.due_date).tasks.push(todo);
    }
    return map;
  }, [events, todos]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < startOffset; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) out.push(new Date(year, month, day));
    return out;
  }, [cursor]);

  const todayKey = toKey(new Date());

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-[11px] text-ink-muted mt-0.5">
            <span className="mr-3">🎙 meeting</span>
            <span className="mr-3">✦ milestone</span>
            <span className="mr-3">• what I did</span>
            <span>○ deadline</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="tap-scale inline-flex items-center justify-center w-8 h-8 rounded-full border border-hairline hover:bg-black/5"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="tap-scale inline-flex items-center justify-center w-8 h-8 rounded-full border border-hairline hover:bg-black/5"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-hairline border border-hairline rounded-2xl overflow-hidden">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-backdrop py-2 text-center text-xs font-semibold text-ink-muted">
            {w}
          </div>
        ))}
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} className="bg-panel min-h-[110px]" />;
          const key = toKey(date);
          const cell = byDate.get(key) ?? { events: [], tasks: [] };
          const isToday = key === todayKey;
          const total = cell.events.length + cell.tasks.length;
          const shownEvents = cell.events.slice(0, 4);
          const remainingSlots = Math.max(0, 4 - shownEvents.length);
          const shownTasks = cell.tasks.slice(0, remainingSlots);
          const overflow = total - shownEvents.length - shownTasks.length;

          return (
            <div key={idx} className="bg-panel min-h-[110px] p-1.5 flex flex-col gap-1">
              <span
                className={`self-start font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
                  isToday ? 'bg-ink text-white' : 'text-ink-muted'
                }`}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {shownEvents.map((ev) => {
                  const inner = (
                    <>
                      <span className="shrink-0">{KIND_MARK[ev.kind] ?? '•'}</span>
                      <span className="truncate">{ev.title}</span>
                    </>
                  );
                  return ev.source_url ? (
                    <a
                      key={ev.id}
                      href={ev.source_url}
                      target="_blank"
                      rel="noreferrer"
                      title={ev.detail || ev.title}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-ink hover:bg-black/[0.05]"
                    >
                      {inner}
                    </a>
                  ) : (
                    <span
                      key={ev.id}
                      title={ev.detail || ev.title}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-ink"
                    >
                      {inner}
                    </span>
                  );
                })}
                {shownTasks.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => onOpen(todo.id)}
                    title="Deadline"
                    className="tap-scale flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-ink-muted hover:bg-black/[0.05] text-left"
                  >
                    <span className="shrink-0">○</span>
                    <span className="truncate">{todo.title}</span>
                  </button>
                ))}
                {overflow > 0 && <span className="text-[10px] text-ink-muted px-1.5">+{overflow} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
