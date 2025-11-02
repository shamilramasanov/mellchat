-- Migration: Add fingerprint to guest_sessions
-- Description: Добавление поля для хранения browser fingerprint для идентификации пользователей в инкогнито
-- Date: 2025-11-02

-- Проверяем существование таблицы перед добавлением колонки
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'guest_sessions') THEN
        -- Добавляем поле fingerprint
        ALTER TABLE guest_sessions 
        ADD COLUMN IF NOT EXISTS fingerprint TEXT;
        
        -- Создаем индекс для быстрого поиска по fingerprint
        CREATE INDEX IF NOT EXISTS idx_guest_sessions_fingerprint ON guest_sessions(fingerprint);
        
        -- Комментарий
        COMMENT ON COLUMN guest_sessions.fingerprint IS 'Browser fingerprint для идентификации одного пользователя в инкогнито';
    ELSE
        RAISE NOTICE 'Table guest_sessions does not exist, skipping migration';
    END IF;
END $$;

