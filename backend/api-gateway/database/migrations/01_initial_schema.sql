-- =====================================================
-- INITIAL SCHEMA CREATION
-- MellChat Database Schema for clean database
-- =====================================================

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    stream_id VARCHAR(255) NOT NULL,
    connection_id VARCHAR(255),
    username VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    content TEXT,
    platform VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    is_question BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    moderation_reason TEXT,
    sentiment VARCHAR(50) DEFAULT 'neutral',
    message_score INTEGER DEFAULT 50,
    message_classification VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create basic indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_stream_id ON messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_is_question ON messages(is_question);
CREATE INDEX IF NOT EXISTS idx_messages_platform ON messages(platform);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_connection_id ON messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_spam ON messages(is_spam);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(255) PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    stream_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for questions
CREATE INDEX IF NOT EXISTS idx_questions_stream_id ON questions(stream_id);
CREATE INDEX IF NOT EXISTS idx_questions_timestamp ON questions(timestamp);
CREATE INDEX IF NOT EXISTS idx_questions_platform ON questions(platform);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    stream_id VARCHAR(255) NOT NULL,
    last_seen_at TIMESTAMP DEFAULT NOW(),
    session_type VARCHAR(50) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_stream ON user_sessions(user_id, stream_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen ON user_sessions(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_stream_id ON user_sessions(stream_id);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
    id VARCHAR(255) PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    title TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for streams
CREATE INDEX IF NOT EXISTS idx_streams_platform ON streams(platform);
CREATE INDEX IF NOT EXISTS idx_streams_channel_name ON streams(channel_name);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Create function for automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for messages updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for user_sessions updated_at
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for streams updated_at
DROP TRIGGER IF EXISTS update_streams_updated_at ON streams;
CREATE TRIGGER update_streams_updated_at
    BEFORE UPDATE ON streams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for message stats
CREATE OR REPLACE VIEW message_stats AS
SELECT 
    stream_id,
    platform,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_question = true THEN 1 END) as question_count,
    COUNT(DISTINCT username) as unique_users,
    MIN(created_at) as first_message,
    MAX(created_at) as last_message
FROM messages
GROUP BY stream_id, platform;

