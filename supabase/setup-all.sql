-- =====================================================
-- ALINA'S PARTY — повне налаштування (запусти 1 раз)
-- Supabase → SQL Editor → вставити цей файл → Run
-- =====================================================

-- Таблиці
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  photo_url TEXT,
  about_me TEXT,
  how_knows_alina TEXT,
  favorite_movie TEXT,
  favorite_music TEXT,
  hobby TEXT,
  dream_place TEXT,
  quote TEXT,
  balance INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_birthday_girl BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward INTEGER NOT NULL DEFAULT 100,
  type TEXT NOT NULL DEFAULT 'regular' CHECK (type = 'regular'),
  icon TEXT NOT NULL DEFAULT 'star',
  max_progress INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'pending')),
  progress INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_id, task_id)
);

CREATE TABLE IF NOT EXISTS feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL DEFAULT 'task' CHECK (event_type IN ('task', 'message')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_participant ON user_tasks(participant_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_created ON feed_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_balance ON participants(balance DESC);

-- RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all participants" ON participants;
DROP POLICY IF EXISTS "Allow all tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all user_tasks" ON user_tasks;
DROP POLICY IF EXISTS "Allow all feed_events" ON feed_events;
DROP POLICY IF EXISTS "Allow all guest_messages" ON guest_messages;

CREATE POLICY "Allow all participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all user_tasks" ON user_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all feed_events" ON feed_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all guest_messages" ON guest_messages FOR ALL USING (true) WITH CHECK (true);

-- Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-photos', 'party-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read party photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload party photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow update party photos" ON storage.objects;

CREATE POLICY "Public read party photos" ON storage.objects FOR SELECT USING (bucket_id = 'party-photos');
CREATE POLICY "Allow upload party photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'party-photos');
CREATE POLICY "Allow update party photos" ON storage.objects FOR UPDATE USING (bucket_id = 'party-photos');

-- 10 гостей (унікальні паролі)
INSERT INTO participants (name, slug, password, is_birthday_girl, balance, sort_order, about_me, quote) VALUES
  ('Аліна', 'alina', 'korona26', true, 0, 1, 'Люблю красиві вечори, подорожі та музику', 'Рада бачити кожного з вас!'),
  ('Аліна Ш.', 'alina-sh', 'alinka26', false, 0, 2, NULL, NULL),
  ('Богдан', 'bohdan', 'bohdan26', false, 0, 3, NULL, NULL),
  ('Іра', 'ira', 'ira26', false, 0, 4, NULL, NULL),
  ('Марія', 'maria', 'maria26', false, 0, 5, NULL, NULL),
  ('Олег', 'oleg', 'oleg26', false, 0, 6, NULL, NULL),
  ('Олексій', 'oleksiy', 'oleksiy26', false, 0, 7, NULL, NULL),
  ('Олеся', 'olesya', 'olesya26', false, 0, 8, NULL, NULL),
  ('Руслан', 'ruslan', 'ruslan26', false, 0, 9, NULL, NULL),
  ('Таня', 'tanya', 'tanya26', false, 0, 10, NULL, NULL)
ON CONFLICT (slug) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_birthday_girl = EXCLUDED.is_birthday_girl;

-- Колонки для вибору людини та повторюваних завдань
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_person BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeatable BOOLEAN NOT NULL DEFAULT false;

-- Завдання (тільки якщо таблиця порожня)
INSERT INTO tasks (title, description, reward, type, icon, max_progress, sort_order, requires_person, repeatable)
SELECT * FROM (VALUES
  ('Скажи тост', 'Підніми келих і скажи тост', 100, 'regular', 'wine', 1, 1, true, true),
  ('Зроби спільне фото', 'Сфотографуйся з кожним гостем окремо', 100, 'regular', 'camera', 1, 2, true, true),
  ('Знайди людину з таким же хобі', 'Знайди гостя зі схожим захопленням', 100, 'regular', 'search', 1, 3, true, false),
  ('Розкажи смішну історію', 'Поділись смішною історією з гостями', 100, 'regular', 'message', 1, 4, false, false),
  ('Розкажи історію знайомства', 'Розкажи, як ти познайомилась з Аліною', 100, 'regular', 'heart', 1, 5, false, false)
) AS v(title, description, reward, type, icon, max_progress, sort_order, requires_person, repeatable)
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE type = 'regular' LIMIT 1);
