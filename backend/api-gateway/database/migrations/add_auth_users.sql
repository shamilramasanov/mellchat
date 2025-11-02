-- Migration: Add authentication users table
-- Description: Таблица для авторизованных пользователей приложения (не путать с users для чат-пользователей)
-- Date: 2025-11-01

-- Создаем таблицу для авторизованных пользователей приложения
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(255) PRIMARY KEY,
    
    -- Авторизация
    phone VARCHAR(20) UNIQUE,
    phone_verified BOOLEAN DEFAULT false,
    email VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT false,
    password_hash VARCHAR(255),
    
    -- Профиль
    name VARCHAR(255),
    avatar_url TEXT,
    
    -- OAuth
    google_id VARCHAR(255) UNIQUE,
    
    -- Метаданные
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_users_google_id ON app_users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_users_created_at ON app_users(created_at);

-- Комментарии для документации
COMMENT ON TABLE app_users IS 'Авторизованные пользователи приложения MellChat';
COMMENT ON COLUMN app_users.id IS 'Уникальный ID пользователя (UUID)';
COMMENT ON COLUMN app_users.phone IS 'Номер телефона в формате E.164 (+79001234567)';
COMMENT ON COLUMN app_users.phone_verified IS 'Подтвержден ли номер телефона';
COMMENT ON COLUMN app_users.email IS 'Email адрес пользователя';
COMMENT ON COLUMN app_users.email_verified IS 'Подтвержден ли email';
COMMENT ON COLUMN app_users.password_hash IS 'Хэш пароля (bcrypt)';
COMMENT ON COLUMN app_users.google_id IS 'Google OAuth ID';
COMMENT ON COLUMN app_users.name IS 'Имя пользователя';
COMMENT ON COLUMN app_users.avatar_url IS 'URL аватара пользователя';

