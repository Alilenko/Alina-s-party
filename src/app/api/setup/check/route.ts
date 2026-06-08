import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabase();

  const { count, error } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true });

  if (error) {
    const notReady =
      error.code === "PGRST205" || error.message.includes("participants");
    return NextResponse.json({
      ready: false,
      participants: 0,
      error: notReady
        ? "Таблиці ще не створені"
        : error.message,
      hint: "Відкрий Supabase → SQL Editor → вставити файл supabase/setup-all.sql → Run",
    });
  }

  return NextResponse.json({
    ready: (count ?? 0) > 0,
    participants: count ?? 0,
    hint: (count ?? 0) === 0 ? "Таблиці є, але гості не додані — запустіть setup-all.sql" : undefined,
  });
}
