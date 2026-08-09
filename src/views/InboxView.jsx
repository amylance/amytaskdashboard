import InboxSection from '../components/InboxSection.jsx';
import RecoverStrip, { removedAt } from '../components/RecoverStrip.jsx';
import { useInbox } from '../hooks/useInbox.js';

// The first tab: everything captured but not yet decided. Nothing here is a task until
// Amy approves it.
export default function InboxView({ config, dismissed = [], onRestore, onRefreshRemoved }) {
  const { items, sweep, resolve } = useInbox(config);

  // Dismissing is the highest-regret action here — she triages fast, on purpose. Refresh
  // the recoverable list right after so the strip below is never stale.
  async function handleResolve(id, action, fields) {
    await resolve(id, action, fields);
    if (action === 'dismiss') await onRefreshRemoved?.();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-ink">Inbox</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Captured from your tools, filtered to real commitments, and checked before it reaches you.
          Nothing becomes a task until you say so — say <span className="font-medium text-ink">“brief me”</span> to pull what&apos;s new.
        </p>
      </div>
      <InboxSection items={items} sweep={sweep} onResolve={handleResolve} />

      <RecoverStrip
        items={dismissed}
        noun="dismissed item"
        onRestore={onRestore}
        describe={removedAt}
      />
    </div>
  );
}
