-- Migration: Add message scoring and classification fields
-- Date: 2025-11-01
-- Purpose: Support MoodBar analysis and message quality scoring
-- Note: These fields may already exist from other migrations (fix_schema_critical.sql, optimize_data_types.sql)
--       This migration is idempotent (IF NOT EXISTS ensures no errors if fields exist)

-- Add message_score field (0.0 - 100.0, representing message quality)
-- Note: optimize_data_types.sql may change this to SMALLINT (0-100)
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS message_score FLOAT DEFAULT 0.0;

-- Add message_classification field (spam, normal, quality, etc.)
-- Note: optimize_data_types.sql may change this to enum type
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS message_classification VARCHAR(50) DEFAULT 'normal';

-- Add content field if it doesn't exist (alternative text field)
-- Note: fix_schema_critical.sql may already add this
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS content TEXT;

-- Create index for message_classification for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_classification 
  ON messages(message_classification);

-- Create composite index for MoodBar queries (stream_id + sentiment + is_spam)
-- This optimizes queries like "get last 50 messages with sentiment and spam status"
CREATE INDEX IF NOT EXISTS idx_messages_stream_sentiment_spam 
  ON messages(stream_id, sentiment, is_spam) 
  WHERE is_deleted = false;

-- Add comments for documentation
COMMENT ON COLUMN messages.message_score IS 'Оценка качества сообщения (0.0 - 100.0, выше = лучше)';
COMMENT ON COLUMN messages.message_classification IS 'Классификация сообщения: spam, normal, quality';
COMMENT ON COLUMN messages.content IS 'Альтернативное поле для текста сообщения (для совместимости)';

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: message scoring fields added';
  RAISE NOTICE 'Added columns: message_score, message_classification, content';
  RAISE NOTICE 'Added indexes: idx_messages_classification, idx_messages_stream_sentiment_spam';
END $$;

