-- Migration: Add user_sessions table for adaptive message loading
-- Run this script to add the new table to existing database

-- Add user_sessions table
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

-- Add comment for documentation
COMMENT ON TABLE user_sessions IS 'Tracks user sessions and last seen time for adaptive message loading strategies';
COMMENT ON COLUMN user_sessions.session_type IS 'Type of session: normal, clean_start, archive';
COMMENT ON COLUMN user_sessions.last_seen_at IS 'Last time user was active in this stream';
