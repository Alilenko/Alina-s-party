import { User, Heart, Film, Music, Sparkles, MapPin } from "lucide-react";
import type { Participant } from "./types";

export const PROFILE_FIELDS = [
  {
    key: "about_me" as const,
    label: "Про себе",
    placeholder: "Кілька слів про себе...",
    icon: User,
    multiline: true,
  },
  {
    key: "how_knows_alina" as const,
    label: "Звідки ти знаєш Аліну?",
    placeholder: "Школа, робота, друзі...",
    icon: Heart,
  },
  {
    key: "favorite_movie" as const,
    label: "Улюблений фільм / серіал / аніме",
    placeholder: "Назва фільму, серіалу або аніме...",
    icon: Film,
  },
  {
    key: "favorite_music" as const,
    label: "Улюблена музика / артист / жанр",
    placeholder: "Що слухаєш...",
    icon: Music,
  },
  {
    key: "hobby" as const,
    label: "Моє хобі або те, що я хочу спробувати",
    placeholder: "Подорожі, танці, фотографія...",
    icon: Sparkles,
  },
  {
    key: "dream_place" as const,
    label: "Місце, куди я хочу поїхати",
    placeholder: "Мріяна подорож...",
    icon: MapPin,
  },
] as const;

export type ProfileFormData = {
  about_me: string;
  how_knows_alina: string;
  favorite_movie: string;
  favorite_music: string;
  hobby: string;
  dream_place: string;
  quote: string;
  secret_question: string;
};

export const EMPTY_PROFILE_FORM: ProfileFormData = {
  about_me: "",
  how_knows_alina: "",
  favorite_movie: "",
  favorite_music: "",
  hobby: "",
  dream_place: "",
  quote: "",
  secret_question: "",
};

export function participantToForm(p: Participant): ProfileFormData {
  return {
    about_me: p.about_me || p.interests || "",
    how_knows_alina: p.how_knows_alina || "",
    favorite_movie: p.favorite_movie || "",
    favorite_music: p.favorite_music || "",
    hobby: p.hobby || p.fun_fact || "",
    dream_place: p.dream_place || "",
    quote: p.quote || "",
    secret_question: p.secret_question || "",
  };
}

export function getProfileValue(
  p: Participant,
  key: (typeof PROFILE_FIELDS)[number]["key"]
): string | null {
  if (key === "about_me") return p.about_me || p.interests || null;
  if (key === "hobby") return p.hobby || p.fun_fact || null;
  return p[key] || null;
}

export function hasProfileContent(p: Participant): boolean {
  return PROFILE_FIELDS.some((f) => getProfileValue(p, f.key));
}

export function isProfileComplete(p: Participant): boolean {
  return PROFILE_FIELDS.every((f) => {
    const value = getProfileValue(p, f.key);
    return typeof value === "string" && value.trim().length > 0;
  });
}

export const PROFILE_COMPLETE_REWARD = 100;
export const PROFILE_COMPLETE_REWARD_MESSAGE =
  "заповнив(ла) профіль — бонус!";

export const PROFILE_REVOKE_REWARD_MESSAGE =
  "очистив(ла) профіль — бонус скасовано";
