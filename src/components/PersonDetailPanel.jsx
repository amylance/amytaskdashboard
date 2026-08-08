import { useEffect, useState } from 'react';
import { X, Trash2, Send, ListChecks, BadgeCheck, HelpCircle, ExternalLink } from 'lucide-react';
import { formatDateTime, shortId } from '../lib/format.js';
import { usePersonDetail } from '../hooks/usePersonDetail.js';

const textFieldClass =
  'glass-field w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-ink/30';

const STATUS_LABEL = { todo: 'To Do', doing: 'Doing', review: 'Review', done: 'Done' };
const SOURCE_LABEL = { app: 'App', slack: 'Slack', fireflies: 'Fireflies', email: 'Email' };
const ACTIVITY_LABEL = {
  meeting: 'Meeting',
  slack_thread: 'Slack thread',
  slack_message: 'Slack message',
  email: 'Email',
  note: 'Note',
};

function isUrl(v) {
  return typeof v === 'string' && /^https?:\/\//i.test(v.trim());
}

export default function PersonDetailPanel({ person, config, onClose, onChange, onDelete, onOpenTodo }) {
  const { notes, todos, addNote } = usePersonDetail(person?.id, config);
  const [name, setName] = useState(person?.name ?? '');
  const [company, setCompany] = useState(person?.company ?? '');
  const [role, setRole] = useState(person?.role ?? '');
  const [phone, setPhone] = useState(person?.phone ?? '');
  const [email, setEmail] = useState(person?.email ?? '');
  const [department, setDepartment] = useState(person?.department ?? '');
  const [reportsTo, setReportsTo] = useState(person?.reports_to ?? '');
  const [location, setLocation] = useState(person?.location ?? '');
  const [verifySource, setVerifySource] = useState(person?.verification_source ?? '');
  const [noteText, setNoteText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setName(person?.name ?? '');
    setCompany(person?.company ?? '');
    setRole(person?.role ?? '');
    setPhone(person?.phone ?? '');
    setEmail(person?.email ?? '');
    setDepartment(person?.department ?? '');
    setReportsTo(person?.reports_to ?? '');
    setLocation(person?.location ?? '');
    setVerifySource(person?.verification_source ?? '');
  }, [person?.id]);

  if (!person) return null;

  const verified = person.verification_tier === 'verified';

  function patch(fields) {
    onChange(person.id, fields);
  }

  function markVerified() {
    patch({ verification_tier: 'verified', verification_source: verifySource.trim() || null });
  }

  function markUnverified() {
    patch({ verification_tier: 'unverified' });
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

          {/* Verification block — the reputational safeguard (Item 20). */}
          <div className={`rounded-xl border p-3 ${verified ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-clay/30 bg-clay-soft'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              {verified ? (
                <BadgeCheck size={14} className="text-emerald-600" />
              ) : (
                <HelpCircle size={14} className="text-clay" />
              )}
              <span className={`text-xs font-semibold uppercase tracking-wide ${verified ? 'text-emerald-700' : 'text-clay'}`}>
                {verified ? 'Verified' : 'Unverified'}
              </span>
            </div>

            {verified ? (
              <>
                {person.verification_source ? (
                  isUrl(person.verification_source) ? (
                    <a
                      href={person.verification_source}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-clay hover:underline break-all"
                    >
                      <ExternalLink size={11} className="shrink-0" /> {person.verification_source}
                    </a>
                  ) : (
                    <p className="text-xs text-ink-muted">{person.verification_source}</p>
                  )
                ) : (
                  <p className="text-xs text-ink-muted">No source recorded.</p>
                )}
                <button
                  onClick={markUnverified}
                  className="tap-scale mt-2 text-[11px] font-medium text-ink-muted hover:text-clay"
                >
                  Mark unverified
                </button>
              </>
            ) : (
              <>
                <input
                  value={verifySource}
                  onChange={(e) => setVerifySource(e.target.value)}
                  placeholder="Where's the verification? (link, or e.g. 'Gavin confirmed on 8/6 call')"
                  className={textFieldClass}
                />
                <button
                  onClick={markVerified}
                  className="tap-scale mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ink text-white text-xs font-medium px-3 py-1.5"
                >
                  <BadgeCheck size={13} /> Mark verified
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Company">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onBlur={() => company !== (person.company ?? '') && patch({ company })}
                placeholder="e.g. OTO Hotels"
                className={textFieldClass}
              />
            </LabeledField>
            <LabeledField label="Role">
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onBlur={() => role !== (person.role ?? '') && patch({ role })}
                placeholder="e.g. GM"
                className={textFieldClass}
              />
            </LabeledField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Department">
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                onBlur={() => department !== (person.department ?? '') && patch({ department })}
                placeholder="e.g. Operations"
                className={textFieldClass}
              />
            </LabeledField>
            <LabeledField label="Reports to">
              <input
                value={reportsTo}
                onChange={(e) => setReportsTo(e.target.value)}
                onBlur={() => reportsTo !== (person.reports_to ?? '') && patch({ reports_to: reportsTo })}
                placeholder="e.g. Gavin"
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

          <LabeledField label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => location !== (person.location ?? '') && patch({ location })}
              placeholder="e.g. San Francisco"
              className={textFieldClass}
            />
          </LabeledField>

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

          {/* Activity log — the awareness timeline, newest first, with clickable source links. */}
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Activity log
            </label>
            <div className="flex flex-col gap-2 mb-2">
              {notes.map((n) => (
                <div key={n.id} className="glass-field rounded-lg border border-hairline px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wide text-ink-muted">
                      {SOURCE_LABEL[n.source] ?? 'App'}
                      {n.activity_type ? ` · ${ACTIVITY_LABEL[n.activity_type] ?? n.activity_type}` : ''}
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">
                      {formatDateTime(n.occurred_at ?? n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-ink whitespace-pre-wrap">{n.body}</p>
                  {n.source_url && (
                    <a
                      href={n.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-clay hover:underline"
                    >
                      <ExternalLink size={11} /> Open source
                    </a>
                  )}
                </div>
              ))}
              {notes.length === 0 && <p className="text-xs text-ink-muted">Nothing logged yet.</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                placeholder="What did you hear or see?"
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
