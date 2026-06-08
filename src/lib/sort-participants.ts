import type { Participant } from "./types";

/** Рейтинг: спочатку баланс, при однаковому — sort_order з бази */
export function sortByRating(list: Participant[]): Participant[] {
  return [...list].sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

