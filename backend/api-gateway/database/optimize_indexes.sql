-- Оптимизированные индексы для высокой производительности
-- Выполнять по одному для избежания блокировок

-- 1. Основной индекс для быстрого поиска сообщений по стриму
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_stream_created_desc 
ON messages(stream_id, created_at DESC) 
WHERE is_deleted = false;

-- 2. Индекс для фильтрации вопросов (частичный индекс)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_is_question_partial 
ON messages(is_question) 
WHERE is_question = true;

-- 3. Индекс для поиска по пользователям
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_username 
ON messages(username) 
WHERE username IS NOT NULL;

-- 4. Индекс для поиска по платформе
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_platform 
ON messages(platform) 
WHERE platform IS NOT NULL;

-- 5. Составной индекс для поиска по стриму + платформе
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_stream_platform 
ON messages(stream_id, platform, created_at DESC);

-- 6. Индекс для поиска по содержимому (GIN для полнотекстового поиска)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_content_gin 
ON messages USING gin(to_tsvector('russian', content));

-- 7. Индекс для быстрого подсчета статистики
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_stream_stats 
ON messages(stream_id, is_question, created_at);

-- 8. Индекс для поиска по времени (для аналитики)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at 
ON messages(created_at DESC);

-- Обновляем статистику после создания индексов
ANALYZE messages;

-- Проверяем размер индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE tablename = 'messages'
ORDER BY pg_relation_size(indexrelid) DESC;
