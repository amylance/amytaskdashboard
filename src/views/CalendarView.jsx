import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCalendarEvents } from '../hooks/useCalendarEvents.js';
import { toPacificDateKey, formatDateTimePT } from '../lib/format.js';
import RecoverStrip, { removedAt } from '../components/RecoverStrip.jsx';
import CalendarSearch from '../components/CalendarSearch.jsx';
import BackButton from '../components/BackButton.jsx';
import { buildCalendarIndex } from '../lib/calendarSearch.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KIND_MARK = { meeting: '🎙', milestone: '✦', action: '•' };

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Calendar = Amy's proof-of-work: what she DID (activity events, on their real dates)
// plus task deadlines (what's coming). Bucketed by day.
export default function CalendarView({ todos, onOpen, config, removed = [], onRestore }) {
  const { events, meetings } = useCalendarEvents(config);
  const [openDay, setOpenDay] = useState(null);
  const [openMeeting, setOpenMeeting] = useState(null);
  const [highlight, setHighlight] = useState(null);
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
      if (!map.has(key)) map.set(key, { meetings: [], events: [], done: [], tasks: [], removed: [] });
      return map.get(key);
    };
    for (const m of meetings) {
      bucket(toPacificDateKey(m.occurred_at)).meetings.push(m);
    }
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
    // A deleted task still belongs to the day it sat on — that is where Amy will look for
    // it. Without this the day empties out completely and becomes unclickable, which would
    // strand the only route back to it.
    for (const todo of removed) {
      const key = todo.completed_at ? toPacificDateKey(todo.completed_at) : todo.due_date;
      if (key) bucket(key).removed.push(todo);
    }
    // Newest first inside a day, so the last thing that happened reads first — except her
    // 1:1s, which hold the top of their day. They are where the work comes from, so she
    // wants them findable at a glance rather than buried under whatever finished latest.
    const desc = (field) => (a, b) => new Date(b[field]) - new Date(a[field]);
    for (const cell of map.values()) {
      cell.meetings.sort((a, b) => {
        if (a.is_one_on_one !== b.is_one_on_one) return a.is_one_on_one ? -1 : 1;
        return new Date(b.occurred_at) - new Date(a.occurred_at);
      });
      cell.done.sort(desc('completed_at'));
      cell.removed.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
    }
    return map;
  }, [events, meetings, todos, removed]);

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

  const searchIndex = useMemo(
    () => buildCalendarIndex({ meetings, events, todos, removed }),
    [meetings, events, todos, removed],
  );

  // Jump: move the month into view, open that day, and light up the row. The ring on the
  // cell fades on its own so the grid does not stay permanently marked, but the row inside
  // the panel stays lit for as long as the panel is open.
  function jumpTo(result) {
    const [y, m] = result.dayKey.split('-').map(Number);
    setCursor(new Date(y, m - 1, 1));
    setOpenDay(result.dayKey);
    setHighlight({ dayKey: result.dayKey, id: result.id, kind: result.kind });
    if (result.kind === 'meeting') {
      const meeting = meetings.find((x) => x.id === result.id);
      if (meeting) setOpenMeeting(meeting);
    }
  }

  useEffect(() => {
    if (!highlight) return undefined;
    const t = setTimeout(() => setHighlight((h) => (h ? { ...h, dayKey: null } : null)), 2600);
    return () => clearTimeout(t);
  }, [highlight]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-[11px] text-ink-muted mt-0.5">
            <span className="mr-3">🎙 meeting</span>
            <span className="mr-3 rounded border-l-2 border-l-clay/60 bg-clay-soft/60 pl-1 pr-1.5">1:1</span>
            <span className="mr-3">✦ milestone</span>
            <span className="mr-3">• what I did</span>
            <span className="mr-3">✓ completed</span>
            <span className="mr-3">○ deadline</span>
            <span className="text-clay">all times PT</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CalendarSearch index={searchIndex} onJump={jumpTo} />
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
          if (!date) return <div key={idx} className="bg-panel min-h-[68px] sm:min-h-[110px]" />;
          const key = toKey(date);
          const cell = byDate.get(key) ?? { meetings: [], events: [], done: [], tasks: [], removed: [] };
          const isToday = key === todayKey;
          const total = cell.meetings.length + cell.events.length + cell.done.length + cell.tasks.length;
          // A day holding only removed items still has to be openable.
          const openable = total + cell.removed.length > 0;
          // Meetings claim the top slots — they are the anchor of a day, and everything
          // else that day usually came out of one.
          const shownMeetings = cell.meetings.slice(0, 4);
          let left = 4 - shownMeetings.length;
          const shownEvents = cell.events.slice(0, Math.max(0, left));
          left -= shownEvents.length;
          const shownDone = cell.done.slice(0, Math.max(0, left));
          left -= shownDone.length;
          const shownTasks = cell.tasks.slice(0, Math.max(0, left));
          const overflow =
            total - shownMeetings.length - shownEvents.length - shownDone.length - shownTasks.length;

          return (
            <div
              key={idx}
              onClick={() => openable && setOpenDay(key)}
              className={`bg-panel min-h-[68px] sm:min-h-[110px] p-1 sm:p-1.5 flex flex-col gap-1 transition-shadow ${
                openable ? 'cursor-pointer hover:bg-black/[0.03]' : ''
              } ${
                highlight?.dayKey === key ? 'ring-2 ring-inset ring-clay bg-clay-soft/40' : ''
              }`}
            >
              <span className="flex items-center gap-1">
                <span
                  className={`self-start font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
                    isToday ? 'bg-ink text-white' : 'text-ink-muted'
                  }`}
                >
                  {date.getDate()}
                </span>
                {/* One faint glyph, not the struck-through row itself — she deleted it to
                    get it out of sight, so the grid stays clean and the day stays findable. */}
                {cell.removed.length > 0 && (
                  <span
                    title={`${cell.removed.length} removed — open to restore`}
                    className="font-mono text-[10px] text-ink-muted/50"
                  >
                    ↺{cell.removed.length}
                  </span>
                )}
              </span>
              {/* A phone gives each day about 50px of width. Item titles are unreadable at
                  that size and every tap lands on an item instead of the day, which is why
                  tapping a day was opening the first task. Mobile shows marks only and the
                  whole cell opens the day sheet. */}
              <div className="sm:hidden flex flex-wrap items-center gap-x-1 leading-none">
                {cell.meetings.slice(0, 2).map((m) => (
                  <span key={m.id} className={`text-[10px] ${m.is_one_on_one ? 'text-clay' : 'text-ink'}`}>
                    🎙
                  </span>
                ))}
                {cell.done.length > 0 && <span className="font-mono text-[10px] text-ink">✓{cell.done.length}</span>}
                {cell.events.length > 0 && <span className="font-mono text-[10px] text-ink">•{cell.events.length}</span>}
                {cell.tasks.length > 0 && (
                  <span className="font-mono text-[10px] text-ink-muted">○{cell.tasks.length}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col gap-0.5 overflow-hidden">
                {shownMeetings.map((m) => (
                  <button
                    key={m.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMeeting(m);
                    }}
                    title={`${m.items?.length ?? 0} things discussed`}
                    className={`tap-scale flex w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-left ${
                      m.is_one_on_one
                        ? 'border-l-2 border-l-clay/60 bg-clay-soft/60 hover:bg-clay-soft'
                        : 'hover:bg-black/[0.05]'
                    } ${m.is_upcoming ? 'text-ink-muted italic' : 'text-ink font-medium'}`}
                  >
                    <span className="shrink-0">🎙</span>
                    <span className="truncate">{m.title}</span>
                    {/* The one detail worth keeping: how much was discussed, so a heavy
                        meeting is distinguishable from a five-minute one before opening it. */}
                    {(m.items?.length ?? 0) > 0 && (
                      <span className="ml-auto shrink-0 font-mono text-[9px] text-ink-muted/70">
                        {m.items.length}
                      </span>
                    )}
                  </button>
                ))}
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
          cell={byDate.get(openDay) ?? { meetings: [], events: [], done: [], tasks: [], removed: [] }}
          onClose={() => setOpenDay(null)}
          onOpen={onOpen}
          onOpenMeeting={setOpenMeeting}
          removed={byDate.get(openDay)?.removed ?? []}
          onRestore={onRestore}
          highlightId={highlight?.id ?? null}
        />
      )}

      {openMeeting && <MeetingPanel meeting={openMeeting} onClose={() => setOpenMeeting(null)} />}
    </div>
  );
}

