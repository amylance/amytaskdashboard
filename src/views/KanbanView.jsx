import { useState } from 'react';
import { STATUSES } from '../lib/constants.js';
import TodoCard from '../components/TodoCard.jsx';
import { api } from '../lib/api.js';

export default function KanbanView({ todos, onOpen, setTodos }) {
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const columns = STATUSES.map((s) => ({
    ...s,
    items: todos
      .filter((t) => t.status === s.id)
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

    setTodos((prev) =>
      prev.map((t) => (t.id === draggingId ? { ...t, status, sort_order: newSortOrder } : t)),
    );
    setDraggingId(null);
    setOverColumn(null);

    api.reorderTodos([{ id: draggingId, status, sort_order: newSortOrder }]).catch(() => {});
    if (dragged.status !== status) {
      api.updateTodo(draggingId, { status }).catch(() => {});
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <h2 className="text-sm font-semibold text-ink">{col.label}</h2>
            <span className="font-mono text-xs text-ink-muted">{col.items.length}</span>
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
                Nothing here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
