-- Фото у стрічці подій
ALTER TABLE feed_events ADD COLUMN IF NOT EXISTS photo_url TEXT;
