-- КРИТИЧЕСКИЕ ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- Выполнять ПОСЛЕ исправления схемы!

-- 1. Основной индекс для загрузки сообщений (самый важный!)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_stream_created_desc 
ON messages(stream_id, created_at DESC);

-- 2. Индекс для вопросов (частичный - только вопросы)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_questions 
ON messages(stream_id, created_at DESC) 
WHERE is_question = true;

-- 3. Индекс для чистых сообщений (не спам)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_clean 
ON messages(stream_id, created_at DESC) 
WHERE is_spam = false;

-- 4. Индекс для поиска по пользователям
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_username_stream 
ON messages(username, stream_id, created_at DESC);

-- 5. Индекс для поиска по платформе
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_platform_stream 
ON messages(platform, stream_id, created_at DESC);

-- 6. Индекс для sentiment анализа
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sentiment 
ON messages(sentiment, stream_id, created_at DESC) 
WHERE sentiment IS NOT NULL;

-- 7. Индекс для message_score (для фильтрации)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_score 
ON messages(message_score, stream_id, created_at DESC) 
WHERE message_score IS NOT NULL;

-- 8. Составной индекс для статистики
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_stats 
ON messages(stream_id, is_question, is_spam, created_at);

-- 9. Индекс для ID-based пагинации
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_id_desc 
ON messages(id DESC, stream_id, created_at DESC);

-- 10. Обновляем статистику таблицы
ANALYZE messages;

-- 11. Проверяем созданные индексы
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'messages' 
AND indexname LIKE 'idx_messages_%'
ORDER BY indexname;
