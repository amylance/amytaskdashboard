import { priorityOf } from '../lib/visuals.js';

// Normal priority renders nothing on purpose — only exceptions earn colour, so High and
// Urgent are the only things competing for attention.
export default function PriorityBadge({ priority, className = '' }) {
  const p = priorityOf(priority);
  if (!p.show) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${p.chip} ${className}`}
    >
      <span aria-hidden className="text-[9px]">{p.mark}</span>
      {p.label}
    </span>
  );
}
