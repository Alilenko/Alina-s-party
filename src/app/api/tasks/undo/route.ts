import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { getTaskBehavior } from "@/lib/task-behavior";

export async function POST(request: NextRequest) {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await request.json();
  if (!taskId) {
    return NextResponse.json({ error: "Не вказано завдання" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) {
    return NextResponse.json({ error: "Завдання не знайдено" }, { status: 404 });
  }

  const { repeatable, requires_person } = getTaskBehavior(task);

  const { data: existing } = await supabase
    .from("user_tasks")
    .select("*")
    .eq("participant_id", participant.id)
    .eq("task_id", taskId)
    .maybeSingle();

  if (!existing || existing.progress === 0) {
    return NextResponse.json({ error: "Немає що скасовувати" }, { status: 400 });
  }

  let refund = 0;

  if (repeatable) {
    const { data: lastCompletion } = await supabase
      .from("task_completions")
      .select("id, reward, selected_participant_id")
      .eq("participant_id", participant.id)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    refund = lastCompletion?.reward || task.reward;

    if (lastCompletion) {
      await supabase.from("task_completions").delete().eq("id", lastCompletion.id);
    }

    if (requires_person && lastCompletion?.selected_participant_id) {
      await supabase
        .from("task_person_selections")
        .delete()
        .eq("participant_id", participant.id)
        .eq("task_id", taskId)
        .eq("selected_participant_id", lastCompletion.selected_participant_id);
    }

    const newProgress = Math.max(0, existing.progress - 1);

    if (newProgress === 0) {
      await supabase.from("user_tasks").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("user_tasks")
        .update({
          progress: newProgress,
          status: "active",
          completed_at: null,
        })
        .eq("id", existing.id);
    }
  } else {
    refund = task.reward;

    const { data: completion } = await supabase
      .from("task_completions")
      .select("reward")
      .eq("participant_id", participant.id)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (completion?.reward) refund = completion.reward;

    await supabase
      .from("task_completions")
      .delete()
      .eq("participant_id", participant.id)
      .eq("task_id", taskId);

    await supabase
      .from("task_person_selections")
      .delete()
      .eq("participant_id", participant.id)
      .eq("task_id", taskId);

    await supabase.from("user_tasks").delete().eq("id", existing.id);
  }

  const newBalance = Math.max(0, participant.balance - refund);
  await supabase
    .from("participants")
    .update({ balance: newBalance })
    .eq("id", participant.id);

  await supabase.from("feed_events").insert({
    participant_id: participant.id,
    message: `скасував(ла) «${task.title}»`,
    amount: -refund,
    event_type: "task",
  });

  return NextResponse.json({ refunded: refund, newBalance });
}
