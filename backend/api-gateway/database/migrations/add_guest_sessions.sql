-- Migration: Add guest sessions table
-- Description: Отслеживание гостевых сессий (пользователи без регистрации)
-- Date: 2025-11-01

-- Создаем таблицу для гостевых сессий
CREATE TABLE IF NOT EXISTS guest_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL, -- Уникальный ID сессии гостя
    ip_address VARCHAR(45), -- IPv4 или IPv6
    user_agent TEXT, -- User-Agent браузера
    first_seen_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW(),
    streams_count INTEGER DEFAULT 0, -- Количество открытых стримов
    messages_viewed INTEGER DEFAULT 0, -- Количество просмотренных сообщений
    is_active BOOLEAN DEFAULT true, -- Активна ли сессия
    metadata JSONB DEFAULT '{}'::jsonb -- Дополнительная информация
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_guest_sessions_session_id ON guest_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_ip_address ON guest_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_last_seen ON guest_sessions(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_is_active ON guest_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_first_seen ON guest_sessions(first_seen_at);

-- Комментарии
COMMENT ON TABLE guest_sessions IS 'Гостевые сессии (пользователи без регистрации)';
COMMENT ON COLUMN guest_sessions.session_id IS 'Уникальный ID сессии (генерируется на фронтенде)';
COMMENT ON COLUMN guest_sessions.ip_address IS 'IP адрес пользователя';
COMMENT ON COLUMN guest_sessions.user_agent IS 'User-Agent браузера';
COMMENT ON COLUMN guest_sessions.streams_count IS 'Количество открытых стримов в этой сессии';
COMMENT ON COLUMN guest_sessions.messages_viewed IS 'Общее количество просмотренных сообщений';

