import { useEffect, useState } from 'react';

const PT = 'America/Los_Angeles';
const PH = 'Asia/Manila';

// 2-digit hour so the two rows stay column-aligned and are easy to compare at a glance.
function parts(tz) {
  const now = new Date();
  return {
    day: now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' }),
    date: now.toLocaleDateString('en-US', { timeZone: tz, month: 'short', day: '2-digit' }),
    time: now.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    key: new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now),
  };
}

// Stacked world-clock. Amy is 15 hours ahead of the team, so her date is often a day
// ahead — showing weekday and date on both rows makes that impossible to lose track of,
// and the dashboard itself runs on Pacific.
export default function Clocks() {
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const sf = parts(PT);
  const ph = parts(PH);
  const dayAhead = ph.key > sf.key;

  return (
    <div className="hidden sm:flex flex-col gap-0.5 leading-tight font-mono text-[10px] text-ink-muted">
      <Row flag="🇺🇸" label="SF" p={sf} note="dashboard" />
      <Row flag="🇵🇭" label="PH" p={ph} note={dayAhead ? 'you · next day' : 'you'} />
    </div>
  );
}

function Row({ flag, label, p, note }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span aria-hidden>{flag}</span>
      <span className="w-5">{label}</span>
      <span className="w-8 text-ink">{p.day}</span>
      <span className="w-12 text-ink">{p.date}</span>
      <span className="text-ink tabular-nums">{p.time}</span>
      <span className="text-ink-muted/70">· {note}</span>
    </span>
  );
}
