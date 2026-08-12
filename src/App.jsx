import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useSession } from './hooks/useSession.js';
import { useTodos } from './hooks/useTodos.js';
import { usePeople } from './hooks/usePeople.js';
import { useRecoverable } from './hooks/useRecoverable.js';
import { api } from './lib/api.js';
import { indexSteps } from './lib/steps.js';
import UndoToast from './components/UndoToast.jsx';
import PassphraseGate from './components/PassphraseGate.jsx';
import TopNav from './components/TopNav.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import PersonDetailPanel from './components/PersonDetailPanel.jsx';
import CreateTodoModal from './components/CreateTodoModal.jsx';
import CreatePersonModal from './components/CreatePersonModal.jsx';
import KanbanView from './views/KanbanView.jsx';
import InboxView from './views/InboxView.jsx';
import ListView from './views/ListView.jsx';
import TimelineView from './views/TimelineView.jsx';
import CalendarView from './views/CalendarView.jsx';
import PeopleView from './views/PeopleView.jsx';
import ProfileView from './views/ProfileView.jsx';

export default function App() {
  const session = useSession();
  const config = session.status === 'ready' ? session.config : null;
  // Gavin and Isaac hold the shared passphrase, which is view-only. Hiding the write
  // affordances is honesty, not security — the server enforces the role on every write.
  const readOnly = session.status === 'ready' && session.role !== 'editor';
  const { todos, setTodos, loading: todosLoading } = useTodos(config);
  const { people, setPeople, loading: peopleLoading } = usePeople(config);
  // Refreshing dumped her back on the Inbox from wherever she was. Two layers, because the
  // hash alone was not enough: a tab opened before the hash existed, or a bookmark saved
  // without one, still lands on a bare URL and loses the view. The hash wins when it is
  // there so a link still points where it says; localStorage catches every other case.
  const VIEW_KEYS = ['inbox', 'kanban', 'list', 'timeline', 'calendar', 'people', 'profile'];
  const readView = () => {
    const fromHash = window.location.hash.replace(/^#\/?/, '');
    if (VIEW_KEYS.includes(fromHash)) return fromHash;
    try {
      const stored = window.localStorage.getItem('hq.view');
      if (VIEW_KEYS.includes(stored)) return stored;
    } catch {
      // Private-mode browsers throw on localStorage. The hash still works.
    }
    return 'inbox';
  };
  const [activeView, setActiveView] = useState(readView);

  useEffect(() => {
    if (window.location.hash.replace(/^#\/?/, '') !== activeView) {
      window.history.replaceState(null, '', `#/${activeView}`);
    }
    try {
      window.localStorage.setItem('hq.view', activeView);
    } catch {
      // See above.
    }
  }, [activeView]);

  useEffect(() => {
    const onNav = () => {
      const key = window.location.hash.replace(/^#\/?/, '');
      if (VIEW_KEYS.includes(key)) setActiveView(key);
    };
    window.addEventListener('hashchange', onNav);
    return () => window.removeEventListener('hashchange', onNav);
  }, []);
  const [openTodoId, setOpenTodoId] = useState(null);
  // Reaching a goal from the Calendar means arriving with a specific day's step in mind.
  // The panel lights that step so she does not have to find it in the list herself.
  const [highlightStepId, setHighlightStepId] = useState(null);
  const [openPersonId, setOpenPersonId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(null);
  const [undo, setUndo] = useState(null);
  const { removed, refreshRemoved, restore } = useRecoverable();

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  if (session.status === 'loading') {
    return <div className="min-h-screen bg-backdrop" />;
  }

  if (session.status === 'gate') {
    return <PassphraseGate onSubmit={session.login} error={session.error} />;
  }

  const { stepsOf, goalOf } = indexSteps(todos);
  const openTodo = todos.find((t) => t.id === openTodoId) ?? null;
  const openPerson = people.find((p) => p.id === openPersonId) ?? null;
  const isLoading =
    activeView === 'people' ? peopleLoading : ['profile','inbox'].includes(activeView) ? false : todosLoading;

  function openTodoDetail(id, stepId = null) {
    setOpenPersonId(null);
    setOpenTodoId(id);
    setHighlightStepId(stepId);
  }

  function openPersonDetail(id) {
    setOpenTodoId(null);
    setOpenPersonId(id);
  }

  function showError(message) {
    setError(message);
  }

  async function refreshTodoInPlace(id) {
    try {
      const { todo } = await api.getTodo(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...todo } : t)));
    } catch {
      // realtime will reconcile
    }
  }

  async function handlePatch(id, fields) {
    const previous = todos.find((t) => t.id === id);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
    try {
      const { todo } = await api.updateTodo(id, fields);
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...todo } : t)));
    } catch (err) {
      if (previous) {
        setTodos((prev) => prev.map((t) => (t.id === id ? previous : t)));
      }
      showError(`Couldn't save that change — ${err.message}`);
    }
  }

  async function handleDelete(id) {
    const previousTodos = todos;
    const doomed = todos.find((t) => t.id === id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setOpenTodoId(null);
    try {
      await api.deleteTodo(id);
      await refreshRemoved();
      setUndo({
        label: `Deleted "${doomed?.title ?? 'task'}"`,
        onUndo: () => handleRestore('todo', id),
      });
    } catch (err) {
      setTodos(previousTodos);
      showError(`Couldn't delete that task — ${err.message}`);
    }
  }

  // Restoring has to update the live list too, not just the removed list — otherwise the
  // row comes back in the database but stays invisible until a refresh.
  async function handleRestore(kind, id) {
    try {
      const restored = await restore(kind, id);
      if (kind === 'todo' && restored) {
        setTodos((prev) => (prev.some((t) => t.id === restored.id) ? prev : [...prev, restored]));
      }
      if (kind === 'person' && restored) {
        setPeople((prev) =>
          prev.some((p) => p.id === restored.id)
            ? prev
            : [...prev, restored].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
    } catch (err) {
      showError(`Couldn't restore that — ${err.message}`);
    }
  }

  async function handleCreate(payload) {
    try {
      const { todo } = await api.createTodo(payload);
      setTodos((prev) => [...prev, todo]);
      setShowCreate(false);
      setOpenTodoId(todo.id);
    } catch (err) {
      showError(`Couldn't create that task — ${err.message}`);
    }
  }

  // A step is an ordinary task that names its goal. It starts in To Do, where every other
  // piece of unstarted work starts, and shows up on the board immediately.
  async function handleAddStep(parentId, title) {
    try {
      const parent = todos.find((t) => t.id === parentId);
      const { todo } = await api.createTodo({
        title,
        parent_id: parentId,
        status: 'todo',
        priority: parent?.priority ?? 'normal',
        contact: parent?.contact ?? '',
        category: parent?.category ?? '',
      });
      setTodos((prev) => [...prev, todo]);
      // A goal that was sitting in Done cannot stay there once new work opens under it.
      if (parent?.status === 'done') await refreshTodoInPlace(parentId);
    } catch (err) {
      showError(`Couldn't add that step — ${err.message}`);
    }
  }

  async function handlePatchPerson(id, fields) {
    const previous = people.find((p) => p.id === id);
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
    try {
      const { person } = await api.updatePerson(id, fields);
      setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...person } : p)));
    } catch (err) {
      if (previous) {
        setPeople((prev) => prev.map((p) => (p.id === id ? previous : p)));
      }
      showError(`Couldn't save that change — ${err.message}`);
    }
  }

  async function handleDeletePerson(id) {
    const previousPeople = people;
    const doomed = people.find((p) => p.id === id);
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setOpenPersonId(null);
    try {
      await api.deletePerson(id);
      await refreshRemoved();
      setUndo({
        label: `Removed ${doomed?.name ?? 'that person'}`,
        onUndo: () => handleRestore('person', id),
      });
    } catch (err) {
      setPeople(previousPeople);
      showError(`Couldn't delete that person — ${err.message}`);
    }
  }

  async function handleCreatePerson(payload) {
    try {
      const { person } = await api.createPerson(payload);
      setPeople((prev) => [...prev, person].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      setOpenPersonId(person.id);
    } catch (err) {
      showError(`Couldn't add that person — ${err.message}`);
    }
  }

  // Recovery is passed down to the view where the loss happened, never hoisted into a tab.
  const removedTodos = removed.todos;
  const restoreTodo = (item) => handleRestore('todo', item.id);

  const views = {
    inbox: (
      <InboxView
        config={config}
        dismissed={removed.inbox}
        onRefreshRemoved={refreshRemoved}
        onRestore={(item) => handleRestore('inbox', item.id)}
        onDismissed={(item) =>
          setUndo({ label: `Dismissed "${item.title}"`, onUndo: () => handleRestore('inbox', item.id) })
        }
      />
    ),
    kanban: (
      <KanbanView
        todos={todos}
        onOpen={openTodoDetail}
        onReorder={handlePatch}
        removed={removedTodos}
        onRestore={restoreTodo}
      />
    ),
    list: (
      <ListView todos={todos} onOpen={openTodoDetail} removed={removedTodos} onRestore={restoreTodo} />
    ),
    timeline: (
      <TimelineView todos={todos} onOpen={openTodoDetail} removed={removedTodos} onRestore={restoreTodo} />
    ),
    calendar: (
      <CalendarView
        todos={todos}
        onOpen={openTodoDetail}
        config={config}
        removed={removedTodos}
        onRestore={restoreTodo}
      />
    ),
    people: (
      <PeopleView
        people={people}
        todos={todos}
        onOpen={openPersonDetail}
        onOpenTodo={openTodoDetail}
        config={config}
        removed={removed.people}
        onRestore={(item) => handleRestore('person', item.id)}
      />
    ),
    profile: <ProfileView />,
  };

  return (
    <div className="min-h-screen bg-backdrop overflow-x-clip">
      <TopNav
        active={activeView}
        onChange={setActiveView}
        onLogout={session.logout}
        onCreate={() => setShowCreate(true)}
        createLabel={activeView === 'people' ? 'New person' : 'New task'}
        canCreate={!readOnly && activeView !== 'profile' && activeView !== 'inbox'}
        readOnly={readOnly}
      />

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] overlay-in">
          <div className="glass-panel flex items-center gap-3 rounded-full border border-clay/40 px-4 py-2 text-sm text-clay shadow-lg">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="tap-scale inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-clay/10"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <main key={activeView} className="fade-view-enter">
        {isLoading ? (
          <div className="max-w-6xl mx-auto px-6 py-16 text-center text-sm text-ink-muted">Loading…</div>
        ) : (
          views[activeView]
        )}
      </main>

      {openTodo && (
        <DetailPanel
          todo={openTodo}
          goal={goalOf(openTodo)}
          steps={stepsOf(openTodo.id)}
          highlightStepId={highlightStepId}
          onClose={() => {
            setOpenTodoId(null);
            setHighlightStepId(null);
          }}
          onChange={handlePatch}
          onDelete={handleDelete}
          onOpen={openTodoDetail}
          onAddStep={handleAddStep}
          readOnly={readOnly}
        />
      )}

      {openPerson && (
        <PersonDetailPanel
          person={openPerson}
          config={config}
          onClose={() => setOpenPersonId(null)}
          onChange={handlePatchPerson}
          onDelete={handleDeletePerson}
          onOpenTodo={openTodoDetail}
        />
      )}

      {showCreate && activeView === 'people' && (
        <CreatePersonModal onClose={() => setShowCreate(false)} onCreate={handleCreatePerson} />
      )}
      {showCreate && activeView !== 'people' && activeView !== 'profile' && (
        <CreateTodoModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      <UndoToast undo={undo} onDismiss={() => setUndo(null)} />
    </div>
  );
}
