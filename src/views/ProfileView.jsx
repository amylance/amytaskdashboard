import { useMemo, useState } from 'react';
import { EyeOff, Eye, Lock, Globe, ShieldCheck } from 'lucide-react';
import { useProfile } from '../hooks/useProfile.js';

// Profile / Memory tab (items 3 + 11). Amy's OWN record — for her visibility and
// transparency — of who she is and what she's poured into the Lance network (Claude,
// the tools, her emails). Not a team profile. Sections are private by default and shown
// to her; a "Hide private" switch tucks them away when she's screen-sharing.
// (Soft privacy: the dashboard is one shared passphrase, so true per-person locking
// waits on real logins — until then this keeps personal notes out of view on demand.)
export default function ProfileView() {
  const { sections, locked, loading, unlock, updateSection } = useProfile();
  const [hidePrivate, setHidePrivate] = useState(false);
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  // NOTE: every hook must run on every render — keep these ABOVE the early returns
  // below, or React throws "rendered more hooks than during the previous render".
  const visible = useMemo(
    () => (hidePrivate ? sections.filter((s) => s.visibility !== 'private') : sections),
    [sections, hidePrivate],
  );
  const privateCount = useMemo(
    () => sections.filter((s) => s.visibility === 'private').length,
    [sections],
  );

  async function handleUnlock(e) {
    e.preventDefault();
    if (!entry.trim() || checking) return;
    setChecking(true);
    setError(null);
    try {
      await unlock(entry.trim());
      setEntry('');
    } catch {
      setError('Incorrect passphrase.');
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-6 py-16 text-center text-sm text-ink-muted">Loading…</div>;
  }

  if (locked) {
    return (
      <div className="max-w-sm mx-auto px-6 py-20">
        <div className="rounded-2xl border border-hairline bg-panel p-6 text-center">
          <Lock size={20} className="mx-auto mb-3 text-clay" />
          <h1 className="text-base font-semibold text-ink mb-1">Profile & Memory is private</h1>
          <p className="text-xs text-ink-muted mb-5 leading-relaxed">
            This section has its own passphrase — the dashboard passphrase doesn&apos;t open it.
          </p>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              autoFocus
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Profile passphrase"
              className="glass-field w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink/30 mb-3"
            />
            {error && <p className="text-xs text-clay mb-2">{error}</p>}
            <button
              type="submit"
              disabled={!entry.trim() || checking}
              className="tap-scale w-full rounded-lg bg-ink text-white text-sm font-medium py-2.5 disabled:opacity-40"
            >
              {checking ? 'Checking…' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={16} className="text-clay" />
          <h1 className="text-lg font-semibold text-ink">Amy — Profile & Memory</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-clay-soft px-2 py-0.5 text-[10px] font-medium text-clay">
            <Lock size={10} /> Private
          </span>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          My own record — for my visibility and transparency — of what I&apos;ve poured into the Lance
          network: what I&apos;ve given Claude, the tools, and my emails. This is my ledger, not a team
          profile. It sits behind its own passphrase, so the dashboard passphrase alone can&apos;t
          open it. Use <span className="text-ink font-medium">Hide private</span> before screen-sharing.
        </p>
      </div>

      {privateCount > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setHidePrivate((v) => !v)}
            className="tap-scale inline-flex items-center gap-2 rounded-full border border-hairline bg-panel px-3.5 py-1.5 text-xs text-ink-muted hover:text-ink"
          >
            {hidePrivate ? <Eye size={13} /> : <EyeOff size={13} />}
            {hidePrivate ? `Show private (${privateCount})` : 'Hide private'}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visible.map((s) => (
          <SectionCard key={s.id} section={s} onUpdate={updateSection} />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-ink-muted text-center py-10 border border-dashed border-hairline rounded-2xl">
            All sections are private and currently hidden.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section, onUpdate }) {
  const [body, setBody] = useState(section.body ?? '');
  const isPrivate = section.visibility === 'private';

  return (
    <div className={`rounded-xl border p-4 ${isPrivate ? 'border-clay/30 bg-clay-soft' : 'border-hairline bg-panel'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-sm font-semibold text-ink">{section.heading}</h2>
        <button
          onClick={() => onUpdate(section.id, { visibility: isPrivate ? 'public' : 'private' })}
          title={isPrivate ? 'Make public (team can see it)' : 'Make private (just me)'}
          className={`tap-scale inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            isPrivate ? 'bg-clay/10 text-clay' : 'bg-black/[0.04] text-ink-muted hover:text-ink'
          }`}
        >
          {isPrivate ? <Lock size={11} /> : <Globe size={11} />}
          {isPrivate ? 'Private' : 'Public'}
        </button>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={() => body !== section.body && onUpdate(section.id, { body })}
        rows={Math.max(3, body.split('\n').length)}
        className="w-full resize-none bg-transparent text-sm text-ink leading-relaxed outline-none"
      />
    </div>
  );
}
