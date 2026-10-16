import { CheckIcon, UndoIcon, EditIcon, TrashIcon } from "./Icons.jsx";

const fmt = (iso) => (iso ? iso.split("-").reverse().join("/") : "—");

export default function TaskTable({ tasks, loading, onToggle, onEdit, onDelete }) {
  if (!loading && tasks.length === 0) {
    return (
      <div className="empty">
        <strong>No tasks found</strong>
        <span>Change the filters, or select Create New Task to add one.</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Date Created</th>
            <th>Due Date</th>
            <th className="actions-col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const done = t.status === "Completed";
            return (
              <tr key={t.id} className={done ? "done" : ""}>
                <td data-label="Title" className="title-cell">
                  <span className="t-title">{t.title}</span>
                  {t.description && <span className="t-desc">{t.description}</span>}
                </td>
                <td data-label="Priority"><span className={`pill pri-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                <td data-label="Status">
                  <span className={`pill ${done ? "st-done" : "st-pending"}`}>{t.status}</span>
                </td>
                <td data-label="Date Created">{fmt(t.created_at)}</td>
                <td data-label="Due Date" className={t.is_overdue ? "overdue" : ""}>
                  {fmt(t.deadline)}
                  {t.is_overdue && <span className="pill pri-high small">Overdue</span>}
                </td>
                <td className="actions">
                  <button className="act blue" onClick={() => onToggle(t)} title={done ? "Mark as pending" : "Mark as completed"} aria-label={done ? "Mark as pending" : "Mark as completed"}>
                    {done ? <UndoIcon width={16} height={16} /> : <CheckIcon width={16} height={16} />}
                  </button>
                  <button className="act purple" onClick={() => onEdit(t)} title="Edit task" aria-label="Edit task"><EditIcon width={16} height={16} /></button>
                  <button className="act red" onClick={() => onDelete(t)} title="Delete task" aria-label="Delete task"><TrashIcon width={16} height={16} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
