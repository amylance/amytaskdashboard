import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { STATUSES, PRIORITIES } from '../lib/constants.js';

const fieldClass =
  'glass-field w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink/30 placeholder:text-ink-muted/60';

export default function CreateTodoModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        status,
        priority,
        due_date: dueDate || null,
        contact: contact.trim(),
        category: category.trim(),
        description: notes.trim(),
        is_private: isPrivate,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 frosted overlay-in" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="glass-panel relative w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl p-6 slide-in-panel"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink">New task</h2>
          <button
            type="button"
            onClick={onClose}
            className="tap-scale glass-field inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <Field label="Title">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to happen?"
            className={fieldClass}
          />
        </Field>

        <Field label="Status">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id)}
                className={`tap-scale rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  status === s.id ? 'bg-ink text-white' : 'glass-field text-ink-muted hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`${fieldClass} cursor-pointer`}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${fieldClass} font-mono`}
            />
          </Field>
        </div>

        <Field label="Contact">
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. Allison Buckles"
            className={fieldClass}
          />
        </Field>

        <Field label="Category">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Rippling"
            className={fieldClass}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Context for anyone checking in on this"
            rows={4}
            className={`${fieldClass} resize-none`}
          />
        </Field>

        <div className="flex items-center justify-between gap-3 mt-1 mb-5">
          <button
            type="button"
            onClick={() => setIsPrivate((v) => !v)}
            className={`tap-scale inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
              isPrivate ? 'bg-ink text-white' : 'glass-field text-ink-muted'
            }`}
          >
            <Lock size={11} />
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

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
