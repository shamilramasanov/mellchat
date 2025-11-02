-- Migration: Add user activity log table
-- Description: Детальное отслеживание активности пользователей и гостей
-- Date: 2025-11-01

CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255), -- ID зарегистрированного пользователя (NULL для гостей)
    session_id VARCHAR(255), -- ID гостевой сессии (NULL для зарегистрированных)
    stream_id VARCHAR(255) NOT NULL, -- ID стрима (connection_id)
    platform VARCHAR(50) NOT NULL, -- twitch, youtube, kick
    channel_name VARCHAR(255), -- Название канала
    action VARCHAR(50) NOT NULL, -- open, close, view_message, scroll
    metadata JSONB DEFAULT '{}'::jsonb, -- Дополнительные данные (url, title, etc.)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON user_activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_stream_id ON user_activity_log(stream_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_platform ON user_activity_log(platform);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_stream ON user_activity_log(user_id, stream_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_activity_session_stream ON user_activity_log(session_id, stream_id) WHERE session_id IS NOT NULL;

-- Комментарии
COMMENT ON TABLE user_activity_log IS 'Детальный лог активности пользователей и гостей';
COMMENT ON COLUMN user_activity_log.user_id IS 'ID зарегистрированного пользователя (NULL для гостей)';
COMMENT ON COLUMN user_activity_log.session_id IS 'ID гостевой сессии (NULL для зарегистрированных)';
COMMENT ON COLUMN user_activity_log.stream_id IS 'ID стрима (connection_id)';
COMMENT ON COLUMN user_activity_log.action IS 'Действие: open, close, view_message, scroll';
COMMENT ON COLUMN user_activity_log.metadata IS 'Дополнительные данные в формате JSON';

