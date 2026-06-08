import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { fetchAllParticipants } from "@/lib/participants-query";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  awardUnguessedAuthorRewards,
  getActiveRound,
  getPartySettings,
} from "@/lib/secret-quest";

async function requireAdmin() {
  const participant = await getSessionParticipant();
  if (!participant) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!participant.is_birthday_girl) {
    return { error: NextResponse.json({ error: "Доступ лише для іменинниці" }, { status: 403 }) };
  }
  return { participant };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const supabase = await createServerSupabase();
  const settings = await getPartySettings(supabase);
  const round = await getActiveRound(supabase);

  const all = await fetchAllParticipants(supabase);
  const withQuestions = all.filter((p) => p.secret_question?.trim());

  let resultsMatrix: {
    questions: {
      index: number;
      label: string;
      correctAuthorId: string;
    }[];
    guests: { id: string; name: string }[];
    cells: Record<string, Record<number, { guessedName: string; isCorrect: boolean } | null>>;
  } | null = null;

  if (round) {
    const nameById = new Map(all.map((p) => [p.id, p.name]));
    const authorIds: string[] = round.author_ids;
    const guests = all.map((p) => ({ id: p.id, name: p.name }));

    const questions = authorIds.map((authorId, index) => {
      const author = all.find((p) => p.id === authorId);
      const text = author?.secret_question || "—";
      const correctName = nameById.get(authorId) || "—";
      return {
        index,
        label: `${text} (${correctName})`,
        correctAuthorId: authorId,
      };
    });

    const cells: Record<
      string,
      Record<number, { guessedName: string; isCorrect: boolean } | null>
    > = {};

    const { data: guesses } = await supabase
      .from("secret_quest_guesses")
      .select("*")
      .eq("round_id", round.id);

    for (const g of guesses || []) {
      const authorId = authorIds[g.question_index];
      if (!authorId || g.guesser_id === authorId) continue;
      if (!cells[g.guesser_id]) cells[g.guesser_id] = {};
      cells[g.guesser_id][g.question_index] = {
        guessedName: nameById.get(g.guessed_author_id) || "—",
        isCorrect: g.guessed_author_id === authorId,
      };
    }

    resultsMatrix = { questions, guests, cells };
  }

  return NextResponse.json({
    settings,
    round,
    questionCount: withQuestions.length,
    resultsMatrix,
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { secret_quest_active } = await request.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("party_settings")
    .upsert({
      id: 1,
      secret_quest_active: secret_quest_active === true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    const needsMigration =
      error.code === "PGRST205" || error.message.includes("party_settings");
    return NextResponse.json(
      {
        error: needsMigration
          ? "Запусти migration-secret-quest.sql у Supabase SQL Editor"
          : error.message,
      },
      { status: needsMigration ? 503 : 500 }
    );
  }

  return NextResponse.json({ settings: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { action } = await request.json();
  const supabase = await createServerSupabase();

  if (action === "start") {
    const settings = await getPartySettings(supabase);
    if (!settings.secret_quest_active) {
      return NextResponse.json({ error: "Спочатку увімкни квест" }, { status: 400 });
    }

    const existing = await getActiveRound(supabase);
    if (existing) {
      await supabase
        .from("secret_quest_rounds")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    const all = await fetchAllParticipants(supabase);
    const withQuestions = all.filter((p) => p.secret_question?.trim());
    if (withQuestions.length < 1) {
      return NextResponse.json(
        { error: "Потрібно хоча б один цікавий факт" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("secret_quest_rounds")
      .insert({
        author_ids: withQuestions.map((p) => p.id),
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ round: data });
  }

  if (action === "end") {
    const round = await getActiveRound(supabase);
    if (!round) {
      return NextResponse.json({ error: "Немає активного раунду" }, { status: 400 });
    }

    const awardedAuthors = await awardUnguessedAuthorRewards(supabase, round);

    await supabase
      .from("secret_quest_rounds")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", round.id);

    return NextResponse.json({ success: true, awardedAuthors });
  }

  return NextResponse.json({ error: "Невідома дія" }, { status: 400 });
}
