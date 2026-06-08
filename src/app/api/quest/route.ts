import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { fetchAllParticipants } from "@/lib/participants-query";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  applyGuessReward,
  buildQuestionOptions,
  getActiveRound,
  getPartySettings,
} from "@/lib/secret-quest";

function buildResults(
  authorIds: string[],
  all: { id: string; name: string; secret_question: string | null }[],
  guesses: { question_index: number; guessed_author_id: string }[],
  nameById: Map<string, string>
) {
  return guesses.map((g) => {
    const authorId = authorIds[g.question_index];
    const author = all.find((p) => p.id === authorId);
    return {
      questionIndex: g.question_index,
      questionText: author?.secret_question || "—",
      guessedName: nameById.get(g.guessed_author_id) || "—",
      correctName: nameById.get(authorId) || "—",
      isCorrect: g.guessed_author_id === authorId,
    };
  });
}

export async function GET() {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabase();
  const settings = await getPartySettings(supabase);
  const round = await getActiveRound(supabase);

  if (!settings.secret_quest_active || !round) {
    return NextResponse.json({
      active: false,
      settings,
      round: null,
      questions: [],
      myGuesses: [],
      results: [],
    });
  }

  const all = await fetchAllParticipants(supabase);
  const authorIds: string[] = round.author_ids;
  const nameById = new Map(all.map((p) => [p.id, p.name]));

  const questions = authorIds.map((authorId, index) => {
    const author = all.find((p) => p.id === authorId);
    return {
      index,
      question: author?.secret_question || "—",
      isMine: authorId === participant.id,
      options: buildQuestionOptions(authorIds, index, round.id, nameById),
    };
  });

  const { data: myGuesses } = await supabase
    .from("secret_quest_guesses")
    .select("*")
    .eq("round_id", round.id)
    .eq("guesser_id", participant.id);

  const answerableCount = questions.filter((q) => !q.isMine).length;
  const answeredCount = (myGuesses || []).length;
  const allAnswered =
    answerableCount > 0 && answeredCount >= answerableCount;

  const answerableIndices = new Set(
    questions.filter((q) => !q.isMine).map((q) => q.index)
  );
  const myAnswerableGuesses = (myGuesses || []).filter((g) =>
    answerableIndices.has(g.question_index)
  );

  const results = allAnswered
    ? buildResults(authorIds, all, myAnswerableGuesses, nameById).sort(
        (a, b) => a.questionIndex - b.questionIndex
      )
    : [];

  const totalEarned = results.filter((r) => r.isCorrect).length * 100;

  return NextResponse.json({
    active: true,
    settings,
    round: { id: round.id, status: round.status },
    questions,
    myGuesses: myGuesses || [],
    allAnswered,
    results,
    totalEarned,
  });
}

async function saveGuess(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  round: { id: string; author_ids: string[] },
  participantId: string,
  questionIndex: number,
  guessedAuthorId: string
) {
  const authorIds: string[] = round.author_ids;

  if (questionIndex < 0 || questionIndex >= authorIds.length) {
    return NextResponse.json({ error: "Невірний факт" }, { status: 400 });
  }
  if (authorIds[questionIndex] === participantId) {
    return NextResponse.json(
      { error: "Не можна вгадувати власний факт" },
      { status: 400 }
    );
  }
  if (!authorIds.includes(guessedAuthorId)) {
    return NextResponse.json({ error: "Невірний варіант" }, { status: 400 });
  }

  const correctAuthorId = authorIds[questionIndex];

  const { data: prevGuess } = await supabase
    .from("secret_quest_guesses")
    .select("guessed_author_id")
    .eq("round_id", round.id)
    .eq("guesser_id", participantId)
    .eq("question_index", questionIndex)
    .maybeSingle();

  const wasCorrect = prevGuess?.guessed_author_id === correctAuthorId;
  const isCorrect = guessedAuthorId === correctAuthorId;

  const { error } = await supabase.from("secret_quest_guesses").upsert(
    {
      round_id: round.id,
      guesser_id: participantId,
      question_index: questionIndex,
      guessed_author_id: guessedAuthorId,
    },
    { onConflict: "round_id,guesser_id,question_index" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rewardDelta = await applyGuessReward(
    supabase,
    participantId,
    wasCorrect,
    isCorrect
  );

  return NextResponse.json({
    success: true,
    isCorrect,
    rewardDelta,
  });
}

export async function POST(request: NextRequest) {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createServerSupabase();
  const settings = await getPartySettings(supabase);
  const round = await getActiveRound(supabase);

  if (!settings.secret_quest_active || !round) {
    return NextResponse.json({ error: "Квест не активний" }, { status: 400 });
  }

  if (
    body.questionIndex !== undefined &&
    body.guessedAuthorId !== undefined
  ) {
    return saveGuess(
      supabase,
      round,
      participant.id,
      body.questionIndex,
      body.guessedAuthorId
    );
  }

  const { guesses } = body;
  if (!Array.isArray(guesses) || guesses.length === 0) {
    return NextResponse.json({ error: "Вкажи відповіді" }, { status: 400 });
  }

  for (const g of guesses) {
    const result = await saveGuess(
      supabase,
      round,
      participant.id,
      g.questionIndex,
      g.guessedAuthorId
    );
    if (!result.ok) return result;
  }

  return NextResponse.json({ success: true });
}
