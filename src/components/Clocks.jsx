import { useEffect, useState } from 'react';

function timeIn(tz) {
  // 12-hour with AM/PM, e.g. "3:05 PM"
  return new Date().toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Stacked world-clock: San Francisco on top, Philippines below. 12-hour with AM/PM,
// so "this is Amy's time" reads at a glance for anyone on the dashboard.
export default function Clocks() {
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hidden sm:flex flex-col gap-0.5 leading-tight font-mono text-[10px] text-ink-muted">
      <span className="inline-flex items-center gap-1">
        <span aria-hidden>🇺🇸</span> SF <span className="text-ink">{timeIn('America/Los_Angeles')}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <span aria-hidden>🇵🇭</span> PH <span className="text-ink">{timeIn('Asia/Manila')}</span>
      </span>
    </div>
  );
}
