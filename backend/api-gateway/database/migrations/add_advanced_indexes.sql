-- =====================================================
-- ДОПОЛНИТЕЛЬНЫЕ ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- 1. Составные индексы для частых запросов
-- =====================================================

-- Индекс для поиска сообщений по стриму и платформе
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_stream_platform_created 
ON messages(stream_id, platform, created_at DESC);

-- Индекс для поиска сообщений по пользователю и стриму
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_username_stream_created 
ON messages(username, stream_id, created_at DESC);

-- Индекс для поиска сообщений по настроению
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sentiment_created 
ON messages(sentiment, created_at DESC) 
WHERE sentiment IS NOT NULL;

-- Индекс для поиска сообщений по классификации
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_classification_created 
ON messages(message_classification, created_at DESC) 
WHERE message_classification IS NOT NULL;

-- Индекс для поиска сообщений по score
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_score_created 
ON messages(message_score, created_at DESC) 
WHERE message_score IS NOT NULL;

-- 2. Частичные индексы для оптимизации
-- =====================================================

-- Индекс для активных стримов (не удаленных)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_active_streams 
ON messages(stream_id, created_at DESC) 
WHERE is_deleted = false;

-- Индекс для высококачественных сообщений (score > 70)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_high_quality 
ON messages(stream_id, created_at DESC) 
WHERE message_score > 70 AND is_spam = false;

-- Индекс для сообщений с вопросами (не спам)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_questions_quality 
ON messages(stream_id, created_at DESC) 
WHERE is_question = true AND is_spam = false;

-- 3. Индексы для аналитических запросов
-- =====================================================

-- Индекс для статистики по платформам
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_platform_stats 
ON messages(platform, created_at) 
WHERE is_deleted = false;

-- Индекс для статистики по пользователям
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user_stats 
ON messages(username, platform, created_at) 
WHERE is_deleted = false;

-- Индекс для временных диапазонов
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_time_ranges 
ON messages(created_at, stream_id, platform) 
WHERE is_deleted = false;

-- 4. Индексы для таблицы questions
-- =====================================================

-- Составной индекс для вопросов по стриму и времени
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_stream_created 
ON questions(stream_id, created_at DESC);

-- Индекс для вопросов по пользователю
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_username 
ON questions(username, created_at DESC);

-- Индекс для вопросов по платформе
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_platform 
ON questions(platform, created_at DESC);

-- 5. Индексы для таблицы user_sessions
-- =====================================================

-- Индекс для активных сессий
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active 
ON user_sessions(user_id, stream_id, last_seen_at DESC) 
WHERE last_seen_at > NOW() - INTERVAL '1 hour';

-- Индекс для поиска сессий по стриму
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_stream 
ON user_sessions(stream_id, last_seen_at DESC);

-- 6. Индексы для таблицы streams
-- =====================================================

-- Индекс для активных стримов
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_active 
ON streams(platform, status, created_at DESC) 
WHERE status = 'active';

-- Индекс для поиска стримов по каналу
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_channel 
ON streams(platform, channel_name, created_at DESC);

-- 7. Индексы для таблицы users
-- =====================================================

-- Индекс для поиска пользователей по платформе
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_platform 
ON users(platform, last_seen DESC);

-- Индекс для активных пользователей
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active 
ON users(last_seen DESC) 
WHERE last_seen > NOW() - INTERVAL '7 days';

-- 8. Функциональные индексы
-- =====================================================

-- Индекс для поиска по части username (для автодополнения)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_username_lower 
ON messages(LOWER(username), created_at DESC);

-- Индекс для поиска по части текста (для полнотекстового поиска)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_text_gin 
ON messages USING gin(to_tsvector('english', COALESCE(content, text)));

-- 9. Индексы для мониторинга производительности
-- =====================================================

-- Индекс для медленных запросов (created_at для анализа)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_hour 
ON messages(DATE_TRUNC('hour', created_at), stream_id);

-- Индекс для анализа нагрузки по времени
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_load_analysis 
ON messages(created_at, platform, stream_id) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- 10. Специальные индексы для аналитики
-- =====================================================

-- Индекс для анализа настроения по времени
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_mood_analysis 
ON messages(sentiment, created_at, stream_id) 
WHERE sentiment IS NOT NULL AND is_spam = false;

-- Индекс для анализа качества сообщений
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_quality_analysis 
ON messages(message_score, message_classification, created_at) 
WHERE message_score IS NOT NULL;

-- =====================================================
-- СТАТИСТИКА ПОСЛЕ СОЗДАНИЯ ИНДЕКСОВ
-- =====================================================

-- Обновляем статистику для оптимизатора запросов
ANALYZE messages;
ANALYZE questions;
ANALYZE user_sessions;
ANALYZE streams;
ANALYZE users;

-- Выводим информацию о созданных индексах
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('messages', 'questions', 'user_sessions', 'streams', 'users')
ORDER BY tablename, indexname;
