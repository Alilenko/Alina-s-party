import type { SupabaseClient } from "@supabase/supabase-js";
import type { Participant } from "./types";

/** Гості з БД, відсортовані за sort_order (алфавіт) або за name */
export async function fetchAllParticipants(
  supabase: SupabaseClient
): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!error && data) return data;

  const fallback = await supabase
    .from("participants")
    .select("*")
    .order("name", { ascending: true });

  return fallback.data || [];
}
