-- SkillSwap Database Schema Migration V7
-- Lesson Video Streaming & Hosting Support

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE lesson_modules ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Seed default high-performance sample MP4 video streams for initial catalog
UPDATE lessons
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE id = 'lesson-1' AND (video_url IS NULL OR video_url = '');

UPDATE lessons
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
WHERE id = 'lesson-2' AND (video_url IS NULL OR video_url = '');

UPDATE lessons
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
WHERE id = 'lesson-3' AND (video_url IS NULL OR video_url = '');

UPDATE lessons
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
WHERE id = 'lesson-4' AND (video_url IS NULL OR video_url = '');

-- Fallback for any other lessons without video_url
UPDATE lessons
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE video_url IS NULL OR video_url = '';
