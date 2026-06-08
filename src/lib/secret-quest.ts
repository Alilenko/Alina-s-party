import type { SupabaseClient } from "@supabase/supabase-js";

export const QUEST_REWARD_CORRECT = 100;
export const QUEST_REWARD_UNGUESSED = 300;
export const QUEST_OPTION_LABELS = ["A", "B", "C", "D"] as const;
export const MAX_QUEST_OPTIONS = 4;

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let s = hashSeed(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildQuestionOptions(
  authorIds: string[],
  questionIndex: number,
  roundId: string,
  nameById: Map<string, string>
): { id: string; name: string; label: string }[] {
  const correctId = authorIds[questionIndex];
  const wrongPool = authorIds.filter((id) => id !== correctId);
  const wrongCount = Math.min(
    MAX_QUEST_OPTIONS - 1,
    wrongPool.length
  );
  const wrongPicked = seededShuffle(
    wrongPool,
    `${roundId}-${questionIndex}-wrong`
  ).slice(0, wrongCount);

  const optionIds = seededShuffle(
    [correctId, ...wrongPicked],
    `${roundId}-${questionIndex}-options`
  );

  return optionIds.map((id, i) => ({
    id,
    name: nameById.get(id) || "—",
    label: QUEST_OPTION_LABELS[i] || String(i + 1),
  }));
}

export async function getPartySettings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("party_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) return { secret_quest_active: false };
  return data || { secret_quest_active: false };
}

export async function applyGuessReward(
  supabase: SupabaseClient,
  guesserId: string,
  wasCorrect: boolean,
  isCorrect: boolean
): Promise<number> {
  if (wasCorrect === isCorrect) return 0;

  const delta = isCorrect ? QUEST_REWARD_CORRECT : -QUEST_REWARD_CORRECT;

  const { data: guesser } = await supabase
    .from("participants")
    .select("balance, name")
    .eq("id", guesserId)
    .single();

  if (!guesser) return 0;

  await supabase
    .from("participants")
    .update({ balance: Math.max(0, guesser.balance + delta) })
    .eq("id", guesserId);

  await supabase.from("feed_events").insert({
    participant_id: guesserId,
    message: isCorrect
      ? "вгадав(ла) цікавий факт!"
      : "скасував(ла) вгадку цікавого факту",
    amount: delta,
    event_type: "task",
  });

  return delta;
}

export async function awardUnguessedAuthorRewards(
  supabase: SupabaseClient,
  round: { id: string; author_ids: string[] }
): Promise<number> {
  const authorIds: string[] = round.author_ids;

  const { data: guesses } = await supabase
    .from("secret_quest_guesses")
    .select("*")
    .eq("round_id", round.id);

  let awarded = 0;

  for (let i = 0; i < authorIds.length; i++) {
    const authorId = authorIds[i];
    const hasCorrectGuess = (guesses || []).some(
      (g) => g.question_index === i && g.guessed_author_id === authorId
    );

    if (hasCorrectGuess) continue;

    const { data: author } = await supabase
      .from("participants")
      .select("balance")
      .eq("id", authorId)
      .single();

    if (!author) continue;

    await supabase
      .from("participants")
      .update({ balance: author.balance + QUEST_REWARD_UNGUESSED })
      .eq("id", authorId);

    await supabase.from("feed_events").insert({
      participant_id: authorId,
      message: "ніхто не вгадав цікавий факт — бонус!",
      amount: QUEST_REWARD_UNGUESSED,
      event_type: "task",
    });

    awarded++;
  }

  return awarded;
}

export async function getActiveRound(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("secret_quest_rounds")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}
