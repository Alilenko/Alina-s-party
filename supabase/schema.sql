-- Alina's Party — Supabase Schema
-- Запустіть цей файл у Supabase SQL Editor

-- Учасники вечірки
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'party2026',
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

-- Завдання
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

-- Прогрес учасників по завданнях
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

-- Стрічка подій (вечірка)
CREATE TABLE IF NOT EXISTS feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL DEFAULT 'task' CHECK (event_type IN ('task', 'message')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Повідомлення гостей
CREATE TABLE IF NOT EXISTS guest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Індекси
CREATE INDEX IF NOT EXISTS idx_user_tasks_participant ON user_tasks(participant_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_created ON feed_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_balance ON participants(balance DESC);

-- RLS (відкритий доступ для приватної вечірки — захист через логін на фронті)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all user_tasks" ON user_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all feed_events" ON feed_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all guest_messages" ON guest_messages FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE feed_events;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE guest_messages;
