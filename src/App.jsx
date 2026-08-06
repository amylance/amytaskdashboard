import { useState } from 'react';
import { useSession } from './hooks/useSession.js';
import { useTodos } from './hooks/useTodos.js';
import { usePeople } from './hooks/usePeople.js';
import { api } from './lib/api.js';
import PassphraseGate from './components/PassphraseGate.jsx';
import TopNav from './components/TopNav.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import PersonDetailPanel from './components/PersonDetailPanel.jsx';
import CreateTodoModal from './components/CreateTodoModal.jsx';
import CreatePersonModal from './components/CreatePersonModal.jsx';
import KanbanView from './views/KanbanView.jsx';
import ListView from './views/ListView.jsx';
import TimelineView from './views/TimelineView.jsx';
import CalendarView from './views/CalendarView.jsx';
import PeopleView from './views/PeopleView.jsx';

export default function App() {
  const session = useSession();
  const config = session.status === 'ready' ? session.config : null;
  const { todos, setTodos } = useTodos(config);
  const { people, setPeople } = usePeople(config);
  const [activeView, setActiveView] = useState('kanban');
  const [openTodoId, setOpenTodoId] = useState(null);
  const [openPersonId, setOpenPersonId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  if (session.status === 'loading') {
    return <div className="min-h-screen bg-backdrop" />;
  }

  if (session.status === 'gate') {
    return <PassphraseGate onSubmit={session.login} error={session.error} />;
  }

  const openTodo = todos.find((t) => t.id === openTodoId) ?? null;
  const openPerson = people.find((p) => p.id === openPersonId) ?? null;

  function openTodoDetail(id) {
    setOpenPersonId(null);
    setOpenTodoId(id);
  }

  function openPersonDetail(id) {
    setOpenTodoId(null);
    setOpenPersonId(id);
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
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
    try {
      const { todo } = await api.updateTodo(id, fields);
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...todo } : t)));
    } catch {
      // realtime will reconcile on next event; ignore transient failure
    }
  }

  async function handleDelete(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setOpenTodoId(null);
    await api.deleteTodo(id).catch(() => {});
  }

  async function handleCreate(payload) {
    const { todo } = await api.createTodo(payload);
    setTodos((prev) => [...prev, todo]);
    setShowCreate(false);
    setOpenTodoId(todo.id);
  }

  async function handleLinkPerson(todoId, personId) {
    await api.linkPerson(todoId, personId).catch(() => {});
    await refreshTodoInPlace(todoId);
  }

  async function handleUnlinkPerson(todoId, personId) {
    await api.unlinkPerson(todoId, personId).catch(() => {});
    await refreshTodoInPlace(todoId);
  }

  async function handlePatchPerson(id, fields) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
    try {
      const { person } = await api.updatePerson(id, fields);
      setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...person } : p)));
    } catch {
      // realtime will reconcile
    }
  }

  async function handleDeletePerson(id) {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setOpenPersonId(null);
    await api.deletePerson(id).catch(() => {});
  }

  async function handleCreatePerson(payload) {
    const { person } = await api.createPerson(payload);
    setPeople((prev) => [...prev, person].sort((a, b) => a.name.localeCompare(b.name)));
    setShowCreate(false);
    setOpenPersonId(person.id);
  }

  const views = {
    kanban: <KanbanView todos={todos} onOpen={openTodoDetail} setTodos={setTodos} />,
    list: <ListView todos={todos} onOpen={openTodoDetail} />,
    timeline: <TimelineView todos={todos} onOpen={openTodoDetail} />,
    calendar: <CalendarView todos={todos} onOpen={openTodoDetail} />,
    people: <PeopleView people={people} onOpen={openPersonDetail} />,
  };

  return (
    <div className="min-h-screen bg-backdrop">
      <TopNav
        active={activeView}
        onChange={setActiveView}
        onLogout={session.logout}
        onCreate={() => setShowCreate(true)}
        createLabel={activeView === 'people' ? 'New person' : 'New task'}
      />

      <main key={activeView} className="fade-view-enter">
        {views[activeView]}
      </main>

      {openTodo && (
        <DetailPanel
          todo={openTodo}
          config={config}
          people={people}
          onClose={() => setOpenTodoId(null)}
          onChange={handlePatch}
          onDelete={handleDelete}
          onLinkPerson={handleLinkPerson}
          onUnlinkPerson={handleUnlinkPerson}
          onOpenPerson={openPersonDetail}
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
      {showCreate && activeView !== 'people' && (
        <CreateTodoModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
