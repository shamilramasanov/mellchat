-- =====================================================
-- СИСТЕМА МОНИТОРИНГА ПРОИЗВОДИТЕЛЬНОСТИ БД
-- =====================================================

-- 1. Включаем расширение pg_stat_statements для мониторинга запросов
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. Создаем таблицу для хранения метрик производительности
-- =====================================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Индексы для быстрого поиска метрик
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_time ON performance_metrics(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- 3. Создаем таблицу для хранения медленных запросов
-- =====================================================
CREATE TABLE IF NOT EXISTS slow_queries (
    id SERIAL PRIMARY KEY,
    query_hash BIGINT NOT NULL,
    query_text TEXT NOT NULL,
    calls BIGINT NOT NULL,
    total_time DOUBLE PRECISION NOT NULL,
    mean_time DOUBLE PRECISION NOT NULL,
    max_time DOUBLE PRECISION NOT NULL,
    min_time DOUBLE PRECISION NOT NULL,
    stddev_time DOUBLE PRECISION,
    rows BIGINT,
    shared_blks_hit BIGINT,
    shared_blks_read BIGINT,
    shared_blks_dirtied BIGINT,
    shared_blks_written BIGINT,
    local_blks_hit BIGINT,
    local_blks_read BIGINT,
    local_blks_dirtied BIGINT,
    local_blks_written BIGINT,
    temp_blks_read BIGINT,
    temp_blks_written BIGINT,
    blk_read_time DOUBLE PRECISION,
    blk_write_time DOUBLE PRECISION,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Индексы для анализа медленных запросов
CREATE INDEX IF NOT EXISTS idx_slow_queries_mean_time ON slow_queries(mean_time DESC);
CREATE INDEX IF NOT EXISTS idx_slow_queries_timestamp ON slow_queries(timestamp);
CREATE INDEX IF NOT EXISTS idx_slow_queries_query_hash ON slow_queries(query_hash);

-- 4. Создаем таблицу для мониторинга индексов
-- =====================================================
CREATE TABLE IF NOT EXISTS index_usage_stats (
    id SERIAL PRIMARY KEY,
    schemaname VARCHAR(100) NOT NULL,
    tablename VARCHAR(100) NOT NULL,
    indexname VARCHAR(100) NOT NULL,
    idx_tup_read BIGINT NOT NULL,
    idx_tup_fetch BIGINT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Индекс для анализа использования индексов
CREATE INDEX IF NOT EXISTS idx_index_usage_stats_table ON index_usage_stats(tablename, indexname);
CREATE INDEX IF NOT EXISTS idx_index_usage_stats_timestamp ON index_usage_stats(timestamp);

-- 5. Создаем таблицу для мониторинга блокировок
-- =====================================================
CREATE TABLE IF NOT EXISTS lock_monitoring (
    id SERIAL PRIMARY KEY,
    blocked_pid INTEGER,
    blocking_pid INTEGER,
    blocked_query TEXT,
    blocking_query TEXT,
    lock_type VARCHAR(50),
    mode VARCHAR(50),
    granted BOOLEAN,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Индекс для анализа блокировок
CREATE INDEX IF NOT EXISTS idx_lock_monitoring_timestamp ON lock_monitoring(timestamp);
CREATE INDEX IF NOT EXISTS idx_lock_monitoring_blocked ON lock_monitoring(blocked_pid);

-- 6. Функции для сбора метрик производительности
-- =====================================================

-- Функция для сбора базовых метрик БД
CREATE OR REPLACE FUNCTION collect_basic_metrics()
RETURNS void AS $$
DECLARE
    db_size BIGINT;
    active_connections INTEGER;
    max_connections INTEGER;
    cache_hit_ratio DOUBLE PRECISION;
    tps DOUBLE PRECISION;
BEGIN
    -- Размер базы данных
    SELECT pg_database_size(current_database()) INTO db_size;
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit) 
    VALUES ('database_size_bytes', db_size, 'bytes');
    
    -- Количество активных подключений
    SELECT count(*) INTO active_connections FROM pg_stat_activity WHERE state = 'active';
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit) 
    VALUES ('active_connections', active_connections, 'count');
    
    -- Максимальное количество подключений
    SELECT setting::INTEGER INTO max_connections FROM pg_settings WHERE name = 'max_connections';
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit) 
    VALUES ('max_connections', max_connections, 'count');
    
    -- Соотношение попаданий в кэш
    SELECT 
        round(100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2)
    INTO cache_hit_ratio
    FROM pg_stat_database 
    WHERE datname = current_database();
    
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit) 
    VALUES ('cache_hit_ratio', cache_hit_ratio, 'percent');
    
    -- TPS (транзакции в секунду)
    SELECT 
        round(sum(xact_commit + xact_rollback) / extract(epoch from (now() - stats_reset)), 2)
    INTO tps
    FROM pg_stat_database 
    WHERE datname = current_database();
    
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit) 
    VALUES ('transactions_per_second', tps, 'tps');
    
