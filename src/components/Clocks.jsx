import { useEffect, useState } from 'react';

function timeIn(tz) {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Live Philippines + San Francisco clocks. Dual purpose: Amy stops checking a Chrome
// extension, and the team can see "this is Amy's time" at a glance.
export default function Clocks() {
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2.5 font-mono text-[11px] text-ink-muted">
      <span className="inline-flex items-center gap-1">
        <span aria-hidden>🇵🇭</span> PH {timeIn('Asia/Manila')}
      </span>
      <span className="text-hairline">·</span>
      <span className="inline-flex items-center gap-1">
        <span aria-hidden>🇺🇸</span> SF {timeIn('America/Los_Angeles')}
      </span>
    </div>
  );
}
