import { Building2, Phone, Mail } from 'lucide-react';

export default function PersonCard({ person, onClick }) {
  const subtitle = [person.role, person.company].filter(Boolean).join(' at ');

  return (
    <div
      onClick={onClick}
      className="tap-scale cursor-pointer rounded-xl border border-hairline bg-panel p-4 hover:bg-black/[0.03]"
    >
      <h3 className="text-sm font-semibold text-ink mb-0.5">{person.name}</h3>
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
