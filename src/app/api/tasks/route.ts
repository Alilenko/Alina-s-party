import { NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { fetchAllParticipants } from "@/lib/participants-query";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabase();

  const [
    { data: activeTasks },
    { data: progress },
    { data: taskCompletions },
    { data: personSelections },
    guests,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("type", "regular")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("user_tasks")
      .select("*")
      .eq("participant_id", participant.id),
    supabase
      .from("task_completions")
      .select("*")
      .eq("participant_id", participant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("task_person_selections")
      .select("task_id, selected_participant_id")
      .eq("participant_id", participant.id),
    fetchAllParticipants(supabase),
  ]);

  const relatedTaskIds = new Set<string>();
  taskCompletions?.forEach((c) => relatedTaskIds.add(c.task_id));
  progress
    ?.filter((ut) => ut.status === "completed" || (ut.progress || 0) > 0)
    .forEach((ut) => relatedTaskIds.add(ut.task_id));

  const activeIds = new Set((activeTasks || []).map((t) => t.id));
  const missingIds = [...relatedTaskIds].filter((id) => !activeIds.has(id));

  let allTasks = [...(activeTasks || [])];
  if (missingIds.length > 0) {
    const { data: hiddenTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("type", "regular")
      .in("id", missingIds)
      .order("sort_order");

    if (hiddenTasks?.length) {
      allTasks = [...allTasks, ...hiddenTasks].sort(
        (a, b) => a.sort_order - b.sort_order
      );
    }
  }

  return NextResponse.json({
    tasks: allTasks,
    userTasks: progress || [],
    completions: taskCompletions || [],
    personSelections: personSelections || [],
    participants: guests,
  });
}
