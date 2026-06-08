-- Повторювані завдання + історія виконань з фото
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeatable BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  photo_url TEXT,
  selected_participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_completions_participant ON task_completions(participant_id, task_id);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all task_completions" ON task_completions;
CREATE POLICY "Allow all task_completions" ON task_completions FOR ALL USING (true) WITH CHECK (true);

-- Фото з гостями: можна з кожним окремо (9 інших гостей)
UPDATE tasks SET
  repeatable = true,
  requires_person = true,
  max_progress = 9,
  description = 'Сфотографуйся з кожним гостем окремо'
WHERE icon = 'camera' AND type = 'regular';

-- Інші завдання з вибором людини — теж повторювані
UPDATE tasks SET repeatable = true, max_progress = 9
WHERE requires_person = true AND type = 'regular' AND icon != 'camera' AND max_progress <= 1;
