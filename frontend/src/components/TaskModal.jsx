import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "./Icons.jsx";

const empty = { title: "", description: "", priority: "Medium", deadline: "" };

export default function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task ? { ...empty, ...task, deadline: task.deadline || "" } : empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    // Client-side validation (the server validates too).
    if (!form.title.trim()) {
      setErrors({ title: "Task title is required." });
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        description: form.description,
        priority: form.priority,
        deadline: form.deadline || null,
      });
    } catch (err) {
      setErrors(err.errors || {});
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <h2 id="modal-title">{task ? "Edit task" : "Create new task"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><CloseIcon width={18} height={18} /></button>
        </div>

        <label>
          Title
          <input ref={titleRef} value={form.title} onChange={set("title")} maxLength={200} placeholder="e.g. Finish API documentation" aria-invalid={!!errors.title} />
          {errors.title && <span className="field-error" role="alert">{errors.title}</span>}
        </label>

        <label>
          Description
          <textarea rows={3} value={form.description} onChange={set("description")} placeholder="Add details (optional)" />
        </label>

        <div className="row2">
          <label>
            Priority
            <select value={form.priority} onChange={set("priority")}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            {errors.priority && <span className="field-error">{errors.priority}</span>}
          </label>
          <label>
            Deadline
            <input type="date" value={form.deadline} onChange={set("deadline")} />
            {errors.deadline && <span className="field-error">{errors.deadline}</span>}
          </label>
        </div>

        {errors.non_field && <p className="field-error" role="alert">{errors.non_field}</p>}

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn dark" disabled={saving}>{saving ? "Saving…" : task ? "Save changes" : "Create task"}</button>
        </div>
      </form>
    </div>
  );
}
