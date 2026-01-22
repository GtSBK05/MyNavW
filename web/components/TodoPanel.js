// web/components/TodoPanel.js
import { useEffect, useState } from "react";
import {
  apiGetTodos,
  apiCreateTodo,
  apiToggleTodo,
  apiDeleteTodo,
  apiGetStats,
  apiUpdateTodo
} from "@/lib/api";
import {
  saveTodosSnapshot,
  loadTodosSnapshot,
  queueCreateTodo,
  getPendingCreates,
  clearPendingCreates
} from "@/lib/offline";

function isOnlineNow() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function calcStats(list) {
  const total = list.length;
  const completed = list.filter(t => t.completed).length;
  const active = total - completed;
  return { total, active, completed };
}

export default function TodoPanel({ user, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0 });
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // state untuk edit
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);

  const online = isOnlineNow();
  const userKey = user?.id || user?.email || "default";

  // ----- helper: sync todo yang dibuat saat offline -----
  async function syncPendingCreates() {
    if (!isOnlineNow()) return;

    const pending = await getPendingCreates(userKey);
    if (!pending || pending.length === 0) return;

    setSyncing(true);

    try {
      const snap = await loadTodosSnapshot(userKey);
      let updatedList = snap?.todos ? [...snap.todos] : [...todos];

      for (const item of pending) {
        const saved = await apiCreateTodo(item.text);

        // cari todo offline berdasarkan text
        const idx = updatedList.findIndex(
          t => t.pending && t.text === item.text
        );

        if (idx !== -1) {
          updatedList[idx] = {
            ...saved,
            pending: false
          };
        } else {
          // jaga-jaga: kalau tidak ketemu, tambahkan saja saved
          updatedList = [saved, ...updatedList];
        }
      }

      await clearPendingCreates(userKey);

      const newStats = calcStats(updatedList);

      // simpan snapshot baru
      await saveTodosSnapshot(userKey, updatedList, newStats);

      setTodos(updatedList);
      setStats(newStats);
    } catch (err) {
      console.error("Failed to sync pending creates", err);
    } finally {
      setSyncing(false);
    }
  }

  // ----- main loader (snapshot-first) -----
  async function loadData() {
    setLoadingTodos(true);

    try {
      const onlineNow = isOnlineNow();

      // 1. Selalu coba baca snapshot dulu
      const snap = await loadTodosSnapshot(userKey);

      if (snap && snap.todos) {
        const restoredStats = snap.stats || calcStats(snap.todos);
        setTodos(snap.todos);
        setStats(restoredStats);
      } else if (onlineNow) {
        // 2. Kalau belum ada snapshot dan sedang online → bootstrap dari server
        try {
          const [todoData, statsData] = await Promise.all([
            apiGetTodos(),
            apiGetStats()
          ]);
          const restoredStats = statsData || calcStats(todoData);
          setTodos(todoData);
          setStats(restoredStats);
          await saveTodosSnapshot(userKey, todoData, restoredStats);
        } catch (err) {
          console.error("initial server load error", err);
          setTodos([]);
          setStats({ total: 0, active: 0, completed: 0 });
        }
      } else {
        // 3. Tidak ada snapshot & offline → kosong
        setTodos([]);
        setStats({ total: 0, active: 0, completed: 0 });
      }

      // 4. Kalau online, setelah tampilan muncul, sync pending creates
      if (onlineNow) {
        await syncPendingCreates();
      }
    } catch (err) {
      console.error("loadData error", err);
      // fallback minimal
      const snap = await loadTodosSnapshot(userKey);
      if (snap && snap.todos) {
        const restoredStats = snap.stats || calcStats(snap.todos);
        setTodos(snap.todos);
        setStats(restoredStats);
      } else {
        setTodos([]);
        setStats({ total: 0, active: 0, completed: 0 });
      }
    } finally {
      setLoadingTodos(false);
    }
  }

  useEffect(() => {
    loadData();

    function handleOnline() {
      loadData();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- actions: ADD -----
  async function handleAdd(e) {
    e && e.preventDefault();
    if (!text.trim()) return;

    const newText = text.trim();
    setAdding(true);

    const onlineNow = isOnlineNow();

    if (onlineNow) {
      // ONLINE
      try {
        const created = await apiCreateTodo(newText);

        setTodos(prev => {
          const updated = [created, ...prev];
          const newStats = calcStats(updated);
          setStats(newStats);
          saveTodosSnapshot(userKey, updated, newStats).catch(() => {});
          return updated;
        });

        setText("");
      } catch (err) {
        console.error(err);
      } finally {
        setAdding(false);
      }
    } else {
      // OFFLINE
      const tempTodo = {
        id: "offline-" + Date.now(),
        text: newText,
        completed: false,
        createdAt: new Date().toISOString(),
        pending: true
      };

      setTodos(prev => {
        const updated = [tempTodo, ...prev];
        const newStats = calcStats(updated);
        setStats(newStats);
        saveTodosSnapshot(userKey, updated, newStats).catch(() => {});
        return updated;
      });

      setText("");

      try {
        await queueCreateTodo(userKey, newText);
      } catch (err) {
        console.error("Failed to queue offline create", err);
      } finally {
        setAdding(false);
      }
    }
  }

  // ----- actions: TOGGLE -----
  async function handleToggle(id) {
    const onlineNow = isOnlineNow();
    if (!onlineNow) return;

    try {
      await apiToggleTodo(id);

      setTodos(prev => {
        const updated = prev.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        );
        const newStats = calcStats(updated);
        setStats(newStats);
        saveTodosSnapshot(userKey, updated, newStats).catch(() => {});
        return updated;
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ----- actions: DELETE -----
  async function handleDelete(id) {
    const onlineNow = isOnlineNow();
    if (!onlineNow) return;

    try {
      await apiDeleteTodo(id);

      setTodos(prev => {
        const updated = prev.filter(t => t.id !== id);
        const newStats = calcStats(updated);
        setStats(newStats);
        saveTodosSnapshot(userKey, updated, newStats).catch(() => {});
        return updated;
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ----- actions: EDIT -----
  function startEdit(todo) {
    // edit hanya saat online, dan bukan pending
    if (!isOnlineNow()) return;
    if (todo.pending) return;
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
    setEditingSaving(false);
  }

  async function handleEditSave(e) {
    e && e.preventDefault();
    if (!editingId) return;
    const newText = editingText.trim();
    if (!newText) return;
    if (!isOnlineNow()) return;

    setEditingSaving(true);

    try {
      const updatedFromApi = await apiUpdateTodo(editingId, newText);

      setTodos(prev => {
        const updated = prev.map(t =>
          t.id === editingId ? { ...t, ...updatedFromApi } : t
        );
        const newStats = calcStats(updated);
        setStats(newStats);
        saveTodosSnapshot(userKey, updated, newStats).catch(() => {});
        return updated;
      });

      setEditingId(null);
      setEditingText("");
    } catch (err) {
      console.error("Failed to update todo", err);
    } finally {
      setEditingSaving(false);
    }
  }

  function doLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mynavw_token");
      localStorage.removeItem("mynavw_user");
    }
    onLogout();
  }

  const visibleTodos = todos.filter(t => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <div className="app">
      <header className="app-header prts-header">
        <div className="prts-left">
          <div className="prts-logo">
            <div className="prts-diamond" />
            <span className="prts-logo-text">MNW</span>
          </div>
          <div className="prts-title-block">
            <div className="prts-title-main">MyNavW</div>
            <div className="prts-title-sub">
              {user?.email} · {stats.total} todo ({stats.completed} selesai)
            </div>
          </div>
        </div>

        <div className="prts-right">
          <span
            className={
              "prts-status-chip " + (!online ? "prts-status-offline" : "")
            }
          >
            {online ? "ONLINE" : "OFFLINE"}
            {syncing ? " • SYNC" : ""}
          </span>
          <button className="btn prts-logout" type="button" onClick={doLogout}>
            Keluar
          </button>
        </div>
      </header>

      <main className="app-main">
        {!online && (
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              marginBottom: 4
            }}
          >
          </div>
        )}

        <section className="todo-input">
          <input
            className="input"
            placeholder="Apa rencana kamu hari ini?"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd(e)}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "..." : "+"}
          </button>
        </section>

        <section className="todo-filters">
          {["all", "active", "completed"].map(f => (
            <button
              key={f}
              className={`chip ${filter === f ? "chip-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Semua" : f === "active" ? "Aktif" : "Selesai"}
            </button>
          ))}
        </section>

        <section className="todo-list-section">
          {loadingTodos ? (
            <p className="empty-state">Memuat todo...</p>
          ) : visibleTodos.length === 0 ? (
            <p className="empty-state">Belum ada todo di filter ini.</p>
          ) : (
            <ul className="todo-list">
              {visibleTodos.map(todo => (
                <li key={todo.id} className="todo-item">
                  <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo.id)}
                    disabled={!online}
                  />

                  {editingId === todo.id ? (
                    <>
                      <input
                        className="input"
                        style={{ marginLeft: 8, flex: 1 }}
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e =>
                          e.key === "Enter" && handleEditSave(e)
                        }
                        autoFocus
                      />
                      <div className="todo-actions">
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={handleEditSave}
                          disabled={editingSaving}
                        >
                          Simpan
                        </button>
                        <button
                          className="btn"
                          type="button"
                          onClick={cancelEdit}
                          disabled={editingSaving}
                        >
                          Batal
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span
                        className={`todo-text ${
                          todo.completed ? "completed" : ""
                        }`}
                      >
                        {todo.text}
                        {todo.pending && (
                          <span
                            style={{
                              fontSize: 10,
                              marginLeft: 6,
                              color: "var(--muted)"
                            }}
                          >
                            (pending)
                          </span>
                        )}
                      </span>
                      <div className="todo-actions">
                        <button
                          className="btn"
                          type="button"
                          onClick={() => startEdit(todo)}
                          disabled={!online || todo.pending}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => handleDelete(todo.id)}
                          disabled={!online}
                        >
                          x
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <small>
          Statistik: {stats.active} aktif · {stats.completed} selesai
        </small>
      </footer>
    </div>
  );
}
