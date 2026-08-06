import { Lock, Calendar } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';
import { formatDueDate, isOverdue, shortId } from '../lib/format.js';

export default function TodoCard({ todo, onClick, draggable, onDragStart, onDragEnd, dragging }) {
  const overdue = isOverdue(todo.due_date, todo.status);

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`tap-scale cursor-pointer rounded-xl border border-hairline bg-panel p-3.5 hover:bg-black/[0.03] ${
        dragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-ink leading-snug line-clamp-2">{todo.title}</h3>
        {todo.is_private && <Lock size={12} className="text-ink-muted shrink-0 mt-0.5" />}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <PriorityBadge priority={todo.priority} />
        {todo.due_date && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[11px] ${
              overdue ? 'text-clay' : 'text-ink-muted'
            }`}
          >
            <Calendar size={11} />
            {formatDueDate(todo.due_date)}
          </span>
        )}
      </div>

      <div className="mt-2 font-mono text-[10px] text-ink-muted/60">{shortId(todo.id)}</div>
    </div>
  );
}
