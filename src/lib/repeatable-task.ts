import type { SupabaseClient } from "@supabase/supabase-js";

/** Скільки інших гостей є (без поточного учасника) */
export async function getOtherGuestsCount(
  supabase: SupabaseClient,
  currentParticipantId: string
): Promise<number> {
  const { count: total } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true });

  return Math.max(0, (total || 0) - 1);
}

/** Скільки унікальних гостей уже обрано для завдання */
export async function getSelectionCount(
  supabase: SupabaseClient,
  participantId: string,
  taskId: string
): Promise<number> {
  const { count } = await supabase
    .from("task_person_selections")
    .select("*", { count: "exact", head: true })
    .eq("participant_id", participantId)
    .eq("task_id", taskId);

  return count || 0;
}

export async function isRepeatableTaskComplete(
  supabase: SupabaseClient,
  participantId: string,
  taskId: string
): Promise<boolean> {
  const max = await getOtherGuestsCount(supabase, participantId);
  const progress = await getSelectionCount(supabase, participantId, taskId);
  return max > 0 && progress >= max;
}
