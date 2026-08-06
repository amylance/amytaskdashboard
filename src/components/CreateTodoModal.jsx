import { useState } from 'react';
import { X } from 'lucide-react';
import { STATUSES, PRIORITIES } from '../lib/constants.js';

export default function CreateTodoModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    await onCreate({
      title: title.trim(),
      status,
      priority,
      due_date: dueDate || null,
      is_private: isPrivate,
    });
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 frosted overlay-in" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-panel border border-hairline rounded-2xl p-6 slide-in-panel"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">New task</h2>
          <button
            type="button"
            onClick={onClose}
            className="tap-scale inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:bg-black/5"
          >
            <X size={16} />
          </button>
        </div>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm outline-none focus:border-ink/30 mb-3"
        />

        <div className="flex flex-wrap gap-2 mb-5">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full border border-hairline px-3 py-1.5 text-xs text-ink outline-none cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-full border border-hairline px-3 py-1.5 text-xs text-ink outline-none cursor-pointer"
          >
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-full border border-hairline px-3 py-1.5 text-xs font-mono text-ink outline-none"
          />
          <button
            type="button"
            onClick={() => setIsPrivate((v) => !v)}
            className={`tap-scale rounded-full border px-3 py-1.5 text-xs ${
              isPrivate ? 'border-ink bg-ink text-white' : 'border-hairline text-ink-muted'
            }`}
          >
            Private
          </button>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="tap-scale w-full rounded-lg bg-ink text-white text-sm font-medium py-2.5 disabled:opacity-40"
        >
          {submitting ? 'Creating…' : 'Create task'}
        </button>
      </form>
    </div>
  );
}
