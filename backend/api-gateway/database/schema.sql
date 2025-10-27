-- MellChat Database Schema
-- PostgreSQL database setup for MellChat

-- Create database (run this manually if needed)
-- CREATE DATABASE mellchat;

-- Connect to mellchat database and create tables

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    stream_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    is_question BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_stream_id ON messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_is_question ON messages(is_question);
CREATE INDEX IF NOT EXISTS idx_messages_platform ON messages(platform);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Questions table (optional - for better question tracking)
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(255) PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL REFERENCES messages(id),
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

-- User sessions table (for tracking last seen time)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    stream_id VARCHAR(255) NOT NULL,
    last_seen_at TIMESTAMP DEFAULT NOW(),
    session_type VARCHAR(50) DEFAULT 'normal', -- 'normal', 'clean_start', 'archive'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_stream ON user_sessions(user_id, stream_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen ON user_sessions(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_stream_id ON user_sessions(stream_id);

-- Streams table (optional - for stream metadata)
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

-- Users table (optional - for user tracking)
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

-- Insert some sample data for testing
INSERT INTO messages (id, stream_id, username, text, platform, timestamp, is_question) VALUES
('test-1', 'twitch-dyrachyo', 'testuser1', 'Hello everyone!', 'twitch', 1640995200000, false),
('test-2', 'twitch-dyrachyo', 'testuser2', 'How are you doing?', 'twitch', 1640995201000, true),
('test-3', 'twitch-dyrachyo', 'testuser3', 'Great stream!', 'twitch', 1640995202000, false),
('test-4', 'youtube-test', 'testuser4', 'What is your favorite game?', 'youtube', 1640995203000, true),
('test-5', 'kick-test', 'testuser5', 'Nice content!', 'kick', 1640995204000, false)
ON CONFLICT (id) DO NOTHING;

-- Create a view for easy message querying
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

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mellchat;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mellchat;
