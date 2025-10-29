-- =====================================================
-- ОПТИМИЗАЦИЯ ТИПОВ ДАННЫХ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- 1. Оптимизация таблицы messages
-- =====================================================

-- Изменяем тип поля id на UUID (если используется UUID)
-- ALTER TABLE messages ALTER COLUMN id TYPE UUID USING id::UUID;

-- Оптимизируем поле stream_id (если это строка фиксированной длины)
-- ALTER TABLE messages ALTER COLUMN stream_id TYPE VARCHAR(50);

-- Оптимизируем поле username (ограничиваем длину)
ALTER TABLE messages ALTER COLUMN username TYPE VARCHAR(100);

-- Оптимизируем поле platform (enum вместо VARCHAR)
-- Создаем enum тип для платформ
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_enum') THEN
        CREATE TYPE platform_enum AS ENUM ('twitch', 'youtube', 'kick');
    END IF;
END $$;

-- Изменяем тип поля platform на enum
ALTER TABLE messages ALTER COLUMN platform TYPE platform_enum USING platform::platform_enum;

-- Оптимизируем поле text/content (TEXT остается, но добавляем ограничение)
ALTER TABLE messages ADD CONSTRAINT chk_text_length CHECK (LENGTH(COALESCE(content, text)) <= 1000);

-- Оптимизируем поле sentiment (enum вместо VARCHAR)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentiment_enum') THEN
        CREATE TYPE sentiment_enum AS ENUM ('happy', 'neutral', 'sad');
    END IF;
END $$;

ALTER TABLE messages ALTER COLUMN sentiment TYPE sentiment_enum USING sentiment::sentiment_enum;

-- Оптимизируем поле message_classification (enum вместо VARCHAR)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'classification_enum') THEN
        CREATE TYPE classification_enum AS ENUM ('spam', 'low_quality', 'normal', 'high_quality');
    END IF;
END $$;

ALTER TABLE messages ALTER COLUMN message_classification TYPE classification_enum USING message_classification::classification_enum;

-- Оптимизируем поле message_score (SMALLINT вместо INTEGER)
ALTER TABLE messages ALTER COLUMN message_score TYPE SMALLINT;

-- Добавляем ограничения для message_score
ALTER TABLE messages ADD CONSTRAINT chk_message_score CHECK (message_score >= 0 AND message_score <= 100);

-- 2. Оптимизация таблицы questions
-- =====================================================

-- Оптимизируем поле username
ALTER TABLE questions ALTER COLUMN username TYPE VARCHAR(100);

-- Оптимизируем поле platform
ALTER TABLE questions ALTER COLUMN platform TYPE platform_enum USING platform::platform_enum;

-- Оптимизируем поле text
ALTER TABLE questions ADD CONSTRAINT chk_question_text_length CHECK (LENGTH(text) <= 1000);

-- 3. Оптимизация таблицы users
-- =====================================================

-- Оптимизируем поле username
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(100);

-- Оптимизируем поле platform
ALTER TABLE users ALTER COLUMN platform TYPE platform_enum USING platform::platform_enum;

-- Оптимизируем поля счетчиков (SMALLINT вместо INTEGER)
ALTER TABLE users ALTER COLUMN message_count TYPE SMALLINT;
ALTER TABLE users ALTER COLUMN question_count TYPE SMALLINT;

-- Добавляем ограничения для счетчиков
ALTER TABLE users ADD CONSTRAINT chk_message_count CHECK (message_count >= 0);
ALTER TABLE users ADD CONSTRAINT chk_question_count CHECK (question_count >= 0);

-- 4. Оптимизация таблицы streams
-- =====================================================

-- Оптимизируем поле platform
ALTER TABLE streams ALTER COLUMN platform TYPE platform_enum USING platform::platform_enum;

-- Оптимизируем поле channel_name
ALTER TABLE streams ALTER COLUMN channel_name TYPE VARCHAR(100);

-- Оптимизируем поле title
ALTER TABLE streams ALTER COLUMN title TYPE VARCHAR(200);

-- Оптимизируем поле status (enum вместо VARCHAR)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stream_status_enum') THEN
        CREATE TYPE stream_status_enum AS ENUM ('active', 'inactive', 'ended', 'error');
    END IF;
END $$;

ALTER TABLE streams ALTER COLUMN status TYPE stream_status_enum USING status::stream_status_enum;

-- 5. Оптимизация таблицы user_sessions
-- =====================================================

