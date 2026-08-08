import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Lock } from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge.jsx';
import InboxSection from '../components/InboxSection.jsx';
import { useInbox } from '../hooks/useInbox.js';
import { formatDueDate, isOverdue } from '../lib/format.js';
import { STATUSES } from '../lib/constants.js';

const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));
const PRIORITY_ORDER = { normal: 0, high: 1, urgent: 2 };
const SOURCE_MARK = {
  fireflies: '🎙',
  slack: '💬',
  email: '✉️',
  google: '📅',
  lance_live: '🏨',
};

const COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'due_date', label: 'Due' },
];

// List = the full record (every task, every source) with the review queue on top.
export default function ListView({ todos, onOpen, config }) {
  const { items: inboxItems, sweep, resolve } = useInbox(config);
  const [sortKey, setSortKey] = useState('due_date');
  const [dir, setDir] = useState('asc');

  const sorted = useMemo(() => {
    const copy = [...todos];
    copy.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === 'priority') {
        av = PRIORITY_ORDER[a.priority];
        bv = PRIORITY_ORDER[b.priority];
      }
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [todos, sortKey, dir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDir('asc');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <InboxSection items={inboxItems} sweep={sweep} onResolve={resolve} />

      <div className="rounded-2xl border border-hairline bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline">
              {COLUMNS.map((col) => (
                <th key={col.key} className="text-left px-4 py-3">
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="tap-scale inline-flex items-center gap-1 text-xs font-semibold text-ink-muted uppercase tracking-wide hover:text-ink"
                  >
                    {col.label}
                    {sortKey === col.key &&
                      (dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((todo) => (
              <tr
                key={todo.id}
                onClick={() => onOpen(todo.id)}
                className="tap-scale cursor-pointer border-b border-hairline last:border-0 hover:bg-black/[0.03]"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {todo.is_private && <Lock size={11} className="text-ink-muted shrink-0" />}
                    {SOURCE_MARK[todo.source] && (
                      <span className="shrink-0 text-[11px]" title={todo.source}>
                        {SOURCE_MARK[todo.source]}
                      </span>
                    )}
                    <span className="font-medium text-ink">{todo.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{STATUS_LABEL[todo.status]}</td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={todo.priority} />
                </td>
                <td
                  className={`px-4 py-3 font-mono text-xs ${
                    isOverdue(todo.due_date, todo.status) ? 'text-clay' : 'text-ink-muted'
                  }`}
                >
                  {formatDueDate(todo.due_date) ?? '—'}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-muted">
                  No tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
