-- Повне оновлення завдань + вибір гостей
-- Запусти в Supabase SQL Editor (один раз)

ALTER TABLE participants ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_person BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeatable BOOLEAN NOT NULL DEFAULT false;

UPDATE participants SET sort_order = 1 WHERE slug = 'alina';
UPDATE participants SET sort_order = 2 WHERE slug = 'alina-sh';
UPDATE participants SET sort_order = 3 WHERE slug = 'bohdan';
UPDATE participants SET sort_order = 4 WHERE slug = 'ira';
UPDATE participants SET sort_order = 5 WHERE slug = 'maria';
UPDATE participants SET sort_order = 6 WHERE slug = 'oleg';
UPDATE participants SET sort_order = 7 WHERE slug = 'oleksiy';
UPDATE participants SET sort_order = 8 WHERE slug = 'olesya';
UPDATE participants SET sort_order = 9 WHERE slug = 'ruslan';
UPDATE participants SET sort_order = 10 WHERE slug = 'tanya';

CREATE TABLE IF NOT EXISTS task_person_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  selected_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_id, task_id, selected_participant_id)
);

CREATE INDEX IF NOT EXISTS idx_task_person_selections ON task_person_selections(participant_id, task_id);

ALTER TABLE task_person_selections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all task_person_selections" ON task_person_selections;
CREATE POLICY "Allow all task_person_selections" ON task_person_selections FOR ALL USING (true) WITH CHECK (true);

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

-- Видалити зайві звичайні завдання (прогрес гостей теж видалиться через CASCADE)
DELETE FROM tasks
WHERE type = 'regular'
  AND title NOT IN (
    'Скажи тост',
    'Зроби спільне фото',
    'Знайди людину з таким же хобі',
    'Розкажи смішну історію',
    'Розкажи історію знайомства'
  );

-- Скажи тост — повторюване, без вибору гостя
UPDATE tasks SET
  description = 'Підніми келих і скажи тост',
  reward = 100,
  icon = 'wine',
  max_progress = 1,
  requires_person = false,
  repeatable = true,
  active = true,
  sort_order = 1
WHERE type = 'regular' AND title = 'Скажи тост';

-- Зроби спільне фото — повторюване, з кожним гостем
UPDATE tasks SET
  description = 'Сфотографуйся з кожним гостем окремо',
  reward = 100,
  icon = 'camera',
  max_progress = 1,
  requires_person = true,
  repeatable = true,
  active = true,
  sort_order = 2
WHERE type = 'regular' AND title = 'Зроби спільне фото';

-- Знайди людину з таким же хобі — повторюване, обрати людину + ввести хобі
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_note BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS note TEXT;

UPDATE tasks SET
  description = 'Знайди гостя зі схожим захопленням',
  reward = 100,
  icon = 'search',
  max_progress = 1,
  requires_person = true,
  requires_note = true,
  repeatable = true,
  active = true,
  sort_order = 3
WHERE type = 'regular' AND title = 'Знайди людину з таким же хобі';

-- Розкажи смішну історію
UPDATE tasks SET
  description = 'Поділись смішною історією з гостями',
  reward = 100,
  icon = 'message',
  max_progress = 1,
  requires_person = false,
  repeatable = false,
  active = true,
  sort_order = 4
WHERE type = 'regular' AND title = 'Розкажи смішну історію';

-- Розкажи історію знайомства (нове)
INSERT INTO tasks (
  title, description, reward, type, icon, max_progress,
  sort_order, requires_person, repeatable, active
)
SELECT
  'Розкажи історію знайомства',
  'Розкажи, як ти познайомилась з Аліною',
  100, 'regular', 'heart', 1,
  5, false, false, true
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE type = 'regular' AND title = 'Розкажи історію знайомства'
);

UPDATE tasks SET
  description = 'Розкажи, як ти познайомилась з Аліною',
  reward = 100,
  icon = 'heart',
  max_progress = 1,
  requires_person = false,
  repeatable = false,
  active = true,
  sort_order = 5
WHERE type = 'regular' AND title = 'Розкажи історію знайомства';

-- Скинути «хобі» якщо виконали без вибору гостя
UPDATE user_tasks SET status = 'active', progress = 0, completed_at = NULL
WHERE task_id IN (SELECT id FROM tasks WHERE type = 'regular' AND title = 'Знайди людину з таким же хобі')
  AND NOT EXISTS (
    SELECT 1 FROM task_person_selections s
    WHERE s.participant_id = user_tasks.participant_id
      AND s.task_id = user_tasks.task_id
  );
