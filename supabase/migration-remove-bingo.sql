-- Прибрати бінго з бази (запусти в Supabase SQL Editor)

-- Видалити прогрес і завдання бінго
DELETE FROM task_completions
WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');

DELETE FROM task_person_selections
WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');

DELETE FROM user_tasks
WHERE task_id IN (SELECT id FROM tasks WHERE type = 'bingo');

DELETE FROM tasks WHERE type = 'bingo';

-- Події бінго залишаємо в стрічці, але як звичайні task
UPDATE feed_events SET event_type = 'task' WHERE event_type = 'bingo';

-- Таблиця відміток бінго
DROP POLICY IF EXISTS "Allow all bingo_marks" ON bingo_marks;
DROP TABLE IF EXISTS bingo_marks;

-- Колонка bingo_cell
ALTER TABLE tasks DROP COLUMN IF EXISTS bingo_cell;

-- Обмеження type: лише regular
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type = 'regular');

-- Обмеження event_type: без bingo
ALTER TABLE feed_events DROP CONSTRAINT IF EXISTS feed_events_event_type_check;
ALTER TABLE feed_events ADD CONSTRAINT feed_events_event_type_check
  CHECK (event_type IN ('task', 'message'));