END;
$$ LANGUAGE plpgsql;

-- Функция для сбора метрик по таблицам
CREATE OR REPLACE FUNCTION collect_table_metrics()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
        FROM pg_stat_user_tables
    LOOP
        INSERT INTO performance_metrics (metric_name, metric_value, metric_unit, metadata) 
        VALUES (
            'table_live_tuples',
            table_record.live_tuples,
            'count',
            jsonb_build_object(
                'table', table_record.schemaname || '.' || table_record.tablename,
                'inserts', table_record.inserts,
                'updates', table_record.updates,
                'deletes', table_record.deletes,
                'dead_tuples', table_record.dead_tuples
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Функция для сбора метрик по индексам
CREATE OR REPLACE FUNCTION collect_index_metrics()
RETURNS void AS $$
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN 
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_tup_read,
            idx_tup_fetch
        FROM pg_stat_user_indexes
    LOOP
        INSERT INTO index_usage_stats (schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch)
        VALUES (
            index_record.schemaname,
            index_record.tablename,
            index_record.indexname,
            index_record.idx_tup_read,
            index_record.idx_tup_fetch
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Функция для сбора медленных запросов
CREATE OR REPLACE FUNCTION collect_slow_queries()
RETURNS void AS $$
BEGIN
    INSERT INTO slow_queries (
        query_hash, query_text, calls, total_time, mean_time, max_time, min_time,
        stddev_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied,
        shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied,
        local_blks_written, temp_blks_read, temp_blks_written, blk_read_time, blk_write_time
    )
    SELECT 
        queryid,
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        min_time,
        stddev_time,
        rows,
        shared_blks_hit,
        shared_blks_read,
        shared_blks_dirtied,
        shared_blks_written,
        local_blks_hit,
        local_blks_read,
        local_blks_dirtied,
        local_blks_written,
        temp_blks_read,
        temp_blks_written,
        blk_read_time,
        blk_write_time
    FROM pg_stat_statements 
    WHERE mean_time > 1000  -- Запросы дольше 1 секунды
    ORDER BY mean_time DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- 7. Функции для анализа производительности
-- =====================================================

-- Функция для получения топ медленных запросов
CREATE OR REPLACE FUNCTION get_top_slow_queries(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    query_text TEXT,
    mean_time DOUBLE PRECISION,
    calls BIGINT,
    total_time DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sq.query_text,
        sq.mean_time,
        sq.calls,
        sq.total_time
    FROM slow_queries sq
    WHERE sq.timestamp > NOW() - INTERVAL '1 hour'
    ORDER BY sq.mean_time DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для анализа использования индексов
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
    table_name TEXT,
    index_name TEXT,
    reads BIGINT,
    fetches BIGINT,
    efficiency DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ius.tablename as table_name,
        ius.indexname as index_name,
        ius.idx_tup_read as reads,
        ius.idx_tup_fetch as fetches,
        CASE 
            WHEN ius.idx_tup_read > 0 THEN 
                round(100.0 * ius.idx_tup_fetch / ius.idx_tup_read, 2)
            ELSE 0
        END as efficiency
    FROM index_usage_stats ius
    WHERE ius.timestamp > NOW() - INTERVAL '1 hour'
    ORDER BY ius.idx_tup_read DESC;
END;
$$ LANGUAGE plpgsql;

-- Функция для анализа метрик производительности
CREATE OR REPLACE FUNCTION analyze_performance_metrics(metric_name_param TEXT)
RETURNS TABLE(
    collected_at TIMESTAMP,
    metric_value DOUBLE PRECISION,
    metric_unit VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.timestamp as collected_at,
        pm.metric_value,
        pm.metric_unit
    FROM performance_metrics pm
    WHERE pm.metric_name = metric_name_param
        AND pm.timestamp > NOW() - INTERVAL '24 hours'
    ORDER BY pm.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Создание представлений для мониторинга
-- =====================================================

-- Представление для текущего состояния БД
CREATE OR REPLACE VIEW current_db_status AS
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value,
    'bytes' as unit
UNION ALL
SELECT 
    'Active Connections',
    count(*)::TEXT,
    'count'
FROM pg_stat_activity WHERE state = 'active'
UNION ALL
SELECT 
    'Cache Hit Ratio',
    round(100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2)::TEXT || '%',
    'percent'
FROM pg_stat_database WHERE datname = current_database()
UNION ALL
SELECT 
    'TPS',
    round(sum(xact_commit + xact_rollback) / extract(epoch from (now() - stats_reset)), 2)::TEXT,
    'tps'
FROM pg_stat_database WHERE datname = current_database();

-- Представление для анализа таблиц
CREATE OR REPLACE VIEW table_analysis AS
SELECT 
    schemaname||'.'||tablename as table_name,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2) as dead_tuple_ratio,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 9. Создание функции для автоматического сбора метрик
-- =====================================================

-- Функция для полного сбора всех метрик
CREATE OR REPLACE FUNCTION collect_all_metrics()
RETURNS void AS $$
BEGIN
    PERFORM collect_basic_metrics();
    PERFORM collect_table_metrics();
    PERFORM collect_index_metrics();
    PERFORM collect_slow_queries();
END;
$$ LANGUAGE plpgsql;

-- 10. Создание функции для очистки старых метрик
-- =====================================================

-- Функция для очистки старых метрик (старше 30 дней)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM performance_metrics WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM slow_queries WHERE timestamp < NOW() - INTERVAL '7 days';
    DELETE FROM index_usage_stats WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM lock_monitoring WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 11. Создание триггера для автоматического сбора метрик
-- =====================================================

-- Функция для триггера сбора метрик
CREATE OR REPLACE FUNCTION trigger_collect_metrics()
RETURNS trigger AS $$
BEGIN
    -- Собираем метрики асинхронно
    PERFORM pg_notify('collect_metrics', '');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггер для сбора метрик при изменении сообщений
DROP TRIGGER IF EXISTS trigger_messages_metrics ON messages;
CREATE TRIGGER trigger_messages_metrics
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_collect_metrics();

-- 12. Создание функции для экспорта метрик в JSON
-- =====================================================

-- Функция для экспорта метрик в JSON
CREATE OR REPLACE FUNCTION export_metrics_to_json()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'timestamp', NOW(),
        'database_name', current_database(),
        'basic_metrics', (
            SELECT json_object_agg(metric_name, metric_value)
            FROM performance_metrics 
            WHERE timestamp > NOW() - INTERVAL '1 hour'
        ),
        'slow_queries', (
            SELECT json_agg(
                json_build_object(
                    'query', query_text,
                    'mean_time', mean_time,
                    'calls', calls
                )
            )
            FROM slow_queries 
            WHERE timestamp > NOW() - INTERVAL '1 hour'
            ORDER BY mean_time DESC
            LIMIT 10
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- НАСТРОЙКИ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Настройки для мониторинга
ALTER TABLE performance_metrics SET (fillfactor = 95);
ALTER TABLE slow_queries SET (fillfactor = 95);
ALTER TABLE index_usage_stats SET (fillfactor = 95);

-- =====================================================
-- ФИНАЛЬНАЯ НАСТРОЙКА
-- =====================================================

-- Создаем начальные метрики
SELECT collect_all_metrics();

-- Выводим информацию о созданных объектах мониторинга
SELECT 
    'Performance Monitoring Objects Created' as status,
    count(*) as object_count
FROM (
    SELECT 'performance_metrics' as object_name
    UNION ALL SELECT 'slow_queries'
    UNION ALL SELECT 'index_usage_stats'
    UNION ALL SELECT 'lock_monitoring'
    UNION ALL SELECT 'current_db_status'
    UNION ALL SELECT 'table_analysis'
) t;
