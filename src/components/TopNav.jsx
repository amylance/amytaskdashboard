import { useEffect, useRef, useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { VIEWS } from '../lib/constants.js';
import Clocks from './Clocks.jsx';

export default function TopNav({ active, onChange, onLogout, onCreate, createLabel = 'New' }) {
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[active];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [active]);

  return (
    <header className="sticky top-0 z-30 bg-backdrop/90 backdrop-blur-sm border-b border-hairline">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs text-ink tracking-tight font-semibold">HQ</span>
          <Clocks />
        </div>

        <nav className="relative flex items-center gap-1 bg-panel border border-hairline rounded-full p-1">
          <span
            className="absolute top-1 bottom-1 rounded-full bg-ink transition-all duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
          {VIEWS.map((view) => (
            <button
              key={view.id}
              ref={(el) => (tabRefs.current[view.id] = el)}
              onClick={() => onChange(view.id)}
              className={`tap-scale relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                active === view.id ? 'text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {view.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCreate}
            className="tap-scale inline-flex items-center gap-1.5 rounded-full bg-ink text-white text-sm font-medium px-4 py-2"
          >
            <Plus size={15} />
            {createLabel}
          </button>
          <button
            onClick={onLogout}
            title="Log out"
            className="tap-scale inline-flex items-center justify-center w-9 h-9 rounded-full border border-hairline text-ink-muted hover:bg-black/5"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
