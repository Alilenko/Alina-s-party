-- Очистити старі поля профілю (interests, fun_fact)
-- Запусти в Supabase SQL Editor, якщо десь лишився тестовий текст

-- Спочатку перенести в нові колонки, якщо ще не перенесено
UPDATE participants SET about_me = interests WHERE about_me IS NULL AND interests IS NOT NULL;
UPDATE participants SET hobby = fun_fact WHERE hobby IS NULL AND fun_fact IS NOT NULL;

-- Потім очистити старі колонки у всіх гостей
UPDATE participants SET interests = NULL WHERE interests IS NOT NULL;
UPDATE participants SET fun_fact = NULL WHERE fun_fact IS NOT NULL;
