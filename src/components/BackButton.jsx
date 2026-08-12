import { ChevronLeft, X } from 'lucide-react';

// Every slide-in panel closes the same way. On a phone the panel covers the whole screen,
// so a bare X reads as "dismiss" rather than "go back" and Amy could not tell there was a
// way out at all. On a desktop the panel sits over a visible page and an X is the clearer
// word. Same control, same position, phrased for the screen it is on.
export default function BackButton({ onClose, label = 'Back' }) {
  return (
    <button
      onClick={onClose}
      aria-label={label}
      className="tap-scale inline-flex shrink-0 items-center justify-center gap-1 h-8 px-2 rounded-full text-ink-muted hover:bg-black/10"
    >
      <ChevronLeft size={16} className="sm:hidden" />
      <span className="sm:hidden text-xs">{label}</span>
      <X size={16} className="hidden sm:block" />
    </button>
  );
}
