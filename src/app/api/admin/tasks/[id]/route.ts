import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const {
    title,
    description,
    reward,
    icon,
    max_progress,
    requires_person,
    repeatable,
    active,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Введіть назву завдання" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      reward: Math.max(100, Math.round((reward || 100) / 100) * 100),
      icon: icon || "star",
      max_progress: repeatable ? 1 : (max_progress || 1),
      requires_person: requires_person === true,
      repeatable: repeatable === true,
      active: active !== false,
    })
    .eq("id", id)
    .eq("type", "regular")
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Завдання не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ task: data });
}
