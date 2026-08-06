import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

export default function PassphraseGate({ onSubmit, error }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value || submitting) return;
    setSubmitting(true);
    await onSubmit(value);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-backdrop flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-panel border border-hairline rounded-2xl p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      >
        <div className="w-10 h-10 rounded-full bg-clay-soft flex items-center justify-center mb-5">
          <Lock size={18} className="text-clay" strokeWidth={2} />
        </div>
        <h1 className="text-lg font-semibold text-ink mb-1">Task Dashboard</h1>
        <p className="text-sm text-ink-muted mb-6">Enter the passphrase to continue.</p>

        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Passphrase"
          className="w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink/30 transition-colors"
        />

        {error && <p className="mt-3 text-sm text-clay">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !value}
          className="tap-scale mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink text-white text-sm font-medium py-2.5 disabled:opacity-40"
        >
          {submitting ? 'Checking…' : 'Enter'}
          {!submitting && <ArrowRight size={15} />}
        </button>
      </form>
    </div>
  );
}
