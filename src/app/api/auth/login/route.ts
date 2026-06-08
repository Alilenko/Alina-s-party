import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { slug, password } = await request.json();

  if (!slug || !password) {
    return NextResponse.json({ error: "Введіть ім'я та пароль" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { count, error: countError } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true });

  if (countError?.code === "PGRST205" || countError?.message?.includes("participants")) {
    return NextResponse.json(
      {
        error:
          "База даних не налаштована. Запустіть supabase/setup-all.sql у Supabase SQL Editor.",
      },
      { status: 503 }
    );
  }

  const { data: participant, error } = await supabase
    .from("participants")
    .select("*")
    .eq("slug", slug)
    .eq("password", password)
    .single();

  if (error || !participant) {
    if (count === 0) {
      return NextResponse.json(
        {
          error:
            "Гості ще не додані. Запустіть supabase/setup-all.sql у Supabase SQL Editor.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
  }

  await setSession(participant.id);

  return NextResponse.json({ participant });
}
