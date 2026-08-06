import { useState } from 'react';
import { useSession } from './hooks/useSession.js';
import { useTodos } from './hooks/useTodos.js';
import { api } from './lib/api.js';
import PassphraseGate from './components/PassphraseGate.jsx';
import TopNav from './components/TopNav.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import CreateTodoModal from './components/CreateTodoModal.jsx';
import KanbanView from './views/KanbanView.jsx';
import ListView from './views/ListView.jsx';
import TimelineView from './views/TimelineView.jsx';
import CalendarView from './views/CalendarView.jsx';

export default function App() {
  const session = useSession();
  const { todos, setTodos } = useTodos(session.status === 'ready' ? session.config : null);
  const [activeView, setActiveView] = useState('kanban');
  const [openTodoId, setOpenTodoId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  if (session.status === 'loading') {
    return <div className="min-h-screen bg-backdrop" />;
  }

  if (session.status === 'gate') {
    return <PassphraseGate onSubmit={session.login} error={session.error} />;
  }

  const openTodo = todos.find((t) => t.id === openTodoId) ?? null;

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

  const views = {
    kanban: <KanbanView todos={todos} onOpen={setOpenTodoId} setTodos={setTodos} />,
    list: <ListView todos={todos} onOpen={setOpenTodoId} />,
    timeline: <TimelineView todos={todos} onOpen={setOpenTodoId} />,
    calendar: <CalendarView todos={todos} onOpen={setOpenTodoId} />,
  };

  return (
    <div className="min-h-screen bg-backdrop">
      <TopNav
        active={activeView}
        onChange={setActiveView}
        onLogout={session.logout}
        onCreate={() => setShowCreate(true)}
      />

      <main key={activeView} className="fade-view-enter">
        {views[activeView]}
      </main>

      {openTodo && (
        <DetailPanel
          todo={openTodo}
          config={session.config}
          onClose={() => setOpenTodoId(null)}
          onChange={handlePatch}
          onDelete={handleDelete}
        />
      )}

      {showCreate && <CreateTodoModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
