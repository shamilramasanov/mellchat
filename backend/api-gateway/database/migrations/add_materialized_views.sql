-- =====================================================
-- МАТЕРИАЛИЗОВАННЫЕ ПРЕДСТАВЛЕНИЯ ДЛЯ АНАЛИТИКИ
-- =====================================================

-- 1. Статистика по стримам (обновляется каждые 5 минут)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stream_stats AS
SELECT 
    s.id as stream_id,
    s.platform,
    s.channel_name,
    s.title,
    s.status,
    s.created_at as stream_created_at,
    
    -- Статистика сообщений
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.is_question = true THEN 1 END) as total_questions,
    COUNT(CASE WHEN m.is_spam = false THEN 1 END) as quality_messages,
    COUNT(CASE WHEN m.is_spam = true THEN 1 END) as spam_messages,
    
    -- Статистика по настроению
    COUNT(CASE WHEN m.sentiment = 'happy' THEN 1 END) as happy_messages,
    COUNT(CASE WHEN m.sentiment = 'neutral' THEN 1 END) as neutral_messages,
    COUNT(CASE WHEN m.sentiment = 'sad' THEN 1 END) as sad_messages,
    
    -- Статистика по качеству
    AVG(m.message_score) as avg_message_score,
    COUNT(CASE WHEN m.message_score > 70 THEN 1 END) as high_quality_messages,
    COUNT(CASE WHEN m.message_score < 30 THEN 1 END) as low_quality_messages,
    
    -- Временные метрики
    MIN(m.created_at) as first_message_at,
    MAX(m.created_at) as last_message_at,
    MAX(m.created_at) - MIN(m.created_at) as stream_duration,
    
    -- Активность пользователей
    COUNT(DISTINCT m.username) as unique_users,
    COUNT(DISTINCT CASE WHEN m.created_at > NOW() - INTERVAL '1 hour' THEN m.username END) as active_users_1h,
    COUNT(DISTINCT CASE WHEN m.created_at > NOW() - INTERVAL '24 hours' THEN m.username END) as active_users_24h

FROM streams s
LEFT JOIN messages m ON s.id = m.stream_id AND m.is_deleted = false
GROUP BY s.id, s.platform, s.channel_name, s.title, s.status, s.created_at;

-- Индекс для быстрого поиска по стримам
CREATE INDEX IF NOT EXISTS idx_mv_stream_stats_stream_id ON mv_stream_stats(stream_id);
CREATE INDEX IF NOT EXISTS idx_mv_stream_stats_platform ON mv_stream_stats(platform);
CREATE INDEX IF NOT EXISTS idx_mv_stream_stats_status ON mv_stream_stats(status);

-- 2. Статистика по пользователям (обновляется каждые 10 минут)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.platform,
    u.first_seen,
    u.last_seen,
    
    -- Общая статистика
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.is_question = true THEN 1 END) as total_questions,
    COUNT(CASE WHEN m.is_spam = false THEN 1 END) as quality_messages,
    COUNT(CASE WHEN m.is_spam = true THEN 1 END) as spam_messages,
    
    -- Статистика по настроению
    COUNT(CASE WHEN m.sentiment = 'happy' THEN 1 END) as happy_messages,
    COUNT(CASE WHEN m.sentiment = 'neutral' THEN 1 END) as neutral_messages,
    COUNT(CASE WHEN m.sentiment = 'sad' THEN 1 END) as sad_messages,
    
    -- Статистика по качеству
    AVG(m.message_score) as avg_message_score,
    MAX(m.message_score) as max_message_score,
    MIN(m.message_score) as min_message_score,
    
    -- Активность по времени
    COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as messages_1h,
    COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as messages_24h,
    COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as messages_7d,
    
    -- Уникальные стримы
    COUNT(DISTINCT m.stream_id) as unique_streams,
    COUNT(DISTINCT CASE WHEN m.created_at > NOW() - INTERVAL '24 hours' THEN m.stream_id END) as active_streams_24h

FROM users u
LEFT JOIN messages m ON u.username = m.username AND u.platform = m.platform AND m.is_deleted = false
GROUP BY u.id, u.username, u.platform, u.first_seen, u.last_seen;

-- Индексы для быстрого поиска по пользователям
CREATE INDEX IF NOT EXISTS idx_mv_user_stats_user_id ON mv_user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_mv_user_stats_username ON mv_user_stats(username);
CREATE INDEX IF NOT EXISTS idx_mv_user_stats_platform ON mv_user_stats(platform);
CREATE INDEX IF NOT EXISTS idx_mv_user_stats_activity ON mv_user_stats(messages_24h DESC);

-- 3. Статистика по платформам (обновляется каждые 15 минут)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_platform_stats AS
SELECT 
    m.platform,
    
    -- Общая статистика
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.is_question = true THEN 1 END) as total_questions,
    COUNT(CASE WHEN m.is_spam = false THEN 1 END) as quality_messages,
    COUNT(CASE WHEN m.is_spam = true THEN 1 END) as spam_messages,
    
    -- Статистика по настроению
    COUNT(CASE WHEN m.sentiment = 'happy' THEN 1 END) as happy_messages,
    COUNT(CASE WHEN m.sentiment = 'neutral' THEN 1 END) as neutral_messages,
    COUNT(CASE WHEN m.sentiment = 'sad' THEN 1 END) as sad_messages,
    
    -- Статистика по качеству
    AVG(m.message_score) as avg_message_score,
    COUNT(CASE WHEN m.message_score > 70 THEN 1 END) as high_quality_messages,
    COUNT(CASE WHEN m.message_score < 30 THEN 1 END) as low_quality_messages,
    
    -- Активность пользователей
    COUNT(DISTINCT m.username) as unique_users,
    COUNT(DISTINCT m.stream_id) as unique_streams,
    
    -- Временные метрики
    MIN(m.created_at) as first_message_at,
    MAX(m.created_at) as last_message_at,
    
    -- Активность по времени
    COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as messages_1h,
    COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as messages_24h,
    COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as messages_7d

