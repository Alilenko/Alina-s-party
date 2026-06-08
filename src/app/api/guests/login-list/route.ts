import { NextResponse } from "next/server";
import { fetchAllParticipants } from "@/lib/participants-query";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabase();
  const data = await fetchAllParticipants(supabase);

  const guests = data.map((p) => ({
    name: p.is_birthday_girl ? `${p.name} (іменинниця)` : p.name,
    slug: p.slug,
  }));

  return NextResponse.json({ guests });
}
