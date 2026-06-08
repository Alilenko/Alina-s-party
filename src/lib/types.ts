export interface Participant {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  about_me: string | null;
  how_knows_alina: string | null;
  favorite_movie: string | null;
  favorite_music: string | null;
  hobby: string | null;
  dream_place: string | null;
  quote: string | null;
  secret_question: string | null;
  /** @deprecated */
  interests?: string | null;
  favorite_colors?: string | null;
  fun_fact?: string | null;
  balance: number;
  sort_order?: number;
  is_birthday_girl: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  type: "regular";
  icon: string;
  max_progress: number;
  sort_order: number;
  active: boolean;
  requires_person?: boolean;
  repeatable?: boolean;
  requires_note?: boolean;
}

export interface TaskCompletion {
  id: string;
  participant_id: string;
  task_id: string;
  photo_url: string | null;
  selected_participant_id: string | null;
  note: string | null;
  reward: number;
  created_at: string;
}

export interface TaskPersonSelection {
  id: string;
  participant_id: string;
  task_id: string;
  selected_participant_id: string;
  created_at: string;
  selected?: Participant;
}

export interface UserTask {
  id: string;
  participant_id: string;
  task_id: string;
  status: "active" | "completed" | "pending";
  progress: number;
  photo_url: string | null;
  completed_at: string | null;
  task?: Task;
}

export interface FeedEvent {
  id: string;
  participant_id: string;
  message: string;
  amount: number;
  event_type: "task" | "message";
  photo_url?: string | null;
  created_at: string;
  participant?: Participant;
}

export interface TaskPhoto {
  id: string;
  photo_url: string;
  completed_at: string | null;
  participant?: Participant;
  task?: { title: string };
}

export interface GuestMessage {
  id: string;
  participant_id: string;
  content: string;
  created_at: string;
  participant?: Participant;
}

export interface PartySettings {
  id: number;
  secret_quest_active: boolean;
  updated_at: string;
}

export interface SecretQuestRound {
  id: string;
  status: "active" | "completed";
  author_ids: string[];
  created_at: string;
  completed_at: string | null;
}

export interface SecretQuestQuestion {
  index: number;
  question: string;
}

export interface SecretQuestGuess {
  id: string;
  round_id: string;
  guesser_id: string;
  question_index: number;
  guessed_author_id: string;
  created_at: string;
}
