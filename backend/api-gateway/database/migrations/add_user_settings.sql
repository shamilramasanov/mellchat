-- Migration: Add user settings table
-- Description: Настройки пользователей приложения
-- Date: 2025-11-01

-- Создаем таблицу настроек пользователей
CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(255) PRIMARY KEY,
    notifications BOOLEAN DEFAULT true,
    mood_bar_enabled BOOLEAN DEFAULT false,
    theme VARCHAR(50) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'ru',
    font_size VARCHAR(20) DEFAULT 'medium',
    compact_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

-- Комментарии
COMMENT ON TABLE user_settings IS 'Настройки пользователей приложения';
COMMENT ON COLUMN user_settings.theme IS 'Тема интерфейса: dark, light, auto';
COMMENT ON COLUMN user_settings.language IS 'Язык интерфейса: ru, en, uk';
COMMENT ON COLUMN user_settings.font_size IS 'Размер шрифта: small, medium, large';

