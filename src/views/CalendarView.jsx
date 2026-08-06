import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function CalendarView({ todos, onOpen }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const byDate = useMemo(() => {
    const map = new Map();
    for (const todo of todos) {
      if (!todo.due_date) continue;
      if (!map.has(todo.due_date)) map.set(todo.due_date, []);
      map.get(todo.due_date).push(todo);
    }
    return map;
  }, [todos]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
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
        <h2 className="text-lg font-semibold text-ink">
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
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
          if (!date) return <div key={idx} className="bg-panel min-h-[96px]" />;
          const key = toKey(date);
          const items = byDate.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div key={idx} className="bg-panel min-h-[96px] p-1.5 flex flex-col gap-1">
              <span
                className={`self-start font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
                  isToday ? 'bg-ink text-white' : 'text-ink-muted'
                }`}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-1 overflow-hidden">
                {items.slice(0, 3).map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => onOpen(todo.id)}
                    className="tap-scale text-left rounded-md px-1.5 py-1 text-[11px] leading-tight text-ink hover:bg-black/[0.05] truncate flex items-center gap-1"
                  >
                    {todo.priority === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-clay shrink-0" />}
                    <span className="truncate">{todo.title}</span>
                  </button>
                ))}
                {items.length > 3 && (
                  <span className="text-[10px] text-ink-muted px-1.5">+{items.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {todos.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted text-center">No tasks yet.</p>
      )}
    </div>
  );
}
