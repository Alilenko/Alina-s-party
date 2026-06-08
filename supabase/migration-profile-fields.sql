-- Поля профілю (запусти в Supabase SQL Editor)

ALTER TABLE participants ADD COLUMN IF NOT EXISTS about_me TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS how_knows_alina TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS favorite_movie TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS favorite_music TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS hobby TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS dream_place TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS secret_question TEXT;

-- Перенести дані зі старих колонок
UPDATE participants SET about_me = interests WHERE about_me IS NULL AND interests IS NOT NULL;
UPDATE participants SET hobby = fun_fact WHERE hobby IS NULL AND fun_fact IS NOT NULL;
