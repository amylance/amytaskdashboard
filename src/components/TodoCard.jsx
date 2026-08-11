import { Lock, Calendar } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';
import { formatDueDate, isOverdue } from '../lib/format.js';
import { sourceOf, statusOf, waitingAge } from '../lib/visuals.js';

export default function TodoCard({ todo, onClick, draggable, onDragStart, onDragEnd, dragging, showStatus }) {
  const overdue = isOverdue(todo.due_date, todo.status);
  const src = sourceOf(todo.source);
  const st = statusOf(todo.status);
  const isDone = todo.status === 'done';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`tap-scale relative cursor-pointer overflow-hidden rounded-xl border border-hairline bg-panel p-3.5 pl-4 hover:bg-black/[0.03] ${
        dragging ? 'opacity-40' : ''
      } ${isDone ? 'opacity-65' : ''}`}
    >
      {/* Status accent — lets a card be identified out of its column (List, Timeline). */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${st.bar}`} aria-hidden />

      {/* Where it came from — always visible, muted so it never competes with priority. */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-ink-muted">
          <span aria-hidden>{src.mark}</span>
          {src.label}
          {/* Who it came from or is for — the second question after "what is this". */}
          {todo.contact && <span className="normal-case text-ink">· {todo.contact}</span>}
        </span>
        {todo.is_private && <Lock size={11} className="text-ink-muted shrink-0" />}
      </div>

      <h3 className={`text-sm font-medium leading-snug line-clamp-2 mb-2 ${isDone ? 'text-ink-muted line-through' : 'text-ink'}`}>
        {todo.title}
      </h3>

      {/* Waiting items name who they're stuck on and how long — the chase prompt. */}
      {todo.status === 'waiting' && todo.waiting_on && (
        <div className="mb-2">
          {(() => {
            const age = waitingAge(todo.waiting_since);
            return (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                  age?.stale
                    ? 'bg-clay-soft text-clay border border-clay/35 font-medium'
                    : 'bg-violet-500/10 text-violet-700 border border-violet-500/25'
                }`}
              >
                ⏳ {todo.waiting_on}
                {age && ` · ${age.days}d`}
                {age?.stale && ' — chase'}
              </span>
            );
          })()}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {showStatus && (
          <span className={`inline-flex items-center gap-1 text-[11px] ${st.text}`}>
            <span aria-hidden>{st.mark}</span>
            {st.label}
          </span>
        )}
        <PriorityBadge priority={todo.priority} />
        {todo.due_date && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[11px] ${
              overdue ? 'text-clay font-medium' : 'text-ink-muted'
            }`}
          >
            <Calendar size={11} />
            {formatDueDate(todo.due_date)}
            {overdue && ' overdue'}
          </span>
        )}
      </div>
    </div>
  );
}
