import { Building2, Phone, Mail, BadgeCheck, HelpCircle } from 'lucide-react';

export default function PersonCard({ person, onClick }) {
  const subtitle = [person.role, person.company].filter(Boolean).join(' at ');
  const verified = person.verification_tier === 'verified';

  return (
    <div
      onClick={onClick}
      className="tap-scale cursor-pointer rounded-xl border border-hairline bg-panel p-4 hover:bg-black/[0.03]"
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <h3 className="text-sm font-semibold text-ink">{person.name}</h3>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            verified ? 'bg-emerald-500/10 text-emerald-700' : 'bg-clay-soft text-clay'
          }`}
        >
          {verified ? <BadgeCheck size={11} /> : <HelpCircle size={11} />}
          {verified ? 'Verified' : 'Unverified'}
        </span>
      </div>
      {subtitle && (
        <p className="text-xs text-ink-muted mb-2 flex items-center gap-1">
          <Building2 size={11} className="shrink-0" />
          {subtitle}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {person.phone && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
            <Phone size={11} />
            {person.phone}
          </span>
        )}
        {person.email && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted truncate">
            <Mail size={11} />
            {person.email}
          </span>
        )}
      </div>
    </div>
  );
}
