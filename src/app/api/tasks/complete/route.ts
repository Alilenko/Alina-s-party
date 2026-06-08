import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { getTaskBehavior } from "@/lib/task-behavior";

export async function POST(request: NextRequest) {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, photoUrl, selectedParticipantId, note } = await request.json();
  const supabase = await createServerSupabase();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const {
    requires_person,
    repeatable: isRepeatable,
    requires_note,
    repeat_per_guest,
  } = getTaskBehavior(task);

  if (requires_person) {
    if (!selectedParticipantId) {
      return NextResponse.json({ error: "Оберіть людину зі списку" }, { status: 400 });
    }
    if (selectedParticipantId === participant.id) {
      return NextResponse.json({ error: "Не можна обрати себе" }, { status: 400 });
    }
  }

  if (requires_note && !note?.trim()) {
    return NextResponse.json({ error: "Введіть хобі" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("user_tasks")
    .select("*")
    .eq("participant_id", participant.id)
    .eq("task_id", taskId)
    .maybeSingle();

  if (existing?.status === "completed" && !isRepeatable) {
    return NextResponse.json({ error: "Вже виконано" }, { status: 400 });
  }

  if (requires_person && selectedParticipantId) {
    const { data: priorCompletion } = await supabase
      .from("task_completions")
      .select("id")
      .eq("participant_id", participant.id)
      .eq("task_id", taskId)
      .eq("selected_participant_id", selectedParticipantId)
      .maybeSingle();

    if (priorCompletion && (repeat_per_guest || !isRepeatable)) {
      return NextResponse.json({ error: "Цю людину вже обрано" }, { status: 400 });
    }

    if (!isRepeatable) {
      const { data: duplicate } = await supabase
        .from("task_person_selections")
        .select("id")
        .eq("participant_id", participant.id)
        .eq("task_id", taskId)
        .eq("selected_participant_id", selectedParticipantId)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json({ error: "Цю людину вже обрано" }, { status: 400 });
      }
    }

    if (!isRepeatable || repeat_per_guest) {
      const { error: selError } = await supabase.from("task_person_selections").insert({
        participant_id: participant.id,
        task_id: taskId,
        selected_participant_id: selectedParticipantId,
      });
      if (
        selError &&
        selError.code !== "PGRST205" &&
        selError.code !== "23505"
      ) {
        return NextResponse.json({ error: selError.message }, { status: 500 });
      }
      if (selError?.code === "23505") {
        return NextResponse.json({ error: "Цю людину вже обрано" }, { status: 400 });
      }
    }
  }

  const newProgress = (existing?.progress || 0) + 1;
  const isComplete = isRepeatable ? false : newProgress >= task.max_progress;
  const shouldReward = isRepeatable || isComplete;

  const completionPayload: Record<string, unknown> = {
    participant_id: participant.id,
    task_id: taskId,
    photo_url: photoUrl || null,
    selected_participant_id: selectedParticipantId || null,
    note: note?.trim() || null,
    reward: shouldReward ? task.reward : 0,
  };

  let { error: completionError } = await supabase
    .from("task_completions")
    .insert(completionPayload);

  if (
    completionError &&
    (completionError.message?.includes("note") ||
      completionError.code === "PGRST204")
  ) {
    delete completionPayload.note;
    ({ error: completionError } = await supabase
      .from("task_completions")
      .insert(completionPayload));
  }

  if (completionError && completionError.code !== "PGRST205") {
    return NextResponse.json({ error: completionError.message }, { status: 500 });
  }

  if (existing) {
    await supabase
      .from("user_tasks")
      .update({
        progress: newProgress,
        status: isComplete ? "completed" : "active",
        photo_url: photoUrl || existing.photo_url,
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_tasks").insert({
      participant_id: participant.id,
      task_id: taskId,
      progress: newProgress,
      status: isComplete ? "completed" : "active",
      photo_url: photoUrl,
      completed_at: isComplete ? new Date().toISOString() : null,
    });
  }

  let selectedName: string | null = null;
  if (selectedParticipantId) {
    const { data: selected } = await supabase
      .from("participants")
      .select("name")
      .eq("id", selectedParticipantId)
      .single();
    selectedName = selected?.name || null;
  }

  let newBalance = participant.balance;

  if (shouldReward) {
    newBalance = participant.balance + task.reward;
    await supabase
      .from("participants")
      .update({ balance: newBalance })
      .eq("id", participant.id);
  }

  const noteText = note?.trim();
  const feedMessage = isRepeatable
    ? selectedName
      ? `«${task.title}» з ${selectedName}`
      : `«${task.title}»`
    : isComplete
      ? selectedName
        ? noteText
          ? `виконав(ла) «${task.title}» з ${selectedName} — ${noteText}`
          : `виконав(ла) «${task.title}» з ${selectedName}`
        : `виконав(ла) завдання «${task.title}»`
      : selectedName
        ? `крок ${newProgress}/${task.max_progress} «${task.title}» — ${selectedName}`
        : `крок ${newProgress}/${task.max_progress} «${task.title}»`;

  await supabase.from("feed_events").insert({
    participant_id: participant.id,
    message: feedMessage,
    amount: shouldReward ? task.reward : 0,
    event_type: "task",
    photo_url: photoUrl || null,
  });

  return NextResponse.json({
    completed: isComplete,
    progress: newProgress,
    reward: shouldReward ? task.reward : 0,
    newBalance,
  });
}
