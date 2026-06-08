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
  const data = await fetchAllParticipants(supabase);

  return NextResponse.json({ participants: data });
}
