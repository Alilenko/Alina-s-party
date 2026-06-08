"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import TaskIcon from "@/components/TaskIcon";
import ParticipantPicker from "@/components/ParticipantPicker";
import PhotoLightbox from "@/components/PhotoLightbox";
import ResponsivePhoto from "@/components/ResponsivePhoto";
import { getCompletedGuestIds, getTaskBehavior } from "@/lib/task-behavior";
import type { Participant, Task, TaskCompletion, UserTask } from "@/lib/types";
import { Check } from "lucide-react";

type TasksTab = "active" | "completed";

export default function TasksPage() {
  const [tab, setTab] = useState<TasksTab>("active");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [pickerTask, setPickerTask] = useState<Task | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{ taskId: string; file: File } | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);

  useEffect(() => {
    loadTasks();

    function onVisible() {
      if (document.visibilityState === "visible") loadTasks();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function loadTasks() {
    const profileRes = await fetch("/api/profile");
    const { participant } = await profileRes.json();
    if (!participant) return;

    setCurrentUser(participant);

    const res = await fetch("/api/tasks");
    if (!res.ok) return;

    const data = await res.json();
    setTasks(data.tasks || []);
    setUserTasks(data.userTasks || []);
    setCompletions(data.completions || []);
    setAllParticipants(data.participants || []);
  }

  async function handleUndo(task: Task) {
    if (!confirm("Скасувати останнє виконання?")) return;

    setLoading(task.id);
    const res = await fetch("/api/tasks/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Помилка");
    } else {
      await loadTasks();
    }
    setLoading(null);
  }

  function getBehavior(task: Task) {
    return getTaskBehavior(task);
  }

  function getUserTask(taskId: string) {
    return userTasks.find((ut) => ut.task_id === taskId);
  }

  function getTaskCompletions(taskId: string) {
    return completions.filter((c) => c.task_id === taskId);
  }

  function getTaskPhotos(taskId: string) {
    return getTaskCompletions(taskId).filter((c) => c.photo_url);
  }

  function getParticipantName(id: string | null) {
    if (!id) return null;
    return allParticipants.find((p) => p.id === id)?.name || null;
  }

  function isOneTimeCompleted(task: Task) {
    const { repeatable } = getBehavior(task);
    if (repeatable) return false;

    const ut = getUserTask(task.id);
    if (ut?.status === "completed") return true;

    return getTaskCompletions(task.id).length >= task.max_progress;
  }

  function isPerGuestFullyDone(task: Task) {
    const { repeat_per_guest } = getBehavior(task);
    if (!repeat_per_guest) return false;

    const completedGuestIds = getCompletedGuestIds(getTaskCompletions(task.id));
    const otherGuests = allParticipants.filter((p) => p.id !== currentUser?.id);

    return (
      otherGuests.length > 0 &&
      otherGuests.every((p) => completedGuestIds.includes(p.id))
    );
  }

  function isCompletedTabTask(task: Task) {
    return isOneTimeCompleted(task) || isPerGuestFullyDone(task);
  }

  function isActiveTabTask(task: Task) {
    const { repeat_unlimited, repeat_per_guest } = getBehavior(task);
    if (repeat_unlimited) return true;
    if (repeat_per_guest) return !isPerGuestFullyDone(task);
    return !isOneTimeCompleted(task);
  }

  async function uploadPhoto(file: File): Promise<string | undefined> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "tasks");
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();
    return uploadData.url;
  }

  async function submitTask(
    taskId: string,
    options?: { photoUrl?: string; selectedParticipantId?: string; note?: string }
  ) {
    const res = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        photoUrl: options?.photoUrl,
        selectedParticipantId: options?.selectedParticipantId,
        note: options?.note,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Помилка");
      return false;
    }

    await loadTasks();
    return true;
  }

  async function handleCompleteClick(task: Task) {
    const needsPhoto = task.icon === "camera";
    const { requires_person: needsPerson } = getBehavior(task);

    if (needsPhoto) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      const file = await new Promise<File | null>((resolve) => {
        input.onchange = () => resolve(input.files?.[0] || null);
        input.click();
      });
      if (!file) return;

      if (needsPerson) {
        setPendingPhoto({ taskId: task.id, file });
        setPickerTask(task);
        return;
      }

      setLoading(task.id);
      await submitTask(task.id, { photoUrl: await uploadPhoto(file) });
      setLoading(null);
      return;
    }

    if (needsPerson) {
      if (allParticipants.length === 0) await loadTasks();
      setPickerTask(task);
      return;
    }

    setLoading(task.id);
    const ok = await submitTask(task.id);
    setLoading(null);
    if (ok && !getBehavior(task).repeatable) setTab("completed");
  }

  async function handlePersonSelected(person: Participant, note?: string) {
    if (!pickerTask) return;

    const task = pickerTask;
    setLoading(task.id);
    setPickerTask(null);

    let photoUrl: string | undefined;
    if (pendingPhoto?.taskId === task.id) {
      photoUrl = await uploadPhoto(pendingPhoto.file);
      setPendingPhoto(null);
    }

    const ok = await submitTask(task.id, {
      selectedParticipantId: person.id,
      photoUrl,
      note,
    });
    setLoading(null);
    if (ok && !getBehavior(task).repeatable) setTab("completed");
  }

  const sortByOrder = (list: Task[]) =>
    [...list].sort((a, b) => a.sort_order - b.sort_order);

  const activeTabTasks = sortByOrder(tasks.filter(isActiveTabTask));
  const completedTabTasks = sortByOrder(tasks.filter(isCompletedTabTask));
  const visibleTasks = tab === "active" ? activeTabTasks : completedTabTasks;

  function renderTaskCard(task: Task, onCompletedTab: boolean) {
    const ut = getUserTask(task.id);
    const {
      requires_person: needsPerson,
      repeatable: isRepeatable,
      requires_note,
      repeat_unlimited,
      repeat_per_guest,
    } = getBehavior(task);
    const taskCompletions = getTaskCompletions(task.id);
    const completionCount = taskCompletions.length;
    const completedGuestIds = getCompletedGuestIds(taskCompletions);
    const taskPhotos = getTaskPhotos(task.id);
    const done = onCompletedTab || isOneTimeCompleted(task) || isPerGuestFullyDone(task);
    const guestsRemaining =
      repeat_per_guest &&
      allParticipants
        .filter((p) => p.id !== currentUser?.id)
        .some((p) => !completedGuestIds.includes(p.id));
    const canDoMore = !onCompletedTab && (isRepeatable
      ? repeat_unlimited || !!guestsRemaining
      : !isOneTimeCompleted(task));
    const canUndo = completionCount > 0;

    return (
      <div
        key={task.id}
        className={`party-card p-4 transition-all ${
          done ? "border-party-gold/60 bg-party-gold/10" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              done ? "bg-party-gold/25" : "bg-party-gold/15"
            }`}
          >
            {done ? (
              <Check size={18} className="text-party-gold" />
            ) : (
              <TaskIcon name={task.icon} className="text-party-gold" />
            )}
          </div>
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                done ? "text-party-gold-light" : "text-party-cream"
              }`}
            >
              {task.title}
            </p>
            {task.description && (
              <p
                className={`mt-0.5 text-xs ${
                  done ? "text-party-gold/60" : "text-party-cream/50"
                }`}
              >
                {task.description}
              </p>
            )}
            {repeat_unlimited && !onCompletedTab && (
              <p className="mt-1 text-[10px] text-party-gold/60">
                Можна виконувати скільки завгодно разів
              </p>
            )}
            {repeat_per_guest && !onCompletedTab && (
              <p className="mt-1 text-[10px] text-party-gold/60">
                З кожним гостем окремо
              </p>
            )}
            {needsPerson && canDoMore && !requires_note && (
              <p className="mt-1 text-[10px] text-party-gold/60">
                Треба обрати гостя зі списку
              </p>
            )}
            {requires_note && canDoMore && (
              <p className="mt-1 text-[10px] text-party-gold/60">
                Обери гостя та вкажи спільне хобі
              </p>
            )}

            {isRepeatable && completionCount > 0 && (
              <p className="mt-2 text-xs text-party-gold/80">
                Виконано: {completionCount}{" "}
                {completionCount === 1 ? "раз" : completionCount < 5 ? "рази" : "разів"}
              </p>
            )}
            {repeat_per_guest && !guestsRemaining && completionCount > 0 && (
              <p className="mt-1 text-[10px] text-party-gold/60">
                З усіма гостями ✓
              </p>
            )}

            {done && (
              <p className="mt-1 text-[10px] font-semibold tracking-wider text-party-gold">
                ВИКОНАНО
              </p>
            )}

            {!isRepeatable && ut && !done && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-party-gold/10">
                  <div
                    className="h-full rounded-full bg-party-gold transition-all"
                    style={{
                      width: `${Math.min(100, ((ut.progress || 0) / task.max_progress) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-party-cream/50">
                  {ut.progress || 0}/{task.max_progress}
                </span>
              </div>
            )}

            {taskCompletions.length > 0 && (
              <div className="mt-2 space-y-1">
                {taskCompletions.slice(0, 5).map((c) => {
                  const name = getParticipantName(c.selected_participant_id);
                  return (
                    <p
                      key={c.id}
                      className={`text-[10px] ${done ? "text-party-gold/50" : "text-party-cream/50"}`}
                    >
                      {name ? `• з ${name}` : "• виконано"}
                      {c.note ? ` — ${c.note}` : ""}
                    </p>
                  );
                })}
                {taskCompletions.length > 5 && (
                  <p className="text-[10px] text-party-cream/30">
                    + ще {taskCompletions.length - 5}
                  </p>
                )}
              </div>
            )}

            {taskPhotos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {taskPhotos.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setLightbox({ src: c.photo_url!, caption: task.title })
                    }
                    className="overflow-hidden rounded-lg border border-party-gold/30 p-1"
                  >
                    <ResponsivePhoto
                      src={c.photo_url!}
                      alt={task.title}
                      thumbnail
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${done ? "text-party-gold-light" : "text-party-gold"}`}>
              ${task.reward}
            </p>
            {isRepeatable && !onCompletedTab && (
              <p className="text-[9px] text-party-cream/40">за кожного разу</p>
            )}
            {canDoMore && (
              <button
                onClick={() => handleCompleteClick(task)}
                disabled={loading === task.id}
                className="mt-1 text-[10px] font-semibold tracking-wider text-party-gold hover:underline disabled:opacity-50"
              >
                {loading === task.id
                  ? "..."
                  : needsPerson || task.icon === "camera" || isRepeatable
                    ? "ДОДАТИ"
                    : "ВИКОНАТИ"}
              </button>
            )}
            {canUndo && (
              <button
                onClick={() => handleUndo(task)}
                disabled={loading === task.id}
                className="mt-1 block text-[10px] font-semibold tracking-wider text-party-cream/40 hover:text-red-400 disabled:opacity-50"
              >
                СКАСУВАТИ
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader title="ЗАВДАННЯ" />

      <div className="mb-4 flex gap-2 px-4">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 rounded-xl py-3 text-xs font-semibold tracking-widest transition-all ${
            tab === "active"
              ? "bg-party-gold text-party-bg"
              : "border border-party-cream/15 text-party-cream/60"
          }`}
        >
          АКТИВНІ ({activeTabTasks.length})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`flex-1 rounded-xl py-3 text-xs font-semibold tracking-widest transition-all ${
            tab === "completed"
              ? "bg-party-gold text-party-bg"
              : "border border-party-cream/15 text-party-cream/60"
          }`}
        >
          ВИКОНАНІ ({completedTabTasks.length})
        </button>
      </div>

      <div className="space-y-3 px-4">
        {visibleTasks.length === 0 && (
          <p className="py-8 text-center text-sm text-party-cream/40">
            {tab === "active" ? "Немає активних завдань" : "Ще немає виконаних завдань"}
          </p>
        )}

        {visibleTasks.map((task) =>
          renderTaskCard(task, tab === "completed")
        )}
      </div>

      {lightbox && (
        <PhotoLightbox
          src={lightbox.src}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}

      <ParticipantPicker
        open={!!pickerTask}
        taskTitle={pickerTask?.title || ""}
        currentUserId={currentUser?.id || ""}
        participants={allParticipants}
        excludedIds={
          pickerTask
            ? getCompletedGuestIds(getTaskCompletions(pickerTask.id))
            : []
        }
        requiresNote={pickerTask ? getBehavior(pickerTask).requires_note : false}
        noteLabel="Яке спільне хобі?"
        notePlaceholder="Наприклад: танці, подорожі, кіно..."
        onSelect={handlePersonSelected}
        onClose={() => {
          setPickerTask(null);
          setPendingPhoto(null);
        }}
      />

      <BottomNav />
    </div>
  );
}
