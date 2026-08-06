const STYLES = {
  normal: 'border border-hairline text-ink-muted',
  high: 'border border-ink/25 text-ink font-medium',
  urgent: 'bg-clay-soft text-clay font-medium',
};

const LABELS = { normal: 'Normal', high: 'High', urgent: 'Urgent' };

export default function PriorityBadge({ priority, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${STYLES[priority] ?? STYLES.normal} ${className}`}
    >
      {priority === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-clay" />}
      {LABELS[priority] ?? priority}
    </span>
  );
}
