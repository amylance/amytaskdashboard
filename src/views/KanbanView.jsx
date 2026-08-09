import { useState } from 'react';
import { STATUSES } from '../lib/constants.js';
import { statusOf } from '../lib/visuals.js';
import TodoCard from '../components/TodoCard.jsx';

export default function KanbanView({ todos, onOpen, onReorder }) {
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  // Done shows TODAY's completions only — older finished work lives in the Calendar,
  // on the day it happened, so the board stays about live work.
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const columns = STATUSES.map((s) => ({
    ...s,
    items: todos
      .filter((t) => {
        if (t.status !== s.id) return false;
        if (s.id !== 'done') return true;
        if (!t.completed_at) return true;
        return (
          new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Los_Angeles',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date(t.completed_at)) === todayKey
        );
      })
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  function handleDrop(status, targetIndex) {
    if (!draggingId) return;
    const dragged = todos.find((t) => t.id === draggingId);
    if (!dragged) return;

    const columnItems = todos
      .filter((t) => t.status === status && t.id !== draggingId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const before = columnItems[targetIndex - 1];
    const after = columnItems[targetIndex];
    const newSortOrder =
      before && after
        ? (before.sort_order + after.sort_order) / 2
        : before
          ? before.sort_order + 1
          : after
            ? after.sort_order - 1
            : 0;

    setDraggingId(null);
    setOverColumn(null);

    // Single call carrying both status and sort_order so the server-side
    // status-change side effects (started_at/completed_at/decided_at,
    // activity log) always run — a separate reorder call racing a separate
    // status call let the reorder win and silently skip those side effects.
    onReorder(draggingId, { status, sort_order: newSortOrder });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
            overColumn === col.id ? 'bg-black/[0.03]' : 'bg-transparent'
          }`}
        >
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
              <span className={`w-2 h-2 rounded-full ${statusOf(col.id).dot}`} aria-hidden />
              {col.label}
            </h2>
            <span
              className="rounded-full bg-black/[0.06] px-2 py-0.5 font-mono text-[11px] text-ink-muted"
              title={`${col.items.length} task${col.items.length === 1 ? '' : 's'} in ${col.label}`}
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
                />
              </div>
            ))}
            {col.items.length === 0 && (
              <div className="text-xs text-ink-muted/70 text-center py-6 border border-dashed border-hairline rounded-xl">
                {col.id === 'done' ? 'Nothing finished today' : 'Nothing here'}
              </div>
            )}
            {col.id === 'done' && col.items.length > 0 && (
              <p className="text-[10px] text-ink-muted/70 text-center pt-1">
                Today only — earlier work is in the Calendar
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
