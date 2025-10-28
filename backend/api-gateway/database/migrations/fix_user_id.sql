-- Remove user_id column from messages table if it exists
-- This column doesn't exist in the main schema and causes errors

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE messages DROP COLUMN user_id;
        RAISE NOTICE 'Column user_id removed from messages table';
    ELSE
        RAISE NOTICE 'Column user_id does not exist in messages table';
    END IF;
END $$;

