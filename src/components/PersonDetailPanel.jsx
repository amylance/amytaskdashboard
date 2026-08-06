import { useEffect, useState } from 'react';
import { X, Trash2, Send, ListChecks } from 'lucide-react';
import { formatDateTime, shortId } from '../lib/format.js';
import { usePersonDetail } from '../hooks/usePersonDetail.js';

const textFieldClass =
  'glass-field w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-ink/30';

const STATUS_LABEL = { todo: 'To Do', doing: 'Doing', review: 'Review', done: 'Done' };

export default function PersonDetailPanel({ person, config, onClose, onChange, onDelete, onOpenTodo }) {
  const { notes, todos, addNote } = usePersonDetail(person?.id, config);
  const [name, setName] = useState(person?.name ?? '');
  const [company, setCompany] = useState(person?.company ?? '');
  const [role, setRole] = useState(person?.role ?? '');
  const [phone, setPhone] = useState(person?.phone ?? '');
  const [email, setEmail] = useState(person?.email ?? '');
  const [noteText, setNoteText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setName(person?.name ?? '');
    setCompany(person?.company ?? '');
    setRole(person?.role ?? '');
    setPhone(person?.phone ?? '');
    setEmail(person?.email ?? '');
  }, [person?.id]);

  if (!person) return null;

  function patch(fields) {
    onChange(person.id, fields);
  }

  async function handleSendNote() {
    const body = noteText.trim();
    if (!body || sending) return;
    setSending(true);
    await addNote(body);
    setNoteText('');
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 frosted overlay-in" onClick={onClose} />

      <div className="glass-panel relative slide-in-panel w-full max-w-md h-full border-l flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline shrink-0">
          <span className="font-mono text-xs text-ink-muted">{shortId(person.id)}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(person.id)}
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
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== person.name && patch({ name: name.trim() })}
            className="w-full text-lg font-semibold text-ink outline-none bg-transparent leading-snug"
          />

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Company">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onBlur={() => company !== (person.company ?? '') && patch({ company })}
                placeholder="e.g. Rippling"
                className={textFieldClass}
              />
            </LabeledField>
            <LabeledField label="Role">
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onBlur={() => role !== (person.role ?? '') && patch({ role })}
                placeholder="e.g. Recruiter"
                className={textFieldClass}
              />
            </LabeledField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => phone !== (person.phone ?? '') && patch({ phone })}
                placeholder="(555) 555-5555"
                className={textFieldClass}
              />
            </LabeledField>
            <LabeledField label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => email !== (person.email ?? '') && patch({ email })}
                placeholder="name@company.com"
                className={textFieldClass}
              />
            </LabeledField>
          </div>

          {todos.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                Linked tasks
              </label>
              <div className="flex flex-col gap-1.5">
                {todos.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onOpenTodo(t.id)}
                    className="tap-scale glass-field flex items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2 text-left"
                  >
                    <span className="inline-flex items-center gap-1.5 text-sm text-ink truncate">
                      <ListChecks size={12} className="shrink-0 text-ink-muted" />
                      {t.title}
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted shrink-0">{STATUS_LABEL[t.status]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Notes
            </label>
            <div className="flex flex-col gap-2 mb-2">
              {notes.map((n) => (
                <div key={n.id} className="glass-field rounded-lg border border-hairline px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wide text-ink-muted">
                      {n.source === 'slack' ? 'Slack' : 'App'}
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-ink whitespace-pre-wrap">{n.body}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-xs text-ink-muted">Nothing heard yet.</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                placeholder="What did you hear?"
                className="glass-field flex-1 rounded-full border border-hairline px-3.5 py-2 text-sm outline-none focus:border-ink/30"
              />
              <button
                onClick={handleSendNote}
                disabled={!noteText.trim() || sending}
                className="tap-scale inline-flex items-center justify-center w-9 h-9 rounded-full bg-ink text-white disabled:opacity-30"
              >
                <Send size={14} />
              </button>
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
