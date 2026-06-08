"use client";

import { useEffect, useState } from "react";
import TaskIcon from "@/components/TaskIcon";
import type { Task } from "@/lib/types";
import { Shield, Plus, Pencil, X } from "lucide-react";

const ICON_OPTIONS = [
  "heart",
  "users",
  "camera",
  "music",
  "message",
  "wine",
  "search",
  "sparkles",
  "star",
] as const;

const EMPTY_FORM = {
  title: "",
  description: "",
  reward: 100,
  icon: "star",
  max_progress: 1,
  requires_person: false,
  repeatable: false,
  active: true,
};

export default function AdminTasksPanel() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) loadTasks();
  }, [open]);

  async function loadTasks() {
    const res = await fetch("/api/admin/tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks || []);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      reward: task.reward,
      icon: task.icon,
      max_progress: task.max_progress,
      requires_person: !!task.requires_person,
      repeatable: !!task.repeatable,
      active: task.active,
    });
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const url = editingId ? `/api/admin/tasks/${editingId}` : "/api/admin/tasks";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Помилка");
      setSaving(false);
      return;
    }

    setSuccess(editingId ? "Завдання оновлено!" : "Завдання додано!");
    setEditingId(null);
    setForm(EMPTY_FORM);
    await loadTasks();
    setSaving(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  const activeTasks = tasks.filter((t) => t.active);
  const inactiveTasks = tasks.filter((t) => !t.active);

  return (
    <div className="party-card mt-4 border-party-gold/50 p-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-party-gold" />
          <h3 className="party-title text-sm font-semibold text-party-gold">
            ЗАВДАННЯ
          </h3>
        </div>
        <span className="text-xs text-party-gold">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {editingId && (
              <div className="flex items-center justify-between rounded-lg bg-party-gold/10 px-3 py-2">
                <span className="text-xs font-semibold text-party-gold">
                  Редагування завдання
                </span>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-party-cream/50 hover:text-party-cream"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-party-gold/70">Назва завдання</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="party-input text-sm"
                placeholder="Наприклад: Скажи тост"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-party-gold/70">Опис</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="party-input text-sm"
                placeholder="Короткий опис..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-party-gold/70">Нагорода ($)</label>
                <select
                  value={form.reward}
                  onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })}
                  className="party-input text-sm"
                >
                  {[100, 200, 300, 400, 500].map((r) => (
                    <option key={r} value={r} className="bg-party-bg">
                      ${r}
                    </option>
                  ))}
                </select>
              </div>
              {!form.repeatable && (
                <div>
                  <label className="mb-1 block text-xs text-party-gold/70">Кроків</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.max_progress}
                    onChange={(e) =>
                      setForm({ ...form, max_progress: Number(e.target.value) })
                    }
                    className="party-input text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-party-gold/70">Іконка</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                      form.icon === icon
                        ? "border-party-gold bg-party-gold/20"
                        : "border-party-gold/20"
                    }`}
                  >
                    <TaskIcon name={icon} size={18} className="text-party-gold" />
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-party-cream/80">
              <input
                type="checkbox"
                checked={form.requires_person}
                onChange={(e) => setForm({ ...form, requires_person: e.target.checked })}
                className="accent-party-gold"
              />
              Обрати людину зі списку гостей
            </label>

            <label className="flex items-center gap-2 text-sm text-party-cream/80">
              <input
                type="checkbox"
                checked={form.repeatable}
                onChange={(e) => setForm({ ...form, repeatable: e.target.checked })}
                className="accent-party-gold"
              />
              Повторюване
            </label>
            {form.repeatable && (
              <p className="text-[10px] text-party-cream/40">
                {form.requires_person
                  ? "З кожним гостем окремо (наприклад, спільне фото)"
                  : "Скільки завгодно разів (наприклад, тост)"}
              </p>
            )}

            {editingId && (
              <label className="flex items-center gap-2 text-sm text-party-cream/80">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-party-gold"
                />
                Активне завдання (видиме гостям)
              </label>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}

            <button
              type="submit"
              disabled={saving}
              className="party-btn flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold tracking-widest disabled:opacity-50"
            >
              {editingId ? <Pencil size={16} /> : <Plus size={16} />}
              {saving
                ? "ЗБЕРІГАЄМО..."
                : editingId
                  ? "ЗБЕРЕГТИ ЗМІНИ"
                  : "ДОДАТИ ЗАВДАННЯ"}
            </button>
          </form>

          {activeTasks.length > 0 && (
            <div className="border-t border-party-gold/20 pt-4">
              <p className="mb-2 text-xs text-party-gold/60">
                Активні завдання ({activeTasks.length})
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                      editingId === task.id ? "bg-party-gold/15" : "bg-black/20"
                    }`}
                  >
                    <TaskIcon name={task.icon} size={14} className="text-party-gold" />
                    <span className="flex-1 truncate text-xs text-party-cream">
                      {task.title}
                    </span>
                    <span className="text-xs font-bold text-party-gold">${task.reward}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(task)}
                      className="shrink-0 p-1 text-party-gold/60 hover:text-party-gold"
                      aria-label="Редагувати"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactiveTasks.length > 0 && (
            <div className="border-t border-party-gold/20 pt-4">
              <p className="mb-2 text-xs text-party-cream/40">
                Приховані ({inactiveTasks.length})
              </p>
              <div className="max-h-32 space-y-2 overflow-y-auto">
                {inactiveTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 opacity-60"
                  >
                    <TaskIcon name={task.icon} size={14} className="text-party-cream/40" />
                    <span className="flex-1 truncate text-xs text-party-cream/50 line-through">
                      {task.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(task)}
                      className="shrink-0 p-1 text-party-gold/60 hover:text-party-gold"
                      aria-label="Редагувати"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
