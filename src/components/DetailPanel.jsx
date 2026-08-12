import { useEffect, useState } from 'react';
import { Lock, Trash2, ExternalLink, CornerDownRight, BookOpen, Plus } from 'lucide-react';
import { STATUSES, PRIORITIES } from '../lib/constants.js';
import { statusOf } from '../lib/visuals.js';

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
import BackButton from './BackButton.jsx';

const textFieldClass =
  'glass-field w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-ink/30';

export default function DetailPanel({
  todo,
  goal,
  steps = [],
  onClose,
  onChange,
  onDelete,
  onOpen,
  onAddStep,
  highlightStepId = null,
  readOnly = false,
}) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [contact, setContact] = useState(todo?.contact ?? '');
  const [category, setCategory] = useState(todo?.category ?? '');
  const [waitingOn, setWaitingOn] = useState(todo?.waiting_on ?? '');
  const [newStep, setNewStep] = useState('');

  useEffect(() => {
    setTitle(todo?.title ?? '');
    setDescription(todo?.description ?? '');
    setContact(todo?.contact ?? '');
    setCategory(todo?.category ?? '');
    setWaitingOn(todo?.waiting_on ?? '');
    setNewStep('');
  }, [todo?.id]);

  if (!todo) return null;

  // Gavin and Isaac open cards from the same panel Amy does. They should read everything —
  // that is the point of sharing the board — and change nothing. The server already refuses
  // their writes; this stops the panel from offering an edit that would silently fail.
  function patch(fields) {
    if (readOnly) return;
    onChange(todo.id, fields);
  }

  const doneSteps = steps.filter((s) => s.status === 'done').length;

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
            <BackButton onClose={onClose} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* A step opens with its goal above it, and the goal is one tap away. Amy reaches
              a step from the Calendar, where the only context is the day it happened. */}
          {goal && (
            <button
              onClick={() => onOpen(goal.id)}
              className="tap-scale -mb-2 flex items-center gap-1.5 self-start text-[11px] text-ink-muted hover:text-ink"
            >
              <CornerDownRight size={11} />
              step of <span className="font-medium text-ink underline">{goal.title}</span>
            </button>
          )}

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

          {/* The steps. Each one is a real card on the board — this is the mirror, so she can
              see from the goal where every piece of it currently sits without hunting the
              columns. Clicking one opens it. */}
          {(steps.length > 0 || !readOnly) && !goal && (
            <div className="rounded-xl border border-hairline bg-panel px-3.5 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wide text-ink-muted">
                  Steps
                </span>
                {steps.length > 0 && (
                  <span className="font-mono text-[10px] text-ink-muted">
                    {doneSteps}/{steps.length} done
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {steps.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onOpen(s.id)}
                    className={`tap-scale flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-black/[0.04] ${
                      highlightStepId === s.id ? 'ring-2 ring-clay bg-clay-soft/50' : ''
                    }`}
                  >
                    <span className={s.status === 'done' ? 'text-emerald-600' : 'text-ink-muted/60'}>
                      {s.status === 'done' ? '✓' : '○'}
                    </span>
                    <span
                      className={`flex-1 truncate text-[13px] ${
                        s.status === 'done' ? 'text-ink-muted line-through' : 'text-ink'
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className={`shrink-0 font-mono text-[10px] ${statusOf(s.status).text}`}>
                      {statusOf(s.status).label}
                    </span>
                  </button>
                ))}
                {steps.length === 0 && (
                  <p className="text-xs text-ink-muted">
                    No steps. Add one and this becomes a goal that closes when they all do.
                  </p>
                )}
              </div>

              {!readOnly && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={newStep}
                    onChange={(e) => setNewStep(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' || !newStep.trim()) return;
                      onAddStep(todo.id, newStep.trim());
                      setNewStep('');
                    }}
                    placeholder="Add a step — verb first, e.g. Ask Google tech"
                    className="glass-field flex-1 rounded-full border border-hairline px-3.5 py-1.5 text-[13px] outline-none focus:border-ink/30"
                  />
                  <button
                    onClick={() => {
                      if (!newStep.trim()) return;
                      onAddStep(todo.id, newStep.trim());
                      setNewStep('');
                    }}
                    disabled={!newStep.trim()}
                    className="tap-scale inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}

              {steps.length > 0 && (
                <p className="mt-2 text-[10px] text-ink-muted/80">
                  This closes itself when the last step does.
                </p>
              )}
            </div>
          )}

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
              title="Only set this when a source actually named a date"
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
            {/* Amy's rule: routine work does not need a paper trail. Only the tasks that will
                become a repeatable method keep the full history of what pivoted and why. */}
            <button
              onClick={() => patch({ is_method: !todo.is_method })}
              title="Keep the full history — this one is going to become a method"
              className={`tap-scale inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                todo.is_method ? 'border-clay bg-clay-soft text-clay' : 'glass-field border-hairline text-ink-muted'
              }`}
            >
              <BookOpen size={11} />
              Method
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
