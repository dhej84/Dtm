-- SkillSwap PostgreSQL Database Schema Migration V1
-- Comprehensive Tables for Peer-to-Peer Learning Platform

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    university VARCHAR(150) NOT NULL,
    department VARCHAR(150),
    year VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'ROLE_STUDENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    location VARCHAR(150),
    rank VARCHAR(100) DEFAULT 'Campus Member',
    member_since VARCHAR(50) DEFAULT 'Sep 2024',
    profile_visibility VARCHAR(50) DEFAULT 'PUBLIC',
    wallet_balance NUMERIC(10, 2) DEFAULT 10.00,
    hours_taught NUMERIC(10, 2) DEFAULT 0.00,
    hours_learned NUMERIC(10, 2) DEFAULT 0.00,
    peer_reputation NUMERIC(3, 2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    swap_fulfill_rate NUMERIC(5, 2) DEFAULT 100.00,
    verified_peers_only BOOLEAN DEFAULT TRUE,
    allow_direct_swaps BOOLEAN DEFAULT TRUE,
    public_learning_history BOOLEAN DEFAULT TRUE,
    mask_reviews BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Skills Catalog
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    popular_level VARCHAR(50) DEFAULT 'Intermediate',
    popularity INT DEFAULT 0,
    students_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- 4. User Skills (Teaching vs Learning & Levels)
CREATE TABLE IF NOT EXISTS user_skills (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id VARCHAR(36) REFERENCES skills(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    skill_type VARCHAR(20) NOT NULL, -- 'TEACH' or 'LEARN'
    skill_level VARCHAR(50) NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced', 'Mastery'
    target_level VARCHAR(50),
    proficiency_percent INT DEFAULT 0,
    hours_logged NUMERIC(10, 2) DEFAULT 0.00,
    hours_taught NUMERIC(10, 2) DEFAULT 0.00,
    hours_practiced NUMERIC(10, 2) DEFAULT 0.00,
    endorsements_count INT DEFAULT 0,
    reviews_count INT DEFAULT 0,
    partner_name VARCHAR(150),
    target_date VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_skill UNIQUE (user_id, name, skill_type)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_type ON user_skills(user_id, skill_type);
CREATE INDEX IF NOT EXISTS idx_user_skills_name ON user_skills(name);

-- 5. Lessons
CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    skill VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    skill_level VARCHAR(50) NOT NULL,
    format VARCHAR(50) NOT NULL DEFAULT 'Interactive Workshop',
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration_minutes INT DEFAULT 60,
    credits_required NUMERIC(5, 2) DEFAULT 1.00,
    prerequisites TEXT,
    enrolled_students_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lessons_skill ON lessons(skill);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(skill_level);

-- 6. Lesson Modules
CREATE TABLE IF NOT EXISTS lesson_modules (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(50),
    sequence_order INT NOT NULL DEFAULT 0,
    description TEXT,
    content_snippet TEXT
);

CREATE INDEX IF NOT EXISTS idx_modules_lesson ON lesson_modules(lesson_id);

-- 7. Lesson Resources
CREATE TABLE IF NOT EXISTS lesson_resources (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(50),
    resource_type VARCHAR(50),
    url TEXT
);

CREATE INDEX IF NOT EXISTS idx_resources_lesson ON lesson_resources(lesson_id);

-- 8. Lesson Progress
CREATE TABLE IF NOT EXISTS lesson_progress (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    progress_percent INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    user_notes TEXT,
    current_step_index INT DEFAULT 0,
    completed_module_ids TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lesson_user_progress UNIQUE (lesson_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id);

-- 9. Comments
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    author_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    likes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);

-- 10. Comment Likes
CREATE TABLE IF NOT EXISTS comment_likes (
    id VARCHAR(36) PRIMARY KEY,
    comment_id VARCHAR(36) NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_comment_user_like UNIQUE (comment_id, user_id)
);

-- 11. Connections
CREATE TABLE IF NOT EXISTS connections (
    id VARCHAR(36) PRIMARY KEY,
    from_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teach_skill VARCHAR(150),
    learn_skill VARCHAR(150),
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_connection_pair UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_conn_from_user ON connections(from_user_id);
CREATE INDEX IF NOT EXISTS idx_conn_to_user ON connections(to_user_id);

-- 12. Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    icon_bg_color VARCHAR(100),
    progress_text VARCHAR(50),
    fill_percent INT DEFAULT 100,
    level_badge VARCHAR(100)
);

-- 13. User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(36) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    endorsements_count INT DEFAULT 0,
    issued_date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

-- 14. Learning Milestones (Journey)
CREATE TABLE IF NOT EXISTS learning_milestones (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_ago VARCHAR(100),
    date_str VARCHAR(100),
    milestone_type VARCHAR(50),
    credits_change NUMERIC(5, 2) DEFAULT 0.00,
    badge_triggered VARCHAR(100),
    partner_name VARCHAR(150),
    term VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestones_user ON learning_milestones(user_id);

-- 15. Peer Reviews
CREATE TABLE IF NOT EXISTS peer_reviews (
    id VARCHAR(36) PRIMARY KEY,
    target_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    rating NUMERIC(2, 1) NOT NULL,
    comment TEXT,
    topic VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_target_user ON peer_reviews(target_user_id);

-- 16. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
