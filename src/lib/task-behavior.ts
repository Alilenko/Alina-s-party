import type { Task } from "./types";

const LEGACY_FALLBACK: Record<
  string,
  { requires_person: boolean; repeatable: boolean; requires_note: boolean }
> = {
  "Скажи тост": { requires_person: false, repeatable: true, requires_note: false },
  "Зроби спільне фото": { requires_person: true, repeatable: true, requires_note: false },
  "Знайди людину з таким же хобі": {
    requires_person: true,
    repeatable: true,
    requires_note: true,
  },
};

export function getTaskBehavior(task: Task) {
  const legacy = LEGACY_FALLBACK[task.title];
  const requires_person =
    task.requires_person === true || legacy?.requires_person === true;
  const repeatable =
    task.repeatable === true || legacy?.repeatable === true;
  const requires_note =
    task.requires_note === true || legacy?.requires_note === true;

  return {
    requires_person,
    repeatable,
    requires_note,
    /** без гостя — скільки завгодно; з гостем — з кожним окремо */
    repeat_unlimited: repeatable && !requires_person,
    repeat_per_guest: repeatable && requires_person,
  };
}

export function getCompletedGuestIds(
  completions: { selected_participant_id: string | null }[]
): string[] {
  return [
    ...new Set(
      completions
        .map((c) => c.selected_participant_id)
        .filter((id): id is string => !!id)
    ),
  ];
}
