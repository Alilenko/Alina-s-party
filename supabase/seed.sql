-- Оновлення паролів, імені та порядку (алфавіт)
UPDATE participants SET name = 'Аліна Ш.', slug = 'alina-sh', password = 'alinka26', sort_order = 2 WHERE slug IN ('alina-k', 'alina-sh');
UPDATE participants SET password = 'korona26', sort_order = 1 WHERE slug = 'alina';
UPDATE participants SET password = 'bohdan26', sort_order = 3 WHERE slug = 'bohdan';
UPDATE participants SET password = 'ira26', sort_order = 4 WHERE slug = 'ira';
UPDATE participants SET password = 'maria26', sort_order = 5 WHERE slug = 'maria';
UPDATE participants SET password = 'oleg26', sort_order = 6 WHERE slug = 'oleg';
UPDATE participants SET password = 'oleksiy26', sort_order = 7 WHERE slug = 'oleksiy';
UPDATE participants SET password = 'olesya26', sort_order = 8 WHERE slug = 'olesya';
UPDATE participants SET password = 'ruslan26', sort_order = 9 WHERE slug = 'ruslan';
UPDATE participants SET password = 'tanya26', sort_order = 10 WHERE slug = 'tanya';
