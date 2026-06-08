import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { syncProfileCompleteReward } from "@/lib/profile-reward";
import { updateParticipantProfile } from "@/lib/profile-update";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ participant });
}

export async function PUT(request: NextRequest) {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createServerSupabase();

  const { data, error, strippedFields } = await updateParticipantProfile(
    supabase,
    participant.id,
    body
  );

  if (error || !data) {
    return NextResponse.json(
      { error: error || "Не вдалося зберегти профіль", strippedFields },
      { status: 500 }
    );
  }

  const reward = await syncProfileCompleteReward(supabase, data);

  let updatedParticipant = data;
  if (reward.granted || reward.revoked) {
    const { data: refreshed } = await supabase
      .from("participants")
      .select("*")
      .eq("id", data.id)
      .single();
    if (refreshed) updatedParticipant = refreshed;
  }

  return NextResponse.json({
    participant: updatedParticipant,
    strippedFields,
    profileRewardGranted: reward.granted,
    profileRewardRevoked: reward.revoked,
    profileReward: reward.amount,
  });
}
