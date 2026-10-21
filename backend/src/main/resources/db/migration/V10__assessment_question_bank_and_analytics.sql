-- SkillSwap Database Schema Migration V10
-- Advanced Lesson Assessment Management, Configurable Question Bank & Performance Analytics

-- 1. Assessment Configurations (per lesson assessment parameters)
CREATE TABLE IF NOT EXISTS assessment_configurations (
    id VARCHAR(64) PRIMARY KEY,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question_count INT NOT NULL DEFAULT 15,
    total_marks INT NOT NULL DEFAULT 50,
    passing_percentage INT NOT NULL DEFAULT 70,
    max_attempts INT NOT NULL DEFAULT 3,
    overall_time_limit_minutes INT NOT NULL DEFAULT 45,
    coding_time_limit_minutes INT NOT NULL DEFAULT 15,
    randomize_questions BOOLEAN NOT NULL DEFAULT TRUE,
    randomize_options BOOLEAN NOT NULL DEFAULT TRUE,
    easy_percent INT NOT NULL DEFAULT 35,
    medium_percent INT NOT NULL DEFAULT 45,
    hard_percent INT NOT NULL DEFAULT 20,
    topic_distribution_json TEXT, -- JSON mapping topic names to target percentage or count
    show_explanations_after_submission BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_configurations_lesson ON assessment_configurations(lesson_id);

-- 2. Extend Assessment Questions with archiving and tags
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS tags_json TEXT;

-- 3. Question Performance Analytics Table
CREATE TABLE IF NOT EXISTS question_analytics (
    id VARCHAR(64) PRIMARY KEY,
    question_id VARCHAR(64) NOT NULL,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    attempts_count INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    avg_marks NUMERIC(5,2) DEFAULT 0,
    difficulty VARCHAR(20) DEFAULT 'medium',
    topic VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_analytics_lesson ON question_analytics(lesson_id);
CREATE INDEX IF NOT EXISTS idx_question_analytics_question ON question_analytics(question_id);

-- 4. Topic Performance & Learning Gap Analytics Table
CREATE TABLE IF NOT EXISTS topic_analytics (
    id VARCHAR(64) PRIMARY KEY,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    attempts_count INT NOT NULL DEFAULT 0,
    avg_percentage NUMERIC(5,2) DEFAULT 0,
    learning_gap_flag BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topic_analytics_lesson ON topic_analytics(lesson_id);

-- 5. Lesson Assessment Aggregate Analytics Overview
CREATE TABLE IF NOT EXISTS lesson_assessment_analytics (
    id VARCHAR(64) PRIMARY KEY,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    students_attempted INT NOT NULL DEFAULT 0,
    students_completed INT NOT NULL DEFAULT 0,
    avg_score_percent NUMERIC(5,2) DEFAULT 0,
    pass_rate_percent NUMERIC(5,2) DEFAULT 0,
    avg_completion_time_seconds INT DEFAULT 0,
    avg_attempts_per_student NUMERIC(5,2) DEFAULT 1.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lesson_assessment_analytics_lesson ON lesson_assessment_analytics(lesson_id);
