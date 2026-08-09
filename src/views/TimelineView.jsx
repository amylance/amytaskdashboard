import { useMemo } from 'react';
import TodoCard from '../components/TodoCard.jsx';
import { daysUntilPT } from '../lib/format.js';

// Timeline answers the one thing Kanban can't: what's due, and when — in order.
// Forward-looking only; finished work lives in the Calendar.
function bucketOf(dueDate) {
  if (!dueDate) return { key: '9-none', label: 'No due date', order: 9 };
  // "Today" is Pacific — the dashboard's clock — not the browser's.
  const days = daysUntilPT(dueDate);

  if (days < 0) return { key: '0-overdue', label: `Overdue`, order: 0 };
  if (days === 0) return { key: '1-today', label: 'Today', order: 1 };
  if (days === 1) return { key: '2-tomorrow', label: 'Tomorrow', order: 2 };
  if (days <= 7) return { key: '3-week', label: 'This week', order: 3 };
  if (days <= 30) return { key: '4-month', label: 'This month', order: 4 };
  return { key: '5-later', label: 'Later', order: 5 };
}

export default function TimelineView({ todos, onOpen }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const todo of todos) {
      if (todo.status === 'done') continue;
      const b = bucketOf(todo.due_date);
      if (!map.has(b.key)) map.set(b.key, { ...b, items: [] });
      map.get(b.key).items.push(todo);
    }
    for (const g of map.values()) {
      g.items.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'));
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [todos]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink">What&apos;s due, and when</h2>
        <p className="text-[11px] text-ink-muted mt-0.5">
          Open work only, soonest first. Finished work is in the Calendar.
        </p>
      </div>

      <div className="relative border-l border-hairline ml-2">
        {groups.map((g) => (
          <div key={g.key} className="relative pl-6 pb-7">
            <span
              className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                g.key === '0-overdue' ? 'bg-clay' : g.key === '1-today' ? 'bg-ink' : 'bg-hairline'
              }`}
            />
            <div className="flex items-baseline gap-2 mb-2.5">
              <h3 className={`text-sm font-semibold ${g.key === '0-overdue' ? 'text-clay' : 'text-ink'}`}>
                {g.label}
              </h3>
              <span className="font-mono text-[11px] text-ink-muted">{g.items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {g.items.map((todo) => (
                <TodoCard key={todo.id} todo={todo} onClick={() => onOpen(todo.id)} showStatus />
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="pl-6 text-sm text-ink-muted">Nothing open.</p>}
      </div>
    </div>
  );
}
