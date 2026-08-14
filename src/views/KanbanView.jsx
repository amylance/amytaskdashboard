import RecoverStrip, { removedAt } from "../components/RecoverStrip.jsx";
import { useState } from "react";
import { STATUSES } from "../lib/constants.js";
import { statusOf } from "../lib/visuals.js";
import TodoCard from "../components/TodoCard.jsx";
import { orderColumn } from "../lib/columnOrder.js";
import { indexSteps } from "../lib/steps.js";
import { pacificDayLabel } from "../lib/format.js";
import { ChevronRight } from "lucide-react";

export default function KanbanView({
  todos,
  onOpen,
  onReorder,
  onStepStatus,
  onConfirmDone,
  readOnly = false,
  removed = [],
  onRestore,
}) {
  const { stepsOf, goalOf } = indexSteps(todos);
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  // null means "not touched yet" — the newest day opens by itself and the rest stay shut.
  const [expandedDays, setExpandedDays] = useState(null);

  // Done shows THIS WEEK's completions — Monday to now, Pacific. A week is long enough
  // that Amy (and Gavin, who can see this board) can look back over the last few days,
  // and short enough that the column never becomes an archive. Monday morning it empties
  // on its own; everything older lives in the Calendar on the day it happened.
  const ptKey = (d) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

  // Most recent Monday in Pacific. Once ptKey has told us today's Pacific date, that date
  // is a plain date and must stay one — walking it back through a local Date and re-keying
  // it re-applies the browser's offset, which put Amy's week start on Sunday from Manila.
  // Everything below runs in UTC on the calendar date itself so no zone can shift it.
  const weekStartKey = (() => {
    const day = new Date(`${ptKey(new Date())}T00:00:00Z`);
    const back = (day.getUTCDay() + 6) % 7; // Sunday counts as 6 days into the week
    day.setUTCDate(day.getUTCDate() - back);
    return day.toISOString().slice(0, 10);
  })();

  // A step is never a card — except in Done, and only while its goal is still open
  // elsewhere on the board. Amy saw one goal drawn three times in a single column before
  // that rule existed; the exception can't reopen that hole, so a step disappears the
  // moment its goal itself lands in Done (the goal card already lists it once, there).
  const doneGoalIds = new Set(
    todos.filter((t) => !t.parent_id && t.status === "done").map((t) => t.id),
  );

  const columns = STATUSES.map((s) => {
    const items = todos.filter((t) => {
      if (t.status !== s.id) return false;
      if (s.id !== "done") return !t.parent_id;
      if (t.completed_at && ptKey(new Date(t.completed_at)) < weekStartKey) return false;
      return !t.parent_id || !doneGoalIds.has(t.parent_id);
    });
    return { ...s, items: orderColumn(items) };
  });

  // Done keeps a full week, so by Friday it is a wall of cards. Grouping by the day the
  // work finished turns it into a week at a glance: four on Monday, six on Tuesday. The
  // newest day is open, older days are one tap away and shut by default.
  //
  // Deliberately not a drill-in with a back button. A day is a fold, not a place — nothing
  // to navigate away from means nothing to navigate back from, and the same gesture works
  // on a phone and a desktop without a second screen to build.
  //
  // Grouped by finish date, not ask date. This column answers "what got done, and when",
  // and grouping by the ask would scatter one day's output across the whole week.
  function groupByDay(items) {
    const out = [];
    for (const t of items) {
      const label = pacificDayLabel(t.completed_at);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(t);
      else out.push({ label, items: [t] });
    }
    return out;
  }

  // Today always heads the column, even with nothing finished yet — a section that only
  // appears once something lands reads as broken, not quiet. Everything else about the
  // grouping (label, order, fold state) stays keyed on the real Pacific date underneath.
  const todayLabel = pacificDayLabel(new Date());
  function withToday(groups) {
    if (groups.length && groups[0].label === todayLabel) return groups;
    return [{ label: todayLabel, items: [] }, ...groups];
  }

  function dayIsOpen(groups, label, idx) {
    return expandedDays ? expandedDays.has(label) : idx === 0;
  }

  function toggleDay(groups, label) {
    setExpandedDays((prev) => {
      const next = new Set(prev ?? (groups.length ? [groups[0].label] : []));
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleDrop(status) {
    if (!draggingId) return;
    const dragged = todos.find((t) => t.id === draggingId);
    if (!dragged) return;

    setDraggingId(null);
    setOverColumn(null);

    // A drop decides status and nothing else — order comes from activity, so there is no
    // position to persist. The status change still runs its server-side side effects
    // (started_at / completed_at / decided_at, activity log).
    if (dragged.status === status) return;
    onReorder(draggingId, { status });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(col.id);
            }}
            onDragLeave={() => setOverColumn((c) => (c === col.id ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(col.id);
            }}
            className={`rounded-2xl border border-hairline p-3 min-h-[200px] transition-colors ${
              overColumn === col.id ? "bg-black/[0.03]" : "bg-transparent"
            }`}
          >
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                <span
                  className={`w-2 h-2 rounded-full ${statusOf(col.id).dot}`}
                  aria-hidden
                />
                {col.label}
              </h2>
              <span
                className="rounded-full bg-black/[0.06] px-2 py-0.5 font-mono text-[11px] text-ink-muted"
                title={`${col.items.length} task${col.items.length === 1 ? "" : "s"} in ${col.label}`}
              >
                {col.items.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {col.id === "done"
                ? withToday(groupByDay(col.items)).map((group, gi, groups) => {
                    const open = dayIsOpen(groups, group.label, gi);
                    const isToday = group.label === todayLabel;
                    return (
                      <div key={group.label} className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleDay(groups, group.label)}
                          aria-expanded={open}
                          className="tap-scale flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-[11px] font-semibold text-ink-muted hover:bg-black/[0.04]"
                        >
                          <ChevronRight
                            size={12}
                            className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
                          />
                          {isToday ? "Today" : group.label}
                          <span className="ml-auto font-mono text-[10px]">{group.items.length}</span>
                        </button>
                        {open && group.items.length === 0 && (
                          <p className="px-1.5 pb-1 text-[11px] text-ink-muted/70">
                            Nothing finished yet today
                          </p>
                        )}
                        {open &&
                          group.items.map((todo) => (
                            <TodoCard
                              key={todo.id}
                              todo={todo}
                              goal={goalOf(todo)}
                              steps={stepsOf(todo.id)}
                              onStepStatus={onStepStatus}
                              onConfirmDone={onConfirmDone}
                              readOnly={readOnly}
                              onClick={() =>
                                todo.parent_id ? onOpen(todo.parent_id, todo.id) : onOpen(todo.id)
                              }
                            />
                          ))}
                      </div>
                    );
                  })
                : col.items.map((todo) => (
                    <div
                      key={todo.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOverColumn(col.id);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDrop(col.id);
                      }}
                    >
                      <TodoCard
                        todo={todo}
                        goal={goalOf(todo)}
                        steps={stepsOf(todo.id)}
                        onStepStatus={onStepStatus}
                        onConfirmDone={onConfirmDone}
                        readOnly={readOnly}
                        onClick={() => onOpen(todo.id)}
                        draggable
                        dragging={draggingId === todo.id}
                        onDragStart={() => setDraggingId(todo.id)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverColumn(null);
                        }}
                      />
                    </div>
                  ))}
              {col.id !== "done" && col.items.length === 0 && (
                <div className="text-xs text-ink-muted/70 text-center py-6 border border-dashed border-hairline rounded-xl">
                  Nothing here
                </div>
              )}
              {col.id === "done" && (
                <p className="text-[10px] text-ink-muted/70 text-center pt-1">
                  Clears every Monday. Older work is in the Calendar.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <RecoverStrip
        items={removed}
        noun="task"
        onRestore={onRestore}
        describe={removedAt}
      />
    </div>
  );
}
