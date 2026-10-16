import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import TaskTable from "./components/TaskTable.jsx";
import TaskModal from "./components/TaskModal.jsx";
import { SearchIcon, BellIcon, CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, PlusIcon } from "./components/Icons.jsx";

const TABS = [
  { key: "all", label: "Assigned Tasks" },
  { key: "Pending", label: "Accepted Tasks" },
  { key: "Completed", label: "Review Tasks" },
];

export default function App() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  // Draft values are applied when "Filter" is pressed, like the reference design.
  const [draft, setDraft] = useState({ deadline: "", priority: "" });
  const [applied, setApplied] = useState({ deadline: "", priority: "" });
  const [tasks, setTasks] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); // null | { task? }
  const [confirm, setConfirm] = useState(null);
  const [rows, setRows] = useState(10);
  const [page, setPage] = useState(1);

  const query = useMemo(() => {
    const q = { search: search.trim(), deadline: applied.deadline, priority: applied.priority };
    if (tab === "overdue") q.overdue = "1";
    else if (tab !== "all") q.status = tab;
    return q;
  }, [tab, search, applied]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, over] = await Promise.all([api.list(query), api.list({ overdue: "1" })]);
      setTasks(list.results);
      setOverdueCount(over.count);
      setError("");
    } catch {
      setError("Can't reach the server. Check that the backend is running, then reload.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Debounce so typing in search doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => setPage(1), [query, rows]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const pages = Math.max(1, Math.ceil(tasks.length / rows));
  const start = (page - 1) * rows;
  const visible = tasks.slice(start, start + rows);

  async function save(data) {
    if (modal.task) {
      await api.update(modal.task.id, data);
      setToast("Task updated");
    } else {
      await api.create(data);
      setToast("Task created");
    }
    setModal(null);
    load();
  }

  async function toggle(t) {
    const next = t.status === "Completed" ? "Pending" : "Completed";
    try {
      await api.setStatus(t.id, next);
      setToast(next === "Completed" ? "Task completed" : "Task marked as pending");
      load();
    } catch {
      setToast("Couldn't update the task");
    }
  }

  async function remove() {
    try {
      await api.remove(confirm.id);
      setToast("Task deleted");
    } catch {
      setToast("Couldn't delete the task");
    }
    setConfirm(null);
    load();
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <label className="search">
            <SearchIcon width={20} height={20} />
            <input type="search" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tasks" />
          </label>
          <button className="bell" onClick={() => setTab("Pending")} aria-label={`${overdueCount} overdue tasks`} title="Show overdue tasks">
            <BellIcon width={22} height={22} />
            {overdueCount > 0 && <span className="badge">{overdueCount}</span>}
          </button>
          <div className="avatar" aria-hidden="true">T</div>
        </header>

        <h1>My Tasks</h1>

        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? "tab active" : "tab"} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <div className="filters">
            <label className="field date">
              <CalendarIcon width={18} height={18} />
              <input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} aria-label="Due date" />
            </label>
            <label className="field select">
              <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} aria-label="Priority">
                <option value="">Choose Priority</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <ChevronDown width={18} height={18} />
            </label>
            <button className="btn lilac" onClick={() => setApplied(draft)}>Filter</button>
            {(applied.deadline || applied.priority) && (
              <button className="btn link" onClick={() => { setDraft({ deadline: "", priority: "" }); setApplied({ deadline: "", priority: "" }); }}>
                Clear
              </button>
            )}
          </div>
          <button className="btn dark create" onClick={() => setModal({})}>
            <PlusIcon width={18} height={18} /> Create New Task
          </button>
        </div>

        {error && <p className="banner" role="alert">{error}</p>}

        <TaskTable tasks={visible} loading={loading} onToggle={toggle} onEdit={(task) => setModal({ task })} onDelete={setConfirm} />

        <footer className="pager">
          <span className="muted">Rows per page:</span>
          <label className="field select small">
            <select value={rows} onChange={(e) => setRows(Number(e.target.value))} aria-label="Rows per page">
              {[5, 10, 25, 50].map((n) => <option key={n}>{n}</option>)}
            </select>
            <ChevronDown width={16} height={16} />
          </label>
          <span className="muted">
            {tasks.length === 0 ? "0 of 0" : `${start + 1}-${Math.min(start + rows, tasks.length)} of ${tasks.length}`}
          </span>
          <button className="icon-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft width={20} height={20} /></button>
          <button className="icon-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= pages} aria-label="Next page"><ChevronRight width={20} height={20} /></button>
        </footer>
      </main>

      {modal && <TaskModal task={modal.task} onClose={() => setModal(null)} onSave={save} />}

      {confirm && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal small" role="alertdialog" aria-modal="true">
            <h2>Delete this task?</h2>
            <p className="muted">“{confirm.title}” will be removed permanently.</p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn danger" onClick={remove}>Delete task</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
