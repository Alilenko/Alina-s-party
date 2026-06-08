-- Вибір людини при виконанні завдання
-- Запусти в Supabase SQL Editor

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_person BOOLEAN NOT NULL DEFAULT false;

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

-- Завдання, де треба обрати людину
UPDATE tasks SET requires_person = true
WHERE icon IN ('users', 'search', 'heart', 'music')
   OR title ILIKE '%познайом%'
   OR title ILIKE '%хобі%'
   OR title ILIKE '%іменинниц%'
   OR title ILIKE '%танець%'
   OR title ILIKE '%ім''ям%';