-- Оптимизируем поле user_id (если это строка)
ALTER TABLE user_sessions ALTER COLUMN user_id TYPE VARCHAR(100);

-- Оптимизируем поле stream_id
ALTER TABLE user_sessions ALTER COLUMN stream_id TYPE VARCHAR(50);

-- Оптимизируем поле session_type (enum вместо VARCHAR)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type_enum') THEN
        CREATE TYPE session_type_enum AS ENUM ('active', 'inactive', 'disconnected');
    END IF;
END $$;

ALTER TABLE user_sessions ALTER COLUMN session_type TYPE session_type_enum USING session_type::session_type_enum;

-- 6. Добавление ограничений для целостности данных
-- =====================================================

-- Ограничения для messages
ALTER TABLE messages ADD CONSTRAINT chk_created_at_not_future CHECK (created_at <= NOW());
ALTER TABLE messages ADD CONSTRAINT chk_message_score_range CHECK (message_score >= 0 AND message_score <= 100);

-- Ограничения для questions
ALTER TABLE questions ADD CONSTRAINT chk_question_created_at_not_future CHECK (created_at <= NOW());

-- Ограничения для users
ALTER TABLE users ADD CONSTRAINT chk_first_seen_not_future CHECK (first_seen <= NOW());
ALTER TABLE users ADD CONSTRAINT chk_last_seen_not_future CHECK (last_seen <= NOW());
ALTER TABLE users ADD CONSTRAINT chk_last_seen_after_first CHECK (last_seen >= first_seen);

-- Ограничения для streams
ALTER TABLE streams ADD CONSTRAINT chk_stream_created_at_not_future CHECK (created_at <= NOW());
ALTER TABLE streams ADD CONSTRAINT chk_stream_updated_at_not_future CHECK (updated_at <= NOW());
ALTER TABLE streams ADD CONSTRAINT chk_updated_after_created CHECK (updated_at >= created_at);

-- Ограничения для user_sessions
ALTER TABLE user_sessions ADD CONSTRAINT chk_session_created_at_not_future CHECK (created_at <= NOW());
ALTER TABLE user_sessions ADD CONSTRAINT chk_session_updated_at_not_future CHECK (updated_at <= NOW());
ALTER TABLE user_sessions ADD CONSTRAINT chk_session_updated_after_created CHECK (updated_at >= created_at);
ALTER TABLE user_sessions ADD CONSTRAINT chk_last_seen_not_future CHECK (last_seen_at <= NOW());

-- 7. Создание индексов для новых ограничений
-- =====================================================

-- Индекс для проверки целостности временных данных
CREATE INDEX IF NOT EXISTS idx_messages_created_at_check ON messages(created_at) WHERE created_at > NOW();

-- Индекс для проверки целостности пользователей
CREATE INDEX IF NOT EXISTS idx_users_last_seen_check ON users(last_seen) WHERE last_seen > NOW();

-- 8. Оптимизация размеров полей для экономии места
-- =====================================================

-- Сжимаем большие текстовые поля
ALTER TABLE messages SET (toast_tuple_target = 128);
ALTER TABLE questions SET (toast_tuple_target = 128);

-- Настраиваем fillfactor для часто обновляемых таблиц
ALTER TABLE messages SET (fillfactor = 90);
ALTER TABLE user_sessions SET (fillfactor = 85);

-- 9. Создание статистики для оптимизатора
-- =====================================================

-- Обновляем статистику для всех таблиц
ANALYZE messages;
ANALYZE questions;
ANALYZE users;
ANALYZE streams;
ANALYZE user_sessions;

-- 10. Проверка размеров таблиц после оптимизации
-- =====================================================

-- Функция для анализа размеров таблиц
CREATE OR REPLACE FUNCTION analyze_table_sizes()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    total_size TEXT,
    index_size TEXT,
    table_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Выводим статистику размеров таблиц
SELECT * FROM analyze_table_sizes();

-- 11. Создание функции для мониторинга производительности
-- =====================================================

-- Функция для анализа медленных запросов
CREATE OR REPLACE FUNCTION analyze_slow_queries()
RETURNS TABLE(
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    max_time DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time
    FROM pg_stat_statements 
    WHERE mean_time > 1000  -- Запросы дольше 1 секунды
    ORDER BY mean_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ФИНАЛЬНАЯ ПРОВЕРКА
-- =====================================================

-- Проверяем, что все изменения применились корректно
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('messages', 'questions', 'users', 'streams', 'user_sessions')
ORDER BY table_name, ordinal_position;
