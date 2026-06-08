-- ▶ Запусти в Supabase SQL Editor (доповнення до RUN-THIS-IN-SUPABASE)

-- Завдання: нотатка при виконанні (хобі)
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_note BOOLEAN NOT NULL DEFAULT false;

UPDATE tasks SET requires_note = true, requires_person = true, repeatable = true
WHERE type = 'regular' AND title = 'Знайди людину з таким же хобі';

-- Фото у стрічці
ALTER TABLE feed_events ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Квест: більше ніж 4 питання в раунді
ALTER TABLE secret_quest_guesses DROP CONSTRAINT IF EXISTS secret_quest_guesses_question_index_check;
ALTER TABLE secret_quest_guesses ADD CONSTRAINT secret_quest_guesses_question_index_check
  CHECK (question_index >= 0);

-- Бінго (якщо залишилось)
DELETE FROM task_completions WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');
DELETE FROM task_person_selections WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');
DELETE FROM user_tasks WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');
DELETE FROM tasks WHERE type = 'bingo';
DROP TABLE IF EXISTS bingo_marks;
ALTER TABLE tasks DROP COLUMN IF EXISTS bingo_cell;

-- Slug Аліни Ш.
UPDATE participants SET slug = 'alina-sh' WHERE slug = 'alina-k';

-- Storage (фото профілю та завдань)
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-photos', 'party-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read party photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload party photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow update party photos" ON storage.objects;

CREATE POLICY "Public read party photos" ON storage.objects FOR SELECT USING (bucket_id = 'party-photos');
CREATE POLICY "Allow upload party photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'party-photos');
CREATE POLICY "Allow update party photos" ON storage.objects FOR UPDATE USING (bucket_id = 'party-photos');
