import { useEffect, useState } from 'react';
import { X, Lock, Trash2, Send, Clock, Link2 } from 'lucide-react';
import { STATUSES, PRIORITIES } from '../lib/constants.js';
import { formatDateTime, shortId } from '../lib/format.js';
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

export default function DetailPanel({ todo, config, onClose, onChange, onDelete }) {
  const { comments, activity, addComment } = useTodoDetail(todo?.id, config);
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [contact, setContact] = useState(todo?.contact ?? '');
  const [category, setCategory] = useState(todo?.category ?? '');
  const [linkUrl, setLinkUrl] = useState(todo?.link_url ?? '');
  const [linkLabel, setLinkLabel] = useState(todo?.link_label ?? '');
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setTitle(todo?.title ?? '');
    setDescription(todo?.description ?? '');
    setContact(todo?.contact ?? '');
    setCategory(todo?.category ?? '');
    setLinkUrl(todo?.link_url ?? '');
    setLinkLabel(todo?.link_label ?? '');
  }, [todo?.id]);

  if (!todo) return null;

  function patch(fields) {
    onChange(todo.id, fields);
  }

  async function handleSendComment() {
    const body = commentText.trim();
    if (!body || sending) return;
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
            <button
              onClick={() => onDelete(todo.id)}
              title="Delete"
              className="tap-scale inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:bg-clay-soft hover:text-clay"
            >
              <Trash2 size={15} />
            </button>
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
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== todo.title && patch({ title: title.trim() })}
            rows={1}
            className="w-full resize-none text-lg font-semibold text-ink outline-none bg-transparent leading-snug"
          />

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
