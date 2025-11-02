-- Migration: Add authentication related tables
-- Description: Таблицы для SMS кодов, email верификации, токенов восстановления пароля
-- Date: 2025-11-01

-- Таблица для временного хранения SMS кодов (если не используем Redis)
-- Примечание: Предпочтительно использовать Redis для SMS кодов
CREATE TABLE IF NOT EXISTS sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT false,
    
    CONSTRAINT chk_expires_future CHECK (expires_at > created_at)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone_expires ON sms_codes(phone, expires_at) WHERE verified = false;
CREATE INDEX IF NOT EXISTS idx_sms_codes_created_at ON sms_codes(created_at);

-- Автоматическое удаление истекших кодов (опционально, можно через cron)
-- CREATE INDEX IF NOT EXISTS idx_sms_codes_expires ON sms_codes(expires_at) WHERE expires_at < NOW();

-- Таблица для верификации email
CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT false,
    
    -- FOREIGN KEY будет добавлен после создания app_users
    -- FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT chk_email_expires_future CHECK (expires_at > created_at)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token) WHERE verified = false;
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

-- Таблица для токенов восстановления пароля
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    
    -- FOREIGN KEY будет добавлен после создания app_users
    -- FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT chk_reset_expires_future CHECK (expires_at > created_at)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Комментарии
COMMENT ON TABLE sms_codes IS 'Временное хранение SMS кодов для авторизации (предпочтительно Redis)';
COMMENT ON TABLE email_verifications IS 'Токены для подтверждения email адресов';
COMMENT ON TABLE password_reset_tokens IS 'Токены для восстановления пароля';

