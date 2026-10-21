-- SkillSwap Database Schema Migration V5
-- Integrated Lesson Assessments, Dynamic Question Bank, Student Answers & Monitoring Events

-- 1. Lesson-Level Assessment Table
CREATE TABLE IF NOT EXISTS assessment (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score_percent INT DEFAULT 70,
    overall_time_limit_minutes INT DEFAULT 45,
    coding_time_limit_minutes INT DEFAULT 15,
    min_questions_count INT DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_lesson_v5 ON assessment(lesson_id);

-- 2. Question Bank Table
CREATE TABLE IF NOT EXISTS question (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL REFERENCES assessment(id) ON DELETE CASCADE,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL, -- multiple_choice, multiple_select, true_false, coding, long_answer
    topic VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    points INT DEFAULT 10,
    time_limit_seconds INT DEFAULT 90, -- default timer per question (coding has 900s = 15m)
    explanation TEXT,
    correct_answers_json TEXT NOT NULL, -- JSON array of correct strings/values
    starter_code TEXT,
    constraints TEXT,
    test_cases_json TEXT, -- JSON array of test cases
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_assessment_v5 ON question(assessment_id);
CREATE INDEX IF NOT EXISTS idx_question_lesson_v5 ON question(lesson_id);

-- 3. Question Option Table
CREATE TABLE IF NOT EXISTS question_option (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_option_question_v5 ON question_option(question_id);

-- 4. Assessment Attempt Table
CREATE TABLE IF NOT EXISTS assessment_attempt (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL REFERENCES assessment(id) ON DELETE CASCADE,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- NOT_ATTEMPTED, IN_PROGRESS, SUBMITTED, EVALUATED
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    time_taken_seconds INT DEFAULT 0,
    score INT DEFAULT 0,
    total_points INT DEFAULT 100,
    percentage INT DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempt_user_v5 ON assessment_attempt(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_lesson_v5 ON assessment_attempt(lesson_id);

-- 5. Attempt Questions Table (stores selected dynamic question IDs for the attempt)
CREATE TABLE IF NOT EXISTS attempt_question (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL REFERENCES assessment_attempt(id) ON DELETE CASCADE,
    question_id VARCHAR(36) NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    question_order INT NOT NULL,
    is_marked_for_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempt_q_attempt ON attempt_question(attempt_id);

-- 6. Student Answer Table
CREATE TABLE IF NOT EXISTS student_answer (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL REFERENCES assessment_attempt(id) ON DELETE CASCADE,
    question_id VARCHAR(36) NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    submitted_answer TEXT, -- Selected option, code, or written response
    is_correct BOOLEAN,
    points_awarded INT DEFAULT 0,
    feedback TEXT,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_ans_attempt ON student_answer(attempt_id);

-- 7. Assessment Result Table
CREATE TABLE IF NOT EXISTS assessment_result (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) UNIQUE NOT NULL REFERENCES assessment_attempt(id) ON DELETE CASCADE,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL,
    total_points INT NOT NULL,
    percentage INT NOT NULL,
    correct_count INT NOT NULL,
    incorrect_count INT NOT NULL,
    unanswered_count INT NOT NULL,
    passed BOOLEAN NOT NULL,
    completion_unlocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_result_user_lesson ON assessment_result(user_id, lesson_id);

-- 8. Assessment Monitoring Event Table (Transparent Browser Integrity Logging)
CREATE TABLE IF NOT EXISTS assessment_monitoring_event (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL REFERENCES assessment_attempt(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- tab_switch, fullscreen_exit, page_reload, timer_expired, focus_lost
    description VARCHAR(255) NOT NULL,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monitoring_attempt ON assessment_monitoring_event(attempt_id);
