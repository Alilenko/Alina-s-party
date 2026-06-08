-- Алфавітний порядок гостей у sort_order
-- Запусти в Supabase SQL Editor

ALTER TABLE participants ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE participants SET sort_order = 1 WHERE slug = 'alina';
UPDATE participants SET sort_order = 2, name = 'Аліна Ш.' WHERE slug IN ('alina-sh', 'alina-k');
UPDATE participants SET sort_order = 3 WHERE slug = 'bohdan';
UPDATE participants SET sort_order = 4 WHERE slug = 'ira';
UPDATE participants SET sort_order = 5 WHERE slug = 'maria';
UPDATE participants SET sort_order = 6 WHERE slug = 'oleg';
UPDATE participants SET sort_order = 7 WHERE slug = 'oleksiy';
UPDATE participants SET sort_order = 8 WHERE slug = 'olesya';
UPDATE participants SET sort_order = 9 WHERE slug = 'ruslan';
UPDATE participants SET sort_order = 10 WHERE slug = 'tanya';
