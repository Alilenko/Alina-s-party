-- Фіксований порядок гостей (алфавіт) + оновлення імені Аліна Ш.
ALTER TABLE participants ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE participants SET name = 'Аліна Ш.', slug = 'alina-sh', sort_order = 2 WHERE slug IN ('alina-k', 'alina-sh');
UPDATE participants SET sort_order = 1, name = 'Аліна' WHERE slug = 'alina';
UPDATE participants SET sort_order = 3 WHERE slug = 'bohdan';
UPDATE participants SET sort_order = 4 WHERE slug = 'ira';
UPDATE participants SET sort_order = 5 WHERE slug = 'maria';
UPDATE participants SET sort_order = 6 WHERE slug = 'oleg';
UPDATE participants SET sort_order = 7 WHERE slug = 'oleksiy';
UPDATE participants SET sort_order = 8 WHERE slug = 'olesya';
UPDATE participants SET sort_order = 9 WHERE slug = 'ruslan';
UPDATE participants SET sort_order = 10 WHERE slug = 'tanya';
