-- SkillSwap Database Schema Migration V3
-- Mentor <-> Learner Messaging, Delivery Status, and Moderation

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    participant1_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active_lesson_id VARCHAR(36) REFERENCES lessons(id) ON DELETE SET NULL,
    referenced_module_id VARCHAR(50),
    last_message_content VARCHAR(1000),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unread_count_user1 INT DEFAULT 0,
    unread_count_user2 INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conv_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conv_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conv_last_message ON conversations(last_message_at);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT', -- SENDING, SENT, DELIVERED, READ
    referenced_lesson_id VARCHAR(36) REFERENCES lessons(id) ON DELETE SET NULL,
    referenced_module_id VARCHAR(50),
    detected_language VARCHAR(50) DEFAULT 'English',
    detected_intent VARCHAR(50) DEFAULT 'general',
    english_translation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_msg_conv_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_msg_status ON messages(status);

-- 3. Blocked Users Table
CREATE TABLE IF NOT EXISTS blocked_users (
    id VARCHAR(36) PRIMARY KEY,
    blocker_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_blocker_blocked UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);

-- 4. Message Reports Table
CREATE TABLE IF NOT EXISTS message_reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id VARCHAR(36) REFERENCES conversations(id) ON DELETE SET NULL,
    message_id VARCHAR(36) REFERENCES messages(id) ON DELETE SET NULL,
    reason VARCHAR(255) NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
