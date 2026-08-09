import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

// The undo window is the moment anxiety peaks — right after you click. An affordance three
// tabs away is useless then. This sits under your thumb for ten seconds and catches almost
// every mistake, which is what makes fast triage feel safe enough to actually do.
const WINDOW_MS = 10000;

export default function UndoToast({ undo, onDismiss }) {
  const [remaining, setRemaining] = useState(100);

  useEffect(() => {
    if (!undo) return undefined;
    setRemaining(100);
    const started = Date.now();
    const tick = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - started) / WINDOW_MS) * 100);
      setRemaining(pct);
      if (pct <= 0) onDismiss();
    }, 100);
    return () => clearInterval(tick);
  }, [undo, onDismiss]);

  if (!undo) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm">
      <div className="glass-panel overflow-hidden rounded-xl border border-hairline shadow-lg">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-ink truncate">{undo.label}</p>
          <button
            onClick={() => {
              undo.onUndo();
              onDismiss();
            }}
            className="tap-scale shrink-0 inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1 text-xs font-medium text-ink hover:bg-black/5"
          >
            <RotateCcw size={12} />
            Undo
          </button>
        </div>
        {/* A draining bar reads as "time left" without needing a number. */}
        <div className="h-0.5 bg-hairline">
          <div className="h-full bg-ink/40 transition-none" style={{ width: `${remaining}%` }} />
        </div>
      </div>
    </div>
  );
}
