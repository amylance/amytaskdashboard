import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCalendarEvents } from '../hooks/useCalendarEvents.js';
import { toPacificDateKey, formatDateTimePT } from '../lib/format.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KIND_MARK = { meeting: '🎙', milestone: '✦', action: '•' };

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Calendar = Amy's proof-of-work: what she DID (activity events, on their real dates)
// plus task deadlines (what's coming). Bucketed by day.
export default function CalendarView({ todos, onOpen, config }) {
  const { events } = useCalendarEvents(config);
  const [openDay, setOpenDay] = useState(null);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // The calendar only shows what actually happened: meetings + completed work
  // (on the day it was finished) + upcoming deadlines. Nothing speculative.
  const byDate = useMemo(() => {
    const map = new Map();
    const bucket = (key) => {
      if (!map.has(key)) map.set(key, { events: [], done: [], tasks: [] });
      return map.get(key);
    };
    for (const ev of events) {
      if (ev.event_date) bucket(ev.event_date).events.push(ev);
    }
    for (const todo of todos) {
      if (todo.status === 'done' && todo.completed_at) {
        bucket(toPacificDateKey(todo.completed_at)).done.push(todo);
      } else if (todo.due_date && todo.status !== 'done') {
        bucket(todo.due_date).tasks.push(todo);
      }
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

  // "Today" is the Lance team's day (Pacific), not the browser's. Amy works from the
  // Philippines, 15 hours ahead — her Sunday 1am is still Saturday in SF, and the
  // dashboard is a shared surface.
  const todayKey = toPacificDateKey(new Date());

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
            <span className="mr-3">✓ completed</span>
            <span className="mr-3">○ deadline</span>
            <span className="text-clay">all times PT</span>
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
          const cell = byDate.get(key) ?? { events: [], done: [], tasks: [] };
          const isToday = key === todayKey;
          const total = cell.events.length + cell.done.length + cell.tasks.length;
          const shownEvents = cell.events.slice(0, 4);
          const shownDone = cell.done.slice(0, Math.max(0, 4 - shownEvents.length));
          const shownTasks = cell.tasks.slice(0, Math.max(0, 4 - shownEvents.length - shownDone.length));
          const overflow = total - shownEvents.length - shownDone.length - shownTasks.length;

          return (
            <div
              key={idx}
              onClick={() => total > 0 && setOpenDay(key)}
              className={`bg-panel min-h-[110px] p-1.5 flex flex-col gap-1 ${
                total > 0 ? 'cursor-pointer hover:bg-black/[0.03]' : ''
              }`}
            >
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
                {shownDone.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => onOpen(todo.id)}
                    title="Completed"
                    className="tap-scale flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-ink hover:bg-black/[0.05] text-left"
                  >
                    <span className="shrink-0">✓</span>
                    <span className="truncate">{todo.title}</span>
                  </button>
                ))}
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

      {openDay && (
        <DayPanel
          dayKey={openDay}
          cell={byDate.get(openDay) ?? { events: [], done: [], tasks: [] }}
          onClose={() => setOpenDay(null)}
          onOpen={onOpen}
        />
      )}
    </div>
  );
}

// Click a day → the wrap-up: what happened, what was finished (and when it was first
// asked of her), and what's due. This is the "index" Amy wanted — go back to any day and
// see what was actually discussed and closed.
function DayPanel({ dayKey, cell, onClose, onOpen }) {
  const label = new Date(`${dayKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 frosted overlay-in" onClick={onClose} />
      <div className="glass-panel relative slide-in-panel w-full max-w-md h-full border-l flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline shrink-0">
          <h2 className="text-sm font-semibold text-ink">{label}</h2>
          <button
            onClick={onClose}
            className="tap-scale inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:bg-black/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {cell.events.length > 0 && (
            <Group title="What happened">
              {cell.events.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-hairline bg-panel px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-ink">
                      {KIND_MARK[ev.kind] ?? '•'} {ev.title}
                    </p>
                    {ev.source_url && (
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-[11px] text-clay hover:underline"
                      >
                        open
                      </a>
                    )}
                  </div>
                  {ev.detail && <p className="text-[11px] text-ink-muted mt-1">{ev.detail}</p>}
                </div>
              ))}
            </Group>
          )}

          {cell.done.length > 0 && (
            <Group title={`Finished (${cell.done.length})`}>
              {cell.done.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onOpen(t.id)}
                  className="tap-scale w-full text-left rounded-lg border border-hairline bg-panel px-3 py-2"
                >
                  <p className="text-sm text-ink">✓ {t.title}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {t.received_at && <>asked {formatDateTimePT(t.received_at)} · </>}
                    done {formatDateTimePT(t.completed_at)}
                  </p>
                </button>
              ))}
            </Group>
          )}

          {cell.tasks.length > 0 && (
            <Group title={`Due (${cell.tasks.length})`}>
              {cell.tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onOpen(t.id)}
                  className="tap-scale w-full text-left rounded-lg border border-hairline bg-panel px-3 py-2"
                >
                  <p className="text-sm text-ink">○ {t.title}</p>
                  {t.waiting_on && (
                    <p className="text-[11px] text-violet-700 mt-0.5">⏳ waiting on {t.waiting_on}</p>
                  )}
                </button>
              ))}
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
