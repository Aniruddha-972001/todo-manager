import { useEffect, useState } from "react";
import AuthCard from "./components/AuthCard";
import ListSidebar from "./components/ListSidebar";
import TodoWorkspace from "./components/TodoWorkspace";
import {
  createList,
  createTodo,
  deleteList,
  deleteTodo,
  getCurrentUser,
  getList,
  getLists,
  getStoredToken,
  login,
  logout,
  refreshToken,
  setToken,
  signup,
  updateList,
  updateTodo,
} from "./api";
import type { AuthUser, TodoList, TodoListWithTodos } from "./types";

export default function App() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<TodoListWithTodos | null>(null);
  const [newListName, setNewListName] = useState("");

  const completedTodos = selectedList?.todos.filter((todo) => todo.completed).length ?? 0;
  const totalTodos = selectedList?.todos.length ?? 0;

  async function withFeedback(task: () => Promise<void>) {
    setBusy(true);
    setError(null);

    try {
      await task();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function loadLists(preferredListId?: string | null) {
    const response = await getLists();
    setLists(response.lists);

    const nextListId = preferredListId ?? selectedListId ?? response.lists[0]?.id ?? null;
    setSelectedListId(nextListId);

    if (!nextListId) {
      setSelectedList(null);
      return;
    }

    const listResponse = await getList(nextListId);
    setSelectedList(listResponse.list);
  }

  useEffect(() => {
    void (async () => {
      if (!getStoredToken()) {
        try {
          await refreshToken();
        } catch {
          setToken(null);
          return;
        }
      }

      try {
        const meResponse = await getCurrentUser();
        setUser(meResponse.user);
        await loadLists();
      } catch {
        try {
          await refreshToken();
          const meResponse = await getCurrentUser();
          setUser(meResponse.user);
          await loadLists();
        } catch {
          setToken(null);
          setUser(null);
        }
      }
    })();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    await withFeedback(async () => {
      const response = await login(username, password);
      setMessage(response.message);
      const meResponse = await getCurrentUser();
      setUser(meResponse.user);
      await loadLists();
    });
  };

  const handleSignup = async (username: string, password: string) => {
    await withFeedback(async () => {
      const response = await signup(username, password);
      setMessage(`${response.message}. You can log in now.`);
    });
  };

  const handleLogout = async () => {
    await withFeedback(async () => {
      await logout();
      setUser(null);
      setLists([]);
      setSelectedList(null);
      setSelectedListId(null);
      setMessage("Logged out successfully");
    });
  };

  const handleCreateList = async () => {
    await withFeedback(async () => {
      const response = await createList(newListName);
      setNewListName("");
      setMessage(response.message);
      await loadLists(response.list.id);
    });
  };

  const handleSelectList = async (id: string) => {
    await withFeedback(async () => {
      const response = await getList(id);
      setSelectedListId(id);
      setSelectedList(response.list);
    });
  };

  const handleRenameList = async (name: string) => {
    if (!selectedListId) {
      return;
    }

    await withFeedback(async () => {
      const response = await updateList(selectedListId, name);
      setMessage(response.message);
      await loadLists(selectedListId);
    });
  };

  const handleDeleteList = async () => {
    if (!selectedListId) {
      return;
    }

    await withFeedback(async () => {
      await deleteList(selectedListId);
      setMessage("List deleted successfully");
      const listsResponse = await getLists();
      setLists(listsResponse.lists);
      const fallbackId = listsResponse.lists[0]?.id ?? null;
      setSelectedListId(fallbackId);

      if (!fallbackId) {
        setSelectedList(null);
        return;
      }

      const response = await getList(fallbackId);
      setSelectedList(response.list);
    });
  };

  const handleCreateTodo = async (task: string) => {
    if (!selectedListId) {
      return;
    }

    await withFeedback(async () => {
      const response = await createTodo(selectedListId, task);
      setMessage(response.message);
      const listResponse = await getList(selectedListId);
      setSelectedList(listResponse.list);
    });
  };

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    if (!selectedListId) {
      return;
    }

    await withFeedback(async () => {
      await updateTodo(todoId, { completed });
      const listResponse = await getList(selectedListId);
      setSelectedList(listResponse.list);
    });
  };

  const handleRenameTodo = async (todoId: string, task: string) => {
    if (!selectedListId) {
      return;
    }

    await withFeedback(async () => {
      await updateTodo(todoId, { task });
      const listResponse = await getList(selectedListId);
      setSelectedList(listResponse.list);
    });
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!selectedListId) {
      return;
    }

    await withFeedback(async () => {
      await deleteTodo(todoId);
      const listResponse = await getList(selectedListId);
      setSelectedList(listResponse.list);
    });
  };

  return (
    <main className="app-shell">
      {!user ? (
        <section className="simple-hero">
          <p className="eyebrow">Todo Manager</p>
          <h1>Organize your work in one simple place.</h1>
          <p>
            Create lists, track tasks, and keep your day moving with a clean workspace designed for focus.
          </p>
        </section>
      ) : null}

      {message ? <div className="feedback-banner success">{message}</div> : null}
      {error ? <div className="feedback-banner error">{error}</div> : null}

      {!user ? (
        <section className="auth-only-layout">
          <AuthCard busy={busy} onLogin={handleLogin} onSignup={handleSignup} />
        </section>
      ) : (
        <section className="workspace-layout">
          <header className="topbar">
            <div className="topbar-copy">
              <p className="eyebrow">Signed in</p>
              <h2>Workspace overview</h2>
              <p className="topbar-subcopy">User ID: {user.userId}</p>
            </div>

            <div className="topbar-actions">
              <div className="topbar-chip">
                <span className="summary-label">Selected</span>
                <strong>{selectedList?.name ?? "No list yet"}</strong>
              </div>
              <div className="topbar-chip">
                <span className="summary-label">Tasks</span>
                <strong>
                  {completedTodos}/{totalTodos}
                </strong>
              </div>
              <button className="ghost-button" disabled={busy} onClick={handleLogout} type="button">
                Log out
              </button>
            </div>
          </header>

          <div className="content-grid">
            <ListSidebar
              busy={busy}
              lists={lists}
              selectedListId={selectedListId}
              draftName={newListName}
              onDraftNameChange={setNewListName}
              onSelectList={(id) => {
                void handleSelectList(id);
              }}
              onCreateList={handleCreateList}
            />

            <TodoWorkspace
              busy={busy}
              list={selectedList}
              onRenameList={handleRenameList}
              onDeleteList={handleDeleteList}
              onCreateTodo={handleCreateTodo}
              onToggleTodo={handleToggleTodo}
              onRenameTodo={handleRenameTodo}
              onDeleteTodo={handleDeleteTodo}
            />
          </div>
        </section>
      )}
    </main>
  );
}
