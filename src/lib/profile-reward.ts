import type { SupabaseClient } from "@supabase/supabase-js";
import type { Participant } from "./types";
import {
  isProfileComplete,
  PROFILE_COMPLETE_REWARD,
  PROFILE_COMPLETE_REWARD_MESSAGE,
  PROFILE_REVOKE_REWARD_MESSAGE,
} from "./profile-fields";

async function hasActiveProfileReward(
  supabase: SupabaseClient,
  participantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("feed_events")
    .select("message")
    .eq("participant_id", participantId)
    .in("message", [
      PROFILE_COMPLETE_REWARD_MESSAGE,
      PROFILE_REVOKE_REWARD_MESSAGE,
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.message === PROFILE_COMPLETE_REWARD_MESSAGE;
}

export async function syncProfileCompleteReward(
  supabase: SupabaseClient,
  participant: Participant
): Promise<{ granted: boolean; revoked: boolean; amount: number }> {
  const complete = isProfileComplete(participant);
  const rewarded = await hasActiveProfileReward(supabase, participant.id);

  if (complete && !rewarded) {
    await supabase
      .from("participants")
      .update({ balance: participant.balance + PROFILE_COMPLETE_REWARD })
      .eq("id", participant.id);

    await supabase.from("feed_events").insert({
      participant_id: participant.id,
      message: PROFILE_COMPLETE_REWARD_MESSAGE,
      amount: PROFILE_COMPLETE_REWARD,
      event_type: "task",
    });

    return { granted: true, revoked: false, amount: PROFILE_COMPLETE_REWARD };
  }

  if (!complete && rewarded) {
    await supabase
      .from("participants")
      .update({
        balance: Math.max(0, participant.balance - PROFILE_COMPLETE_REWARD),
      })
      .eq("id", participant.id);

    await supabase.from("feed_events").insert({
      participant_id: participant.id,
      message: PROFILE_REVOKE_REWARD_MESSAGE,
      amount: -PROFILE_COMPLETE_REWARD,
      event_type: "task",
    });

    return { granted: false, revoked: true, amount: PROFILE_COMPLETE_REWARD };
  }

  return { granted: false, revoked: false, amount: 0 };
}
