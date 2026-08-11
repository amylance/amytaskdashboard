// The task's history, rendered from the markdown the sweep wrote. Deliberately tiny — no
// parser library for four constructs. Amy's format: bold label lines, bullets, and italic
// verbatim reserved for the moment a task changed.
function inline(text, key) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={`${key}-${i}`} className="font-semibold text-ink">{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('*') && p.endsWith('*')) {
      return <em key={`${key}-${i}`} className="italic text-ink-muted">{p.slice(1, -1)}</em>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={`${key}-${i}`} className="font-mono text-[11px] text-clay">{p.slice(1, -1)}</code>;
    }
    return <span key={`${key}-${i}`}>{p}</span>;
  });
}

export default function Story({ text }) {
  if (!text?.trim()) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {text.split('\n').map((raw, i) => {
        const line = raw.trim();
        if (!line) return <div key={i} className="h-1" />;

        const bullet = line.match(/^[•\-*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="shrink-0 text-ink-muted">•</span>
              <p className="text-[13px] leading-snug text-ink">{inline(bullet[1], i)}</p>
            </div>
          );
        }

        // A warning line is the one thing allowed to shout — it marks a pivot or an
        // unresolved consequence, which is exactly what Amy must not scroll past.
        if (line.startsWith('⚠')) {
          return (
            <p key={i} className="rounded-lg border border-clay/30 bg-clay-soft px-2.5 py-1.5 text-[13px] leading-snug text-ink">
              {inline(line, i)}
            </p>
          );
        }

        return <p key={i} className="text-[13px] leading-snug text-ink">{inline(line, i)}</p>;
      })}
    </div>
  );
}
