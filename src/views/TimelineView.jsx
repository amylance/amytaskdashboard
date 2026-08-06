import { useMemo } from 'react';
import TodoCard from '../components/TodoCard.jsx';

function groupLabel(dateStr) {
  if (!dateStr) return 'No due date';
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d - today) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function TimelineView({ todos, onOpen }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const todo of todos) {
      const key = todo.due_date ?? '9999-99-99';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(todo);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, items]) => ({ key, label: groupLabel(key === '9999-99-99' ? null : key), items }));
  }, [todos]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="relative border-l border-hairline ml-2">
        {groups.map((group) => (
          <div key={group.key} className="relative pl-6 pb-8">
            <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-ink" />
            <h2 className="text-sm font-semibold text-ink mb-3">{group.label}</h2>
            <div className="flex flex-col gap-2">
              {group.items.map((todo) => (
                <TodoCard key={todo.id} todo={todo} onClick={() => onOpen(todo.id)} />
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="pl-6 text-sm text-ink-muted">No tasks yet.</p>}
      </div>
    </div>
  );
}
