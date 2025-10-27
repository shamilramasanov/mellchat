-- MellChat Database Schema
-- Based on Questions.md

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS streams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  platform TEXT,
  user_id TEXT NOT NULL,
  username TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  is_question BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_stream_created ON messages (stream_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_question ON messages (is_question);

-- questions (быстрый доступ для UI/фильтров)
CREATE TABLE IF NOT EXISTS questions (
  id BIGSERIAL PRIMARY KEY,
  message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
  stream_id TEXT,
  user_id TEXT,
  snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_questions_stream_created ON questions (stream_id, created_at DESC);

-- bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- ratings (лайки/дизлайки)
CREATE TABLE IF NOT EXISTS ratings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL, -- +1 / -1
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- streams (простая запись)
CREATE TABLE IF NOT EXISTS streams (
  id TEXT PRIMARY KEY,
  title TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  questions_count INTEGER DEFAULT 0
);

-- users (минимум)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  questions_posted INTEGER DEFAULT 0
);

-- Insert some test data
INSERT INTO streams (id, title, started_at) VALUES 
('kick-cavs', 'Cavs Stream', now()),
('twitch-magixxlff', 'MagixxLFF Stream', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, username) VALUES 
('user1', 'testuser1'),
('user2', 'testuser2')
ON CONFLICT (id) DO NOTHING;
