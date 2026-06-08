-- Секретне питання + груповий квест
-- Запусти в Supabase SQL Editor

ALTER TABLE participants ADD COLUMN IF NOT EXISTS secret_question TEXT;

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
DROP POLICY IF EXISTS "Allow all secret_quest_rounds" ON secret_quest_rounds;
DROP POLICY IF EXISTS "Allow all secret_quest_guesses" ON secret_quest_guesses;

CREATE POLICY "Allow all party_settings" ON party_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all secret_quest_rounds" ON secret_quest_rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all secret_quest_guesses" ON secret_quest_guesses FOR ALL USING (true) WITH CHECK (true);
