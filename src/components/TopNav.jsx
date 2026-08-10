import { useEffect, useRef, useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { VIEWS } from '../lib/constants.js';
import Clocks from './Clocks.jsx';

// Desktop: HQ · clocks · tabs · actions on one line. Mobile: three stacked rows —
// identity, clocks, then the tabs scrolling inside their own strip. The page itself must
// never pan sideways: seven tabs are wider than any phone, and if the bar overflows the
// viewport the whole dashboard drags with it.
export default function TopNav({ active, onChange, onLogout, onCreate, createLabel = 'New', canCreate = true, readOnly = false }) {
  const tabRefs = useRef({});
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[active];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
      // Keep the active tab in view inside the scrollable strip on phones.
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [active]);

  return (
    <header className="sticky top-0 z-30 bg-backdrop/90 backdrop-blur-sm border-b border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="order-1 flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs text-ink tracking-tight font-semibold">HQ</span>
          <Clocks />
          {readOnly && (
            <span className="rounded-full border border-hairline bg-panel px-2 py-0.5 text-[10px] font-mono text-ink-muted">
              view only
            </span>
          )}
        </div>

        <div className="order-2 sm:order-4 flex items-center gap-2 shrink-0">
          {canCreate && (
            <button
              onClick={onCreate}
              className="tap-scale inline-flex items-center gap-1.5 rounded-full bg-ink text-white text-sm font-medium px-4 py-2"
            >
              <Plus size={15} />
              {createLabel}
            </button>
          )}
          <button
            onClick={onLogout}
            title="Log out"
            className="tap-scale inline-flex items-center justify-center w-9 h-9 rounded-full border border-hairline text-ink-muted hover:bg-black/5"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Phones get the clocks on their own row — Amy reads the timezone pair most when
            she's on her phone half-awake, so it can't hide like it does on a narrow tab bar. */}
        <div className="order-3 sm:hidden w-full">
          <Clocks className="flex" />
        </div>

        <nav
          ref={navRef}
          className="order-4 sm:order-3 w-full sm:w-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="relative inline-flex items-center gap-1 bg-panel border border-hairline rounded-full p-1 whitespace-nowrap">
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
          </div>
        </nav>
      </div>
    </header>
  );
}
