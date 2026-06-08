-- Створення bucket для фото
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-photos', 'party-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Політики для storage (безпечно запускати повторно)
DROP POLICY IF EXISTS "Public read party photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload party photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow update party photos" ON storage.objects;

CREATE POLICY "Public read party photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'party-photos');

CREATE POLICY "Allow upload party photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'party-photos');

CREATE POLICY "Allow update party photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'party-photos');
