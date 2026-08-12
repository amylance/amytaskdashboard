import RecoverStrip, { removedAt } from '../components/RecoverStrip.jsx';
import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Lock } from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge.jsx';
import { activitySpan, formatDueDate, isOverdue } from '../lib/format.js';
import { lastActivity } from '../lib/columnOrder.js';
import { sourceOf, statusOf, waitingAge } from '../lib/visuals.js';
import { indexSteps } from '../lib/steps.js';
import { CATEGORIES } from '../lib/constants.js';

const PRIORITY_ORDER = { normal: 0, high: 1, urgent: 2 };

// Amy's order, with one addition of mine she accepted: Pending sits above To Do because
// Pending is held by someone else and decays, while To Do is hers to start whenever.
// Doing leads because the List doubles as Gavin's and Isaac's view of what is live now.
const STATUS_ORDER = { doing: 0, waiting: 1, todo: 2, done: 3 };

const COLUMNS = [
  { key: 'source', label: 'From' },
  { key: 'title', label: 'Task' },
  { key: 'when', label: 'Asked → Done' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'due_date', label: 'Due' },
];

// The full record of every task, with filters. This doubles as Gavin's and Isaac's view:
// they click their own name and see what they asked for and where it stands.
export default function ListView({ todos, onOpen, removed = [], onRestore }) {
  const { goalOf, stepsOf } = indexSteps(todos);
  // Newest work first. Due dates are mostly null on this board, so sorting by them left the
  // List in effectively insertion order and buried what just moved.
  const [sortKey, setSortKey] = useState('status');
  const [dir, setDir] = useState('asc');
  const [person, setPerson] = useState('all');
  const [category, setCategory] = useState('all');

  const matchesPerson = (t, name) => {
    if (name === 'all') return true;
    const hay = [t.waiting_on, t.title, t.description, t.claude_note, t.source_context, t.contact]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(name.toLowerCase());
  };

  const filtered = useMemo(
    () => todos.filter((t) => matchesPerson(t, person) && (category === 'all' || t.category === category)),
    [todos, person, category],
  );

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === 'priority') {
        av = PRIORITY_ORDER[a.priority];
        bv = PRIORITY_ORDER[b.priority];
      }
      if (sortKey === 'when') {
        av = lastActivity(a);
        bv = lastActivity(b);
      }
      if (sortKey === 'status') {
        av = STATUS_ORDER[a.status] ?? 9;
        bv = STATUS_ORDER[b.status] ?? 9;
        // Inside a status band, most recently touched first.
        if (av === bv) return lastActivity(b) - lastActivity(a);
      }
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, dir]);

  function toggleSort(key) {
    if (sortKey === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setDir('asc');
    }
  }

  const counts = {
    Gavin: todos.filter((t) => matchesPerson(t, 'Gavin') && t.status !== 'done').length,
    Isaac: todos.filter((t) => matchesPerson(t, 'Isaac') && t.status !== 'done').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
      {/* Person filter — deliberately plain, so Gavin or Isaac see their own name and click it. */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Chip label="Everything" active={person === 'all'} onClick={() => setPerson('all')} />
        <Chip label="Gavin" count={counts.Gavin} active={person === 'Gavin'} onClick={() => setPerson('Gavin')} />
        <Chip label="Isaac" count={counts.Isaac} active={person === 'Isaac'} onClick={() => setPerson('Isaac')} />

        <span className="mx-1 h-4 w-px bg-hairline" />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-hairline bg-panel px-3 py-1.5 text-xs text-ink outline-none"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <span className="ml-auto text-[11px] text-ink-muted">
          {sorted.length} of {todos.length}
        </span>
      </div>

      {/* Said out loud on phones, because a table that scrolls sideways gives no sign that
          it does and the columns past Status look simply missing. */}
      <p className="sm:hidden mb-2 text-[11px] text-ink-muted">Swipe the table sideways for category, priority and due.</p>

      <div className="rounded-2xl border border-hairline bg-panel overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-hairline">
              {COLUMNS.map((col) => (
                <th key={col.key} className="text-left px-4 py-3">
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="tap-scale inline-flex items-center gap-1 text-xs font-semibold text-ink-muted uppercase tracking-wide hover:text-ink"
                  >
                    {col.label}
                    {sortKey === col.key && (dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((todo) => {
              const age = todo.status === 'waiting' ? waitingAge(todo.waiting_since) : null;
              return (
                <tr
                  key={todo.id}
                  onClick={() => onOpen(todo.id)}
                  className="tap-scale cursor-pointer border-b border-hairline last:border-0 hover:bg-black/[0.03]"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                      <span aria-hidden>{sourceOf(todo.source).mark}</span>
                      {sourceOf(todo.source).label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {todo.is_private && <Lock size={11} className="text-ink-muted shrink-0" />}
                      <span
                        className={`font-medium ${todo.status === 'done' ? 'text-ink-muted line-through' : 'text-ink'}`}
                      >
                        {todo.title}
                      </span>
                      {/* The List is flat by design — it is the full record. A step still has
                          to say what it belongs to, or it reads as its own commitment. */}
                      {stepsOf(todo.id).length > 0 && (
                        <span className="shrink-0 font-mono text-[10px] text-ink-muted">
                          {stepsOf(todo.id).filter((x) => x.status === 'done').length}/
                          {stepsOf(todo.id).length} steps
                        </span>
                      )}
                    </div>
                    {goalOf(todo) && (
                      <span className="block text-[11px] text-ink-muted">↳ {goalOf(todo).title}</span>
                    )}
                    {todo.waiting_on && (
                      <span className={`text-[11px] ${age?.stale ? 'text-clay' : 'text-violet-700'}`}>
                        ⏳ {todo.waiting_on}
                        {age && ` · ${age.days}d`}
                        {age?.stale && ' — chase'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-ink-muted">
                    {(() => {
                      const span = activitySpan(todo);
                      if (!span) return '—';
                      return (
                        <>
                          {span.from}
                          {span.to && <span className="text-ink"> → {span.to}</span>}
                          {span.open && <span className="text-ink-muted/60"> → open</span>}
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[11px] text-ink-muted">{todo.category ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[12px] ${statusOf(todo.status).text}`}>
                      <span aria-hidden>{statusOf(todo.status).mark}</span>
                      {statusOf(todo.status).label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={todo.priority} />
                    {todo.priority === 'normal' && <span className="text-xs text-ink-muted/50">—</span>}
                  </td>
                  <td
                    className={`px-4 py-3 font-mono text-xs ${
                      isOverdue(todo.due_date, todo.status) ? 'text-clay' : 'text-ink-muted'
                    }`}
                  >
                    {formatDueDate(todo.due_date) ?? '—'}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-muted">
                  Nothing matches that filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <RecoverStrip items={removed} noun="task" onRestore={onRestore} describe={removedAt} />

    </div>
  );
}

function Chip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`tap-scale inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        active ? 'border-ink bg-ink text-white' : 'border-hairline bg-panel text-ink-muted hover:text-ink'
      }`}
    >
      {label}
      {count != null && (
        <span className={`font-mono text-[10px] ${active ? 'text-white/70' : 'text-ink-muted'}`}>{count}</span>
      )}
    </button>
  );
}
