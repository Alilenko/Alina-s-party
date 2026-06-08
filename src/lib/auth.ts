import { cookies } from "next/headers";
import { createServerSupabase } from "./supabase-server";
import type { Participant } from "./types";

const SESSION_COOKIE = "party_participant_id";

export async function getSessionParticipant(): Promise<Participant | null> {
  const cookieStore = await cookies();
  const participantId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!participantId) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("participants")
    .select("*")
    .eq("id", participantId)
    .single();

  return data;
}

export async function setSession(participantId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, participantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 днів
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
