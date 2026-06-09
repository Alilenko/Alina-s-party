import type { SupabaseClient } from "@supabase/supabase-js";
import type { Participant } from "./types";

/** Нові колонки → старі, якщо міграцію ще не запускали */
const LEGACY_COLUMN_MAP: Record<string, string> = {
  about_me: "interests",
  hobby: "fun_fact",
};

export function buildProfilePayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const textFields = [
    "about_me",
    "how_knows_alina",
    "favorite_movie",
    "favorite_music",
    "hobby",
    "dream_place",
    "quote",
  ] as const;

  for (const key of textFields) {
    const val = body[key];
    if (val !== undefined) {
      payload[key] = typeof val === "string" ? val.trim() || null : null;
    }
  }

  if (body.photo_url !== undefined) {
    payload.photo_url = body.photo_url || null;
  }

  if (body.secret_question !== undefined) {
    payload.secret_question =
      typeof body.secret_question === "string"
        ? body.secret_question.trim() || null
        : null;
  }

  // Старі колонки більше не використовуємо — очищаємо, щоб не «повертався» тестовий текст
  if (payload.about_me !== undefined) {
    payload.interests = null;
  }
  if (payload.hobby !== undefined) {
    payload.fun_fact = null;
  }

  return payload;
}

function missingColumn(message: string): string | null {
  const match = message.match(/Could not find the '(\w+)' column/);
  return match?.[1] || null;
}

const STRIPPED_FIELD_LABELS: Record<string, string> = {
  how_knows_alina: "Звідки ти знаєш Аліну?",
  favorite_movie: "Улюблений фільм / серіал / аніме",
  favorite_music: "Улюблена музика",
  dream_place: "Місце, куди хочу поїхати",
  about_me: "Про себе",
  hobby: "Хобі",
};

export async function updateParticipantProfile(
  supabase: SupabaseClient,
  participantId: string,
  body: Record<string, unknown>
): Promise<{
  data: Participant | null;
  error: string | null;
  strippedFields: string[];
}> {
  let payload = buildProfilePayload(body);
  const stripped: string[] = [];

  for (let attempt = 0; attempt < 15; attempt++) {
    const { data, error } = await supabase
      .from("participants")
      .update(payload)
      .eq("id", participantId)
      .select()
      .single();

    if (!error) {
      return {
        data: data as Participant,
        error: null,
        strippedFields: [...new Set(stripped)],
      };
    }

    const col = missingColumn(error.message);
    if (!col || !(col in payload)) {
      return { data: null, error: error.message, strippedFields: stripped };
    }

    const value = payload[col];
    const hadValue =
      typeof value === "string" ? value.trim().length > 0 : value != null;
    delete payload[col];

    const legacyKey = LEGACY_COLUMN_MAP[col];
    if (legacyKey && value !== undefined) {
      payload[legacyKey] = value;
    } else if (hadValue) {
      stripped.push(STRIPPED_FIELD_LABELS[col] || col);
    }
  }

  return {
    data: null,
    error: "Не вдалося зберегти профіль",
    strippedFields: stripped,
  };
}
