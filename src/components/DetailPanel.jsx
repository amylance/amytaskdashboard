import { useEffect, useMemo, useState } from 'react';
import { X, Lock, Trash2, Send, Clock, Link2, UserPlus, ExternalLink } from 'lucide-react';
import { STATUSES, PRIORITIES } from '../lib/constants.js';

const SOURCE_LABEL = {
  app: 'App',
  fireflies: 'Fireflies',
  slack: 'Slack',
  google: 'Google',
  lance_live: 'Lance Live',
  email: 'Email',
};
import { formatDateTime, shortId, pacificInputValue, pacificToISO } from '../lib/format.js';
import Story from './Story.jsx';
import { useTodoDetail } from '../hooks/useTodoDetail.js';

const ACTIVITY_LABEL = {
  created: 'created this task',
  status_changed: 'changed status',
  priority_changed: 'changed priority',
  updated: 'updated this task',
  commented: 'left a comment',
  deleted: 'deleted this task',
};

const textFieldClass =
  'glass-field w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-ink/30';

export default function DetailPanel({
  todo,
  config,
  people,
  onClose,
  onChange,
  onDelete,
  onLinkPerson,
  onUnlinkPerson,
  onOpenPerson,
  readOnly = false,
}) {
  const { comments, activity, addComment } = useTodoDetail(todo?.id, config);
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [contact, setContact] = useState(todo?.contact ?? '');
  const [category, setCategory] = useState(todo?.category ?? '');
  const [linkUrl, setLinkUrl] = useState(todo?.link_url ?? '');
  const [linkLabel, setLinkLabel] = useState(todo?.link_label ?? '');
  const [waitingOn, setWaitingOn] = useState(todo?.waiting_on ?? '');
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [personQuery, setPersonQuery] = useState('');

  const linkedPeople = todo?.people ?? [];
  const linkedIds = new Set(linkedPeople.map((p) => p.id));
  const suggestions = useMemo(() => {
    const q = personQuery.trim().toLowerCase();
    if (!q) return [];
    return (people ?? [])
      .filter((p) => !linkedIds.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personQuery, people, todo?.people]);

  useEffect(() => {
    setTitle(todo?.title ?? '');
    setDescription(todo?.description ?? '');
    setContact(todo?.contact ?? '');
    setCategory(todo?.category ?? '');
    setLinkUrl(todo?.link_url ?? '');
    setLinkLabel(todo?.link_label ?? '');
    setWaitingOn(todo?.waiting_on ?? '');
  }, [todo?.id]);

  if (!todo) return null;

  // Gavin and Isaac open cards from the same panel Amy does. They should read everything —
  // that is the point of sharing the board — and change nothing. The server already refuses
  // their writes; this stops the panel from offering an edit that would silently fail.
  function patch(fields) {
    if (readOnly) return;
    onChange(todo.id, fields);
  }

  async function handleSendComment() {
    const body = commentText.trim();
    if (readOnly || !body || sending) return;
    setSending(true);
    await addComment(body);
    setCommentText('');
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 frosted overlay-in" onClick={onClose} />

      <div className="glass-panel relative slide-in-panel w-full max-w-md h-full border-l flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline shrink-0">
          <span className="font-mono text-xs text-ink-muted">{shortId(todo.id)}</span>
          <div className="flex items-center gap-1">
            {!readOnly && (
              <button
                onClick={() => onDelete(todo.id)}
                title="Delete"
                className="tap-scale inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:bg-clay-soft hover:text-clay"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close"
              className="tap-scale inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:bg-black/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* The title has to LOOK editable — it was styled as plain text and locked to one
              line, so long titles were clipped and nobody could tell it was a field. */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wide text-ink-muted">Task</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== todo.title && patch({ title: title.trim() })}
              rows={Math.max(1, Math.ceil(title.length / 34))}
              placeholder="Name this task…"
              className="mt-1 w-full resize-none rounded-lg border border-hairline bg-panel px-3 py-2 text-lg font-semibold text-ink outline-none leading-snug hover:border-ink/25 focus:border-ink/40"
            />
          </div>

          {/* The history — how it arrived, what happened, what changed, what's left.
              Written by the sweep in Amy's bullet format; the card stays short and this
              is where the whole thing lives. */}
          {todo.story && (
            <div className="rounded-xl border border-hairline bg-panel px-3.5 py-3">
              <Story text={todo.story} />
            </div>
          )}

          {(todo.source_raw || todo.claude_note) && (
            <div className="rounded-xl border border-hairline bg-black/[0.02] p-3 flex flex-col gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wide text-ink-muted">Provenance</span>
              {todo.source_raw && (
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">
                      🎙 {SOURCE_LABEL[todo.source] ?? todo.source}
                    </span>
                    {todo.source_url && (
                      <a
                        href={todo.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-clay hover:underline"
                      >
                        <ExternalLink size={10} /> source
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted italic">“{todo.source_raw}”</p>
                </div>
              )}
              {todo.claude_note && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-muted">🤖 Claude</span>
                  <p className="text-xs text-ink">{todo.claude_note}</p>
                </div>
              )}
              {todo.edited_from_source && (
                <span className="inline-flex w-fit items-center gap-1 text-[10px] text-clay">
                  ✎ you edited this from the source
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <FieldSelect value={todo.status} options={STATUSES} onChange={(status) => patch({ status })} />
            <FieldSelect
              value={todo.priority}
              options={PRIORITIES}
              onChange={(priority) => patch({ priority })}
              urgent
            />
            <input
              type="date"
              value={todo.due_date ?? ''}
              onChange={(e) => patch({ due_date: e.target.value || null })}
              className="glass-field rounded-full border border-hairline px-3 py-1.5 text-xs font-mono text-ink outline-none"
            />
            <button
              onClick={() => patch({ is_private: !todo.is_private })}
              className={`tap-scale inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                todo.is_private ? 'border-ink bg-ink text-white' : 'glass-field border-hairline text-ink-muted'
              }`}
            >
              <Lock size={11} />
              Private
            </button>
          </div>

          {/* Who this is blocked on. Editable — the person who raised it often isn't the
              person who can unblock it (Isaac raised the GM CRM; Gavin grants the access). */}
          <LabeledField label="Waiting on">
            <div className="flex items-center gap-2">
              <input
                value={waitingOn}
                onChange={(e) => setWaitingOn(e.target.value)}
                onBlur={() => {
                  if (waitingOn === (todo.waiting_on ?? '')) return;
                  const value = waitingOn.trim();
                  patch({
                    waiting_on: value || null,
                    // Start the clock when someone is first named, and clear it when removed.
                    waiting_since: value ? todo.waiting_since ?? new Date().toISOString() : null,
                    ...(value && todo.status !== 'waiting' ? { status: 'waiting' } : {}),
                  });
                }}
                placeholder="e.g. Gavin — who can actually unblock this"
                className={textFieldClass}
              />
              {todo.waiting_on && (
                <button
                  onClick={() =>
                    patch({ waiting_on: null, waiting_since: null, status: 'todo' })
                  }
                  title="No longer waiting"
                  className="tap-scale shrink-0 rounded-full border border-hairline px-2.5 py-1.5 text-[11px] text-ink-muted hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>
            {todo.waiting_since && (
              <p className="mt-1 text-[11px] text-ink-muted">
                waiting since {formatDateTime(todo.waiting_since)}
              </p>
            )}
          </LabeledField>

          {/* When the work actually finished — the click is only the default evidence.
              Rendered and edited in Pacific, the dashboard's clock. */}
          {todo.status === 'done' && (
            <LabeledField label="Finished (PT)">
              <input
                type="datetime-local"
                value={pacificInputValue(todo.completed_at)}
                onChange={(e) => {
                  const iso = pacificToISO(e.target.value);
                  if (iso && iso !== todo.completed_at) patch({ completed_at: iso });
                }}
                className={textFieldClass}
              />
              {todo.completed_source && (
                <p className="mt-1 text-[10px] text-ink-muted">
                  {FINISHED_CAPTION[todo.completed_source]}
                </p>
              )}
            </LabeledField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Contact">
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                onBlur={() => contact !== (todo.contact ?? '') && patch({ contact })}
                placeholder="e.g. Allison Buckles"
                className={textFieldClass}
              />
            </LabeledField>
            <LabeledField label="Category">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onBlur={() => category !== (todo.category ?? '') && patch({ category })}
                placeholder="e.g. Rippling"
                className={textFieldClass}
              />
            </LabeledField>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              People
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {linkedPeople.map((p) => (
                <span
                  key={p.id}
                  className="glass-field inline-flex items-center gap-1.5 rounded-full border border-hairline pl-3 pr-1.5 py-1 text-xs text-ink"
                >
                  <button type="button" onClick={() => onOpenPerson(p.id)} className="tap-scale hover:underline">
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUnlinkPerson(todo.id, p.id)}
                    className="tap-scale inline-flex items-center justify-center w-4 h-4 rounded-full text-ink-muted hover:bg-black/10"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              {linkedPeople.length === 0 && <p className="text-xs text-ink-muted">No one linked yet.</p>}
            </div>
            <div className="relative">
              <input
                value={personQuery}
                onChange={(e) => setPersonQuery(e.target.value)}
                placeholder="Link someone from People…"
                className={textFieldClass}
              />
              {suggestions.length > 0 && (
                <div className="glass-panel absolute z-10 mt-1 w-full rounded-lg border border-hairline overflow-hidden">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onLinkPerson(todo.id, p.id);
                        setPersonQuery('');
                      }}
                      className="tap-scale flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-black/5"
                    >
                      <UserPlus size={12} className="text-ink-muted shrink-0" />
                      {p.name}
                      {p.company && <span className="text-ink-muted text-xs">· {p.company}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <LabeledField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (todo.description ?? '') && patch({ description })}
              rows={4}
              placeholder="Add a description…"
              className={`${textFieldClass} resize-none`}
            />
          </LabeledField>

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Link URL">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onBlur={() => linkUrl !== (todo.link_url ?? '') && patch({ link_url: linkUrl })}
                placeholder="https://"
                className={textFieldClass}
              />
            </LabeledField>
            <LabeledField label="Link label">
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                onBlur={() => linkLabel !== (todo.link_label ?? '') && patch({ link_label: linkLabel })}
                placeholder="e.g. LAN-100"
                className={textFieldClass}
              />
            </LabeledField>
          </div>

          {todo.link_url && (
            <a
              href={todo.link_url}
              target="_blank"
              rel="noreferrer"
              className="tap-scale glass-field -mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs text-ink"
            >
              <Link2 size={11} />
              {todo.link_label || todo.link_url}
            </a>
          )}

          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Comments
            </label>
            <div className="flex flex-col gap-2 mb-2">
              {comments.map((c) => (
                <div key={c.id} className="glass-field rounded-lg border border-hairline px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wide text-ink-muted">
                      {c.source === 'slack' ? 'Slack' : 'App'}
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-ink whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-xs text-ink-muted">No comments yet.</p>}
            </div>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder="Add a comment…"
                  className="glass-field flex-1 rounded-full border border-hairline px-3.5 py-2 text-sm outline-none focus:border-ink/30"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || sending}
                  className="tap-scale inline-flex items-center justify-center w-9 h-9 rounded-full bg-ink text-white disabled:opacity-30"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Activity
            </label>
            <div className="flex flex-col gap-2.5">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-xs text-ink-muted">
                  <Clock size={11} className="mt-0.5 shrink-0" />
                  <span>
                    {ACTIVITY_LABEL[a.action] ?? a.action} ·{' '}
                    <span className="font-mono">{formatDateTime(a.created_at)}</span>
                  </span>
                </div>
              ))}
              {activity.length === 0 && <p className="text-xs text-ink-muted">No activity yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const FINISHED_CAPTION = {
  click: 'stamped when you hit Done — edit if it actually finished earlier',
  evidence: 'per evidence from your tools',
  manual: 'set by you',
};

function LabeledField({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function FieldSelect({ value, options, onChange, urgent }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`glass-field rounded-full border px-3 py-1.5 text-xs outline-none appearance-none cursor-pointer ${
        urgent && value === 'urgent' ? 'border-clay bg-clay-soft! text-clay' : 'border-hairline text-ink'
      }`}
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
