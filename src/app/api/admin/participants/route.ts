import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { fetchAllParticipants } from "@/lib/participants-query";
import { createServerSupabase } from "@/lib/supabase-server";
import { slugify } from "@/lib/slugify";

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
  const data = await fetchAllParticipants(supabase);

  return NextResponse.json({
    participants: data.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sort_order: p.sort_order,
      balance: p.balance,
      is_birthday_girl: p.is_birthday_girl,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { name, password, slug: customSlug } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Введіть ім'я гостя" }, { status: 400 });
  }

  const guestPassword = password?.trim() || "guest2026";
  let slug = customSlug?.trim() || slugify(name);

  if (!slug) {
    return NextResponse.json({ error: "Не вдалося створити логін" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("participants")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const allGuests = await fetchAllParticipants(supabase);
  const maxSort = allGuests.reduce((max, g) => Math.max(max, g.sort_order ?? 0), 0);

  const { data, error } = await supabase
    .from("participants")
    .insert({
      name: name.trim(),
      slug,
      password: guestPassword,
      sort_order: maxSort + 1,
      is_birthday_girl: false,
      balance: 0,
    })
    .select("id, name, slug, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ participant: data, password: guestPassword });
}
