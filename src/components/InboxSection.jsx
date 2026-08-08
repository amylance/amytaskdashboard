import { useState } from 'react';
import { Check, X, Pencil, ExternalLink, Inbox as InboxIcon } from 'lucide-react';
import { formatDateTimePT, formatLocal } from '../lib/format.js';

const SOURCE_LABEL = {
  fireflies: '🎙 Fireflies',
  slack: '💬 Slack',
  email: '✉️ Email',
  google: '📅 Google',
  lance_live: '🏨 Lance Live',
  app: 'App',
};

// The filter between "what the machine heard" and "what's actually on Amy's plate".
// Nothing here is a task yet — she approves, edits, or dismisses each one.
export default function InboxSection({ items, onResolve }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <InboxIcon size={14} className="text-clay" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Needs review</h2>
        <span className="rounded-full bg-clay-soft px-2 py-0.5 text-[10px] font-mono text-clay">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <InboxCard key={item.id} item={item} onResolve={onResolve} />
        ))}
      </div>
    </div>
  );
}

function InboxCard({ item, onResolve }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const alreadyDone = item.suggested_status === 'done';

  return (
    <div className="rounded-xl border border-clay/25 bg-clay-soft p-3.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wide text-ink-muted">
          {SOURCE_LABEL[item.source] ?? item.source}
          {item.source_context ? ` · ${item.source_context}` : ''}
        </span>
        <span className="text-[10px] font-mono text-ink-muted" title={formatLocal(item.received_at)}>
          {formatDateTimePT(item.received_at)}
        </span>
      </div>

      {editing ? (
        <input
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          className="glass-field w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-ink/30 mb-2"
        />
      ) : (
        <p className="text-sm font-medium text-ink mb-2">{title}</p>
      )}

      {item.source_raw && (
        <p className="text-[11px] text-ink-muted italic mb-1">“{item.source_raw}”</p>
      )}
      {item.claude_note && (
        <p className="text-[11px] text-ink mb-2">
          <span className="font-mono uppercase text-ink-muted">🤖 Claude</span> · {item.claude_note}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onResolve(item.id, 'approve', { title, status: item.suggested_status })}
          className="tap-scale inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white"
        >
          <Check size={12} />
          {alreadyDone ? 'Approve as done' : 'Approve'}
        </button>
        <button
          onClick={() => (editing ? onResolve(item.id, 'approve', { title, status: item.suggested_status }) : setEditing(true))}
          className="tap-scale inline-flex items-center gap-1 rounded-full border border-hairline bg-panel px-3 py-1.5 text-xs text-ink"
        >
          <Pencil size={12} />
          {editing ? 'Save as task' : 'Edit'}
        </button>
        <button
          onClick={() => onResolve(item.id, 'dismiss')}
          className="tap-scale inline-flex items-center gap-1 rounded-full border border-hairline bg-panel px-3 py-1.5 text-xs text-ink-muted hover:text-clay"
        >
          <X size={12} />
          Dismiss
        </button>
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-clay hover:underline"
          >
            <ExternalLink size={11} /> source
          </a>
        )}
      </div>
    </div>
  );
}
