import { useState } from 'react';
import { X } from 'lucide-react';

const fieldClass =
  'glass-field w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink/30 placeholder:text-ink-muted/60';

export default function CreatePersonModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        company: company.trim(),
        role: role.trim(),
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim(),
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
          <h2 className="text-lg font-semibold text-ink">New person</h2>
          <button
            type="button"
            onClick={onClose}
            className="tap-scale glass-field inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <Field label="Name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={fieldClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Company">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Rippling"
              className={fieldClass}
            />
          </Field>
          <Field label="Role">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Recruiter"
              className={fieldClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className={fieldClass}
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className={fieldClass}
            />
          </Field>
        </div>

        <Field label="First note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you hear about them?"
            rows={3}
            className={`${fieldClass} resize-none`}
          />
        </Field>

        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="tap-scale w-full rounded-lg bg-ink text-white text-sm font-medium py-2.5 disabled:opacity-40 mt-1"
        >
          {submitting ? 'Adding…' : 'Add person'}
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
