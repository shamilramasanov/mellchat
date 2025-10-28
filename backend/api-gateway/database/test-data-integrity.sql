-- Тест корректности данных в базе данных MellChat
-- Проверяет структуру, индексы и корреляцию данных

-- 1. Проверка структуры таблиц
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('messages', 'questions', 'user_sessions', 'streams', 'users')
ORDER BY table_name, ordinal_position;

-- 2. Проверка индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'questions', 'user_sessions', 'streams', 'users')
ORDER BY tablename, indexname;

-- 3. Проверка данных в таблице messages
SELECT 
    'messages' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT stream_id) as unique_streams,
    COUNT(DISTINCT platform) as unique_platforms,
    COUNT(DISTINCT username) as unique_users,
    COUNT(CASE WHEN is_question = true THEN 1 END) as questions_count,
    MIN(created_at) as oldest_message,
    MAX(created_at) as newest_message
FROM messages;

-- 4. Проверка корреляции данных между таблицами
SELECT 
    'messages_questions_correlation' as check_name,
    COUNT(m.id) as total_messages,
    COUNT(q.id) as total_questions,
    COUNT(CASE WHEN m.is_question = true THEN 1 END) as messages_marked_as_questions,
    CASE 
        WHEN COUNT(q.id) = COUNT(CASE WHEN m.is_question = true THEN 1 END) 
        THEN 'CORRECT' 
        ELSE 'MISMATCH' 
    END as correlation_status
FROM messages m
LEFT JOIN questions q ON q.message_id = m.id;

-- 5. Проверка целостности данных
SELECT 
    'data_integrity_check' as check_name,
    COUNT(CASE WHEN id IS NULL OR id = '' THEN 1 END) as null_ids,
    COUNT(CASE WHEN stream_id IS NULL OR stream_id = '' THEN 1 END) as null_stream_ids,
    COUNT(CASE WHEN username IS NULL OR username = '' THEN 1 END) as null_usernames,
    COUNT(CASE WHEN content IS NULL OR content = '' THEN 1 END) as null_texts,
    COUNT(CASE WHEN platform IS NULL OR platform = '' THEN 1 END) as null_platforms,
    COUNT(CASE WHEN timestamp IS NULL THEN 1 END) as null_timestamps
FROM messages;

-- 6. Проверка производительности запросов
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, stream_id, username, content, platform, created_at, is_question
FROM messages 
WHERE stream_id = 'test-stream' 
ORDER BY created_at DESC 
LIMIT 50;

-- 7. Проверка статистики по платформам
SELECT 
    platform,
    COUNT(*) as message_count,
    COUNT(CASE WHEN is_question = true THEN 1 END) as question_count,
    COUNT(DISTINCT username) as unique_users,
    COUNT(DISTINCT stream_id) as unique_streams,
    ROUND(AVG(LENGTH(content)), 2) as avg_message_length,
    MIN(created_at) as first_message,
    MAX(created_at) as last_message
FROM messages 
GROUP BY platform 
ORDER BY message_count DESC;

-- 8. Проверка дубликатов сообщений
SELECT 
    id,
    COUNT(*) as duplicate_count
FROM messages 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 9. Проверка временных меток
SELECT 
    'timestamp_check' as check_name,
    COUNT(CASE WHEN timestamp < 0 THEN 1 END) as negative_timestamps,
    COUNT(CASE WHEN timestamp > EXTRACT(EPOCH FROM NOW()) * 1000 THEN 1 END) as future_timestamps,
    COUNT(CASE WHEN timestamp = 0 THEN 1 END) as zero_timestamps,
    MIN(timestamp) as min_timestamp,
    MAX(timestamp) as max_timestamp
FROM messages;

-- 10. Проверка view message_stats
SELECT * FROM message_stats LIMIT 10;

-- 11. Проверка размера таблиц
SELECT 
    n.nspname as schemaname,
    c.relname as tablename,
    pg_size_pretty(pg_total_relation_size(n.nspname||'.'||c.relname)) as size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relname IN ('messages', 'questions', 'user_sessions', 'streams', 'users')
AND c.relkind = 'r'
ORDER BY pg_total_relation_size(n.nspname||'.'||c.relname) DESC;

-- 12. Проверка активности таблиц
SELECT 
    'table_activity' as check_name,
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND relname IN ('messages', 'questions', 'user_sessions', 'streams', 'users')
ORDER BY n_live_tup DESC;