FROM messages m
WHERE m.is_deleted = false
GROUP BY m.platform;

-- Индекс для быстрого поиска по платформам
CREATE INDEX IF NOT EXISTS idx_mv_platform_stats_platform ON mv_platform_stats(platform);

-- 4. Статистика по времени (обновляется каждый час)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hourly_stats AS
SELECT 
    DATE_TRUNC('hour', m.created_at) as hour,
    m.platform,
    
    -- Статистика сообщений
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.is_question = true THEN 1 END) as total_questions,
    COUNT(CASE WHEN m.is_spam = false THEN 1 END) as quality_messages,
    COUNT(CASE WHEN m.is_spam = true THEN 1 END) as spam_messages,
    
    -- Статистика по настроению
    COUNT(CASE WHEN m.sentiment = 'happy' THEN 1 END) as happy_messages,
    COUNT(CASE WHEN m.sentiment = 'neutral' THEN 1 END) as neutral_messages,
    COUNT(CASE WHEN m.sentiment = 'sad' THEN 1 END) as sad_messages,
    
    -- Статистика по качеству
    AVG(m.message_score) as avg_message_score,
    
    -- Активность пользователей
    COUNT(DISTINCT m.username) as unique_users,
    COUNT(DISTINCT m.stream_id) as unique_streams

FROM messages m
WHERE m.is_deleted = false 
    AND m.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('hour', m.created_at), m.platform
ORDER BY hour DESC;

-- Индексы для быстрого поиска по времени
CREATE INDEX IF NOT EXISTS idx_mv_hourly_stats_hour ON mv_hourly_stats(hour);
CREATE INDEX IF NOT EXISTS idx_mv_hourly_stats_platform ON mv_hourly_stats(platform);
CREATE INDEX IF NOT EXISTS idx_mv_hourly_stats_hour_platform ON mv_hourly_stats(hour, platform);

-- 5. Топ пользователей (обновляется каждые 30 минут)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_users AS
SELECT 
    m.username,
    m.platform,
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.is_question = true THEN 1 END) as total_questions,
    AVG(m.message_score) as avg_message_score,
    COUNT(CASE WHEN m.message_score > 70 THEN 1 END) as high_quality_messages,
    COUNT(DISTINCT m.stream_id) as unique_streams,
    MAX(m.created_at) as last_activity

FROM messages m
WHERE m.is_deleted = false 
    AND m.created_at > NOW() - INTERVAL '7 days'
GROUP BY m.username, m.platform
HAVING COUNT(m.id) >= 10  -- Минимум 10 сообщений за неделю
ORDER BY total_messages DESC
LIMIT 1000;

-- Индексы для быстрого поиска топ пользователей
CREATE INDEX IF NOT EXISTS idx_mv_top_users_messages ON mv_top_users(total_messages DESC);
CREATE INDEX IF NOT EXISTS idx_mv_top_users_platform ON mv_top_users(platform);
CREATE INDEX IF NOT EXISTS idx_mv_top_users_quality ON mv_top_users(avg_message_score DESC);

-- =====================================================
-- ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ МАТЕРИАЛИЗОВАННЫХ ПРЕДСТАВЛЕНИЙ
-- =====================================================

-- Функция для обновления всех материализованных представлений
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stream_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_platform_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hourly_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_users;
END;
$$ LANGUAGE plpgsql;

-- Функция для обновления статистики по стриму
CREATE OR REPLACE FUNCTION refresh_stream_stats(p_stream_id TEXT)
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stream_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ
-- =====================================================

-- Функция для обновления статистики при изменении сообщений
CREATE OR REPLACE FUNCTION trigger_refresh_stats()
RETURNS trigger AS $$
BEGIN
    -- Обновляем статистику асинхронно (не блокируем основной запрос)
    PERFORM pg_notify('refresh_stats', '');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления статистики при изменении сообщений
DROP TRIGGER IF EXISTS trigger_messages_stats ON messages;
CREATE TRIGGER trigger_messages_stats
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_stats();

-- =====================================================
-- НАСТРОЙКИ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Настройки для материализованных представлений
ALTER MATERIALIZED VIEW mv_stream_stats SET (fillfactor = 90);
ALTER MATERIALIZED VIEW mv_user_stats SET (fillfactor = 90);
ALTER MATERIALIZED VIEW mv_platform_stats SET (fillfactor = 90);
ALTER MATERIALIZED VIEW mv_hourly_stats SET (fillfactor = 90);
ALTER MATERIALIZED VIEW mv_top_users SET (fillfactor = 90);

-- =====================================================
-- СТАТИСТИКА ПОСЛЕ СОЗДАНИЯ ПРЕДСТАВЛЕНИЙ
-- =====================================================

-- Обновляем статистику
ANALYZE mv_stream_stats;
ANALYZE mv_user_stats;
ANALYZE mv_platform_stats;
ANALYZE mv_hourly_stats;
ANALYZE mv_top_users;

-- Выводим информацию о созданных представлениях
SELECT 
    schemaname,
    matviewname,
    definition
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;
