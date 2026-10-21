-- SkillSwap Database Schema Migration V4
-- Module Assessments, Question Bank, Attempt Tracking, and Integrity Events

-- 1. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit_minutes INT DEFAULT 10,
    passing_score_percent INT DEFAULT 70,
    max_attempts INT DEFAULT 3,
    cooldown_minutes INT DEFAULT 0,
    is_external_google_form BOOLEAN DEFAULT FALSE,
    google_form_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_module ON assessments(module_id);
CREATE INDEX IF NOT EXISTS idx_assessment_lesson ON assessments(lesson_id);

-- 2. Assessment Questions Table
CREATE TABLE IF NOT EXISTS assessment_questions (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL, -- multiple_choice, multiple_answer, true_false, short_answer
    options_json TEXT, -- JSON array of string options
    correct_answers_json TEXT NOT NULL, -- JSON array of correct answer strings
    explanation TEXT,
    topic VARCHAR(100),
    points INT DEFAULT 25,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_assessment ON assessment_questions(assessment_id);

-- 3. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, SUBMITTED, EVALUATED
    answers_json TEXT, -- JSON object of questionId -> answer
    score INT DEFAULT 0,
    total_points INT DEFAULT 100,
    percentage INT DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    topics_to_revise_json TEXT,
    weakest_topic VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    time_taken_seconds INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_attempt_user ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_assessment ON assessment_attempts(assessment_id);

-- 4. Integrity Events Table (Transparent Technical Focus Tracker)
CREATE TABLE IF NOT EXISTS integrity_events (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- tab_switch, focus_loss, fullscreen_exit, network_loss, inactivity, returned_focus
    description VARCHAR(255) NOT NULL,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrity_attempt ON integrity_events(attempt_id);
