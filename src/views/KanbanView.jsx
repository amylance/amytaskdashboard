import RecoverStrip, { removedAt } from "../components/RecoverStrip.jsx";
import { useState } from "react";
import { STATUSES } from "../lib/constants.js";
import { statusOf } from "../lib/visuals.js";
import TodoCard from "../components/TodoCard.jsx";
import { orderColumn, reorderWithin } from "../lib/columnOrder.js";

export default function KanbanView({
  todos,
  onOpen,
  onReorder,
  onMove,
  removed = [],
  onRestore,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

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

  const columns = STATUSES.map((s) => ({
    ...s,
    items: todos
      .filter((t) => {
        if (t.status !== s.id) return false;
        if (s.id !== "done") return true;
        if (!t.completed_at) return true;
        return ptKey(new Date(t.completed_at)) >= weekStartKey;
      })
      .slice(),
  })).map((col) => ({ ...col, items: orderColumn(col.items) }));

  function move(colItems, id, direction) {
    const updates = reorderWithin(colItems, id, direction);
    if (updates) onMove(updates);
  }

  function handleDrop(status, targetIndex) {
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
      <p className="mb-3 text-[11px] text-ink-muted">
        Ordered by most recent activity, newest first — finished, started, blocked or edited,
        whichever happened last. Use the arrows to hold a card in place; pinned cards stay on
        top and everything else keeps flowing beneath them.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              handleDrop(col.id, col.items.length);
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
              {col.items.map((todo, idx) => (
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
                    handleDrop(col.id, idx);
                  }}
                >
                  <TodoCard
                    todo={todo}
                    onClick={() => onOpen(todo.id)}
                    draggable
                    dragging={draggingId === todo.id}
                    onDragStart={() => setDraggingId(todo.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverColumn(null);
                    }}
                    onMoveUp={idx > 0 ? () => move(col.items, todo.id, 'up') : undefined}
                    onMoveDown={
                      idx < col.items.length - 1 ? () => move(col.items, todo.id, 'down') : undefined
                    }
                  />
                </div>
              ))}
              {col.items.length === 0 && (
                <div className="text-xs text-ink-muted/70 text-center py-6 border border-dashed border-hairline rounded-xl">
                  {col.id === "done"
                    ? "Nothing finished yet this week"
                    : "Nothing here"}
                </div>
              )}
              {col.id === "done" && col.items.length > 0 && (
                <p className="text-[10px] text-ink-muted/70 text-center pt-1">
                  This week only, from Monday — earlier work is in the Calendar
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
