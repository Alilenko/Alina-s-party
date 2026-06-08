import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const participant = await getSessionParticipant();
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "photos";

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${folder}/${participant.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("party-photos")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("party-photos")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
