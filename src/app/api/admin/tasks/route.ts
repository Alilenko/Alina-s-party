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

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("type", "regular")
    .order("active", { ascending: false })
    .order("sort_order", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const body = await request.json();
  const { title, description, reward, icon, max_progress, requires_person, repeatable } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Введіть назву завдання" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { data: lastTask } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("type", "regular")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      reward: Math.max(100, Math.round((reward || 100) / 100) * 100),
      type: "regular",
      icon: icon || "star",
      max_progress: repeatable ? 1 : (max_progress || 1),
      sort_order: (lastTask?.sort_order || 0) + 1,
      active: true,
      requires_person: requires_person === true,
      repeatable: repeatable === true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
