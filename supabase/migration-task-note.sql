-- Поле для введення тексту при виконанні (наприклад, хобі)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_note BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS note TEXT;

UPDATE tasks SET requires_note = true, requires_person = true, repeatable = true
WHERE type = 'regular' AND title = 'Знайди людину з таким же хобі';

UPDATE tasks SET requires_person = false, repeatable = true
WHERE type = 'regular' AND title = 'Скажи тост';
