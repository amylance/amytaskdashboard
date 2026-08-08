import { useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, Globe } from 'lucide-react';
import { useProfile } from '../hooks/useProfile.js';

// Profile / Memory tab (items 3 + 11). The durable memory of who Amy is. Each section is
// public or private; private sections stay hidden behind a reveal (soft privacy — the
// dashboard is one shared passphrase, so this keeps personal notes out of the default
// view rather than locking them per-person).
export default function ProfileView({ config }) {
  const { sections, updateSection } = useProfile(config);
  const [showPrivate, setShowPrivate] = useState(false);

  const publicSections = useMemo(() => sections.filter((s) => s.visibility !== 'private'), [sections]);
  const privateSections = useMemo(() => sections.filter((s) => s.visibility === 'private'), [sections]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-ink">Amy — Profile & Memory</h1>
        <p className="text-xs text-ink-muted mt-1">
          What I&apos;ve learned about myself and how I work since day one — visible to anyone with the
          dashboard. Sections marked <span className="text-clay font-medium">private</span> stay hidden until revealed.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {publicSections.map((s) => (
          <SectionCard key={s.id} section={s} onUpdate={updateSection} />
        ))}
      </div>

      {privateSections.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowPrivate((v) => !v)}
            className="tap-scale inline-flex items-center gap-2 rounded-full border border-hairline bg-panel px-3.5 py-2 text-sm text-ink-muted hover:text-ink"
          >
            {showPrivate ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPrivate ? 'Hide private' : `Show private (${privateSections.length})`}
          </button>

          {showPrivate && (
            <div className="flex flex-col gap-3 mt-3">
              {privateSections.map((s) => (
                <SectionCard key={s.id} section={s} onUpdate={updateSection} />
              ))}
            </div>
          )}
        </div>
      )}
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
          title={isPrivate ? 'Make public' : 'Make private'}
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
        data-section-id={section.id}
        onChange={(e) => setBody(e.target.value)}
        onBlur={() => body !== section.body && onUpdate(section.id, { body })}
        rows={Math.max(3, body.split('\n').length)}
        className="w-full resize-none bg-transparent text-sm text-ink leading-relaxed outline-none"
      />
    </div>
  );
}
