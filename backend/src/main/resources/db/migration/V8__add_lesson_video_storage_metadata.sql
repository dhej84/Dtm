-- SkillSwap Database Schema Migration V8
-- Lesson Video Storage & Metadata Model

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_filename VARCHAR(255);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_duration VARCHAR(50);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_file_size BIGINT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_mime_type VARCHAR(100);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_storage_key VARCHAR(255);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS lesson_videos (
    id VARCHAR(64) PRIMARY KEY,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    duration VARCHAR(50),
    storage_key VARCHAR(255) NOT NULL,
    storage_url TEXT NOT NULL,
    uploaded_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson ON lesson_videos(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_storage_key ON lesson_videos(storage_key);
