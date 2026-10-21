-- SkillSwap Database Schema Migration V9
-- Comprehensive Lesson-Room Assessment Schema, Question Bank, Answer Store & Integrity Audit

-- 1. Assessments Table Extension / Direct Table
CREATE TABLE IF NOT EXISTS assessments (
    id VARCHAR(64) PRIMARY KEY,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score_percent INT NOT NULL DEFAULT 70,
    time_limit_minutes INT NOT NULL DEFAULT 45,
    coding_time_limit_minutes INT NOT NULL DEFAULT 15,
    max_attempts INT NOT NULL DEFAULT 5,
    min_questions_count INT NOT NULL DEFAULT 15,
    evaluation_type VARCHAR(50) DEFAULT 'hybrid', -- auto, manual_review, hybrid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_lesson_v9 ON assessments(lesson_id);

-- 2. Assessment Questions Bank
CREATE TABLE IF NOT EXISTS assessment_questions (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- multiple_choice, multiple_answer, true_false, coding, long_answer
    topic VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    marks INT NOT NULL DEFAULT 10,
    time_limit_seconds INT NOT NULL DEFAULT 90, -- 60-120s for MCQ, 900s for coding, 300s for long answer
    options_json TEXT, -- JSON array of option strings for MCQs
    correct_answers_json TEXT, -- JSON array of correct answer strings (never exposed to client before submit)
    explanation TEXT,
    coding_language VARCHAR(50), -- python, javascript, java, sql
    starter_code TEXT,
    constraints TEXT,
    test_cases_json TEXT, -- JSON array of { input, expectedOutput, isSample }
    rubric_guidelines TEXT,
    evaluation_type VARCHAR(50) DEFAULT 'auto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assess_v9 ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_lesson_v9 ON assessment_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_type_v9 ON assessment_questions(question_type);

-- 3. Student Assessment Attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- NOT_ATTEMPTED, IN_PROGRESS, SUBMITTED, EVALUATED
    selected_question_ids TEXT NOT NULL, -- JSON array of question IDs in this attempt
    answers_json TEXT, -- JSON dictionary of student submitted answers { questionId: answer }
    score INT NOT NULL DEFAULT 0,
    total_points INT NOT NULL DEFAULT 0,
    percentage INT NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    unanswered_count INT NOT NULL DEFAULT 0,
    coding_marks INT DEFAULT 0,
    long_answer_marks INT DEFAULT 0,
    pending_review_count INT DEFAULT 0,
    is_pending_evaluation BOOLEAN DEFAULT FALSE,
    warnings_count INT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT DEFAULT 0,
    feedback TEXT,
    topics_to_revise TEXT -- JSON array of topic strings
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_v9 ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_lesson_v9 ON assessment_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status_v9 ON assessment_attempts(status);

-- 4. Student Question Answers Detail
CREATE TABLE IF NOT EXISTS assessment_answers (
    id VARCHAR(64) PRIMARY KEY,
    attempt_id VARCHAR(64) NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL,
    answer_text TEXT,
    marks_awarded INT DEFAULT 0,
    evaluation_status VARCHAR(50) DEFAULT 'auto_evaluated', -- auto_evaluated, pending_review, verified
    evaluation_feedback TEXT,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt_v9 ON assessment_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question_v9 ON assessment_answers(question_id);

-- 5. Assessment Integrity & Browser Visibility Events Audit
CREATE TABLE IF NOT EXISTS assessment_events (
    id VARCHAR(64) PRIMARY KEY,
    attempt_id VARCHAR(64) NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- tab_switch, focus_loss, fullscreen_exit, returned_focus, page_reload, timer_expired
    description TEXT NOT NULL,
    duration_seconds INT DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_events_attempt_v9 ON assessment_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_events_type_v9 ON assessment_events(event_type);
