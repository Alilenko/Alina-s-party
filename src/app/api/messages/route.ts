import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Порожнє повідомлення" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("guest_messages")
    .insert({
      participant_id: participant.id,
      content: content.trim(),
    })
    .select("*, participant:participants(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("feed_events").insert({
    participant_id: participant.id,
    message: content.trim(),
    amount: 0,
    event_type: "message",
  });

  return NextResponse.json({ message: data });
}
