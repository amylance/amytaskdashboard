import InboxSection from '../components/InboxSection.jsx';
import RecoverStrip, { removedAt } from '../components/RecoverStrip.jsx';
import { useInbox } from '../hooks/useInbox.js';

// The first tab: everything captured but not yet decided. Nothing here is a task until
// Amy approves it.
export default function InboxView({ config, dismissed = [], onRestore, onRefreshRemoved, onDismissed }) {
  const { items, sweep, resolve, refresh } = useInbox(config);

  // Dismissing is the highest-regret action here — she triages fast, on purpose. Refresh
  // the recoverable list right after so the strip below is never stale.
  async function handleResolve(id, action, fields) {
    const item = items.find((i) => i.id === id);
    await resolve(id, action, fields);
    if (action === 'dismiss') {
      await onRefreshRemoved?.();
      if (item) onDismissed?.(item);
    }
  }

  // Restoring has to put the item back into the visible queue too — realtime is degraded,
  // so without an explicit refresh the row would leave the strip yet not reappear above.
  async function handleRestore(item) {
    await onRestore(item);
    await refresh();
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
        onRestore={handleRestore}
        describe={removedAt}
      />
    </div>
  );
}
