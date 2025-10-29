-- Migration: Add moderation fields to messages table
-- This migration adds fields needed for moderation and analytics

-- Add new columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS connection_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS sentiment VARCHAR(50) DEFAULT 'neutral';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_messages_connection_id ON messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_spam ON messages(is_spam);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment);

-- Update existing records to have default values
UPDATE messages SET 
    is_spam = FALSE,
    is_deleted = FALSE,
    sentiment = 'neutral'
WHERE is_spam IS NULL OR is_deleted IS NULL OR sentiment IS NULL;