// Click a meeting → the checklist of what was actually discussed. This is the thing Amy
// asked for: go back to any meeting and see the points covered, not just that it happened.
function MeetingPanel({ meeting, onClose }) {
  const items = meeting.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 frosted overlay-in" onClick={onClose} />
      <div className="glass-panel relative slide-in-panel w-full max-w-md h-full border-l flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-hairline shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">🎙 {meeting.title}</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              {formatDateTimePT(meeting.occurred_at)}
              {meeting.with_whom && <> · {meeting.with_whom}</>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="tap-scale shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:bg-black/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {meeting.is_upcoming && (
            <p className="rounded-lg border border-dashed border-hairline px-3 py-2 text-[11px] text-ink-muted">
              Hasn&apos;t happened yet. This fills in once the recording is processed.
            </p>
          )}

          {meeting.summary && <p className="text-sm text-ink leading-relaxed">{meeting.summary}</p>}

          {items.length > 0 && (
            <Group title={`What was discussed (${items.length})`}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg border border-hairline bg-panel px-3 py-2"
                >
                  <span className="shrink-0 text-emerald-600 text-[11px] leading-5">✓</span>
                  <p className="text-[13px] text-ink leading-snug">{item.label}</p>
                </div>
              ))}
            </Group>
          )}

          {meeting.source_url && (
            <a
              href={meeting.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-clay hover:underline"
            >
              Open the full recording →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Click a day → the wrap-up: what happened, what was finished (and when it was first
// asked of her), and what's due. This is the "index" Amy wanted — go back to any day and
// see what was actually discussed and closed.
const LIT = 'ring-2 ring-clay bg-clay-soft/50';

function DayPanel({ dayKey, cell, onClose, onOpen, onOpenMeeting, removed = [], onRestore, highlightId }) {
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
          <BackButton onClose={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {cell.meetings.length > 0 && (
            <Group title={`Meetings (${cell.meetings.length})`}>
              {cell.meetings.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onOpenMeeting(m)}
                  className={`tap-scale w-full text-left rounded-lg border border-hairline px-3 py-2 ${
                    m.is_one_on_one ? 'border-l-2 border-l-clay/60 bg-clay-soft/60' : 'bg-panel'
                  } ${highlightId === m.id ? LIT : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-ink truncate">🎙 {m.title}</p>
                    <span className="shrink-0 text-[10px] font-mono text-ink-muted">
                      {m.items?.length ?? 0} points
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {formatDateTimePT(m.occurred_at)}
                    {m.with_whom && <> · {m.with_whom}</>}
                  </p>
                </button>
              ))}
            </Group>
          )}

          {cell.events.length > 0 && (
            <Group title="What happened">
              {cell.events.map((ev) => (
                <div
                  key={ev.id}
                  className={`rounded-lg border border-hairline bg-panel px-3 py-2 ${
                    highlightId === ev.id ? LIT : ''
                  }`}
                >
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
                  className={`tap-scale w-full text-left rounded-lg border border-hairline bg-panel px-3 py-2 ${
                    highlightId === t.id ? LIT : ''
                  }`}
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
                  className={`tap-scale w-full text-left rounded-lg border border-hairline bg-panel px-3 py-2 ${
                    highlightId === t.id ? LIT : ''
                  }`}
                >
                  <p className="text-sm text-ink">○ {t.title}</p>
                  {t.waiting_on && (
                    <p className="text-[11px] text-violet-700 mt-0.5">⏳ waiting on {t.waiting_on}</p>
                  )}
                </button>
              ))}
            </Group>
          )}

          <RecoverStrip
            items={removed}
            noun="entry"
            onRestore={onRestore}
            describe={removedAt}
            highlightId={highlightId}
          />
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
