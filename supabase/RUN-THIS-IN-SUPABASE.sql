-- ▶ Скопіюй цей файл і запусти в Supabase → SQL Editor → Run
-- https://supabase.com/dashboard/project/khvdqvphfsseoftbowxr/sql/new

-- === Профіль гостей ===
ALTER TABLE participants ADD COLUMN IF NOT EXISTS about_me TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS how_knows_alina TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS favorite_movie TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS favorite_music TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS hobby TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS dream_place TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS secret_question TEXT;

UPDATE participants SET about_me = interests WHERE about_me IS NULL AND interests IS NOT NULL;
UPDATE participants SET hobby = fun_fact WHERE hobby IS NULL AND fun_fact IS NOT NULL;

-- === Секретний квест ===

CREATE TABLE IF NOT EXISTS party_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  secret_quest_active BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO party_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS secret_quest_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  author_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS secret_quest_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES secret_quest_rounds(id) ON DELETE CASCADE,
  guesser_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL CHECK (question_index >= 0 AND question_index < 4),
  guessed_author_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(round_id, guesser_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_secret_quest_guesses_round ON secret_quest_guesses(round_id);

ALTER TABLE party_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_quest_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_quest_guesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all party_settings" ON party_settings;
DROP POLICY IF EXISTS "Allow all secret_quest_guesses" ON secret_quest_guesses;
DROP POLICY IF EXISTS "Allow all secret_quest_rounds" ON secret_quest_rounds;

CREATE POLICY "Allow all party_settings" ON party_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all secret_quest_rounds" ON secret_quest_rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all secret_quest_guesses" ON secret_quest_guesses FOR ALL USING (true) WITH CHECK (true);

-- === Завдання: вибір гостей, повторювані, хобі ===
ALTER TABLE participants ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_person BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeatable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_note BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS task_person_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  selected_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_id, task_id, selected_participant_id)
);

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  photo_url TEXT,
  selected_participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  note TEXT,
  reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE task_person_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all task_person_selections" ON task_person_selections;
DROP POLICY IF EXISTS "Allow all task_completions" ON task_completions;
CREATE POLICY "Allow all task_person_selections" ON task_person_selections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all task_completions" ON task_completions FOR ALL USING (true) WITH CHECK (true);

-- === Алфавітний порядок гостей ===
UPDATE participants SET sort_order = 1 WHERE slug = 'alina';
UPDATE participants SET sort_order = 2, name = 'Аліна Ш.' WHERE slug IN ('alina-sh', 'alina-k');
UPDATE participants SET sort_order = 3 WHERE slug = 'bohdan';
UPDATE participants SET sort_order = 4 WHERE slug = 'ira';
UPDATE participants SET sort_order = 5 WHERE slug = 'maria';
UPDATE participants SET sort_order = 6 WHERE slug = 'oleg';
UPDATE participants SET sort_order = 7 WHERE slug = 'oleksiy';
UPDATE participants SET sort_order = 8 WHERE slug = 'olesya';
UPDATE participants SET sort_order = 9 WHERE slug = 'ruslan';
UPDATE participants SET sort_order = 10 WHERE slug = 'tanya';

-- === Прибрати бінго (якщо ще залишилось) ===
DELETE FROM task_completions WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');
DELETE FROM task_person_selections WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');
DELETE FROM user_tasks WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');
DELETE FROM tasks WHERE type = 'bingo';
UPDATE feed_events SET event_type = 'task' WHERE event_type = 'bingo';
DROP POLICY IF EXISTS "Allow all bingo_marks" ON bingo_marks;
DROP TABLE IF EXISTS bingo_marks;
ALTER TABLE tasks DROP COLUMN IF EXISTS bingo_cell;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type = 'regular');
ALTER TABLE feed_events DROP CONSTRAINT IF EXISTS feed_events_event_type_check;
ALTER TABLE feed_events ADD CONSTRAINT feed_events_event_type_check CHECK (event_type IN ('task', 'message'));
ALTER TABLE feed_events ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Квест: необмежена кількість питань у раунді
ALTER TABLE secret_quest_guesses DROP CONSTRAINT IF EXISTS secret_quest_guesses_question_index_check;
ALTER TABLE secret_quest_guesses ADD CONSTRAINT secret_quest_guesses_question_index_check CHECK (question_index >= 0);

UPDATE tasks SET requires_note = true WHERE type = 'regular' AND title = 'Знайди людину з таким же хобі';
UPDATE participants SET slug = 'alina-sh' WHERE slug = 'alina-k';
