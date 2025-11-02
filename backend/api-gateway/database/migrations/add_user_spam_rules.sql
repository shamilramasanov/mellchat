-- Migration: Add user spam rules table
-- Description: Правила AI фильтрации спама для каждого пользователя
-- Date: 2025-11-01

-- Создаем таблицу правил фильтрации спама
CREATE TABLE IF NOT EXISTS user_spam_rules (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    rules_json JSONB NOT NULL,
    sample_size INTEGER DEFAULT 10000,
    spam_found INTEGER DEFAULT 0,
    spam_detected_rate DECIMAL(5,2) DEFAULT 0.00,
    training_mode VARCHAR(50) DEFAULT 'moderate',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

-- Индекс для быстрого поиска правил по пользователю
CREATE INDEX IF NOT EXISTS idx_user_spam_rules_user_id ON user_spam_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_spam_rules_updated_at ON user_spam_rules(updated_at);

-- GIN индекс для быстрого поиска в JSONB
CREATE INDEX IF NOT EXISTS idx_user_spam_rules_rules_json ON user_spam_rules USING GIN(rules_json);

-- Комментарии
COMMENT ON TABLE user_spam_rules IS 'AI правила фильтрации спама для пользователей';
COMMENT ON COLUMN user_spam_rules.rules_json IS 'JSON с правилами фильтрации (patterns, keywords, thresholds)';
COMMENT ON COLUMN user_spam_rules.training_mode IS 'Режим обучения: strict, moderate, soft';
COMMENT ON COLUMN user_spam_rules.spam_detected_rate IS 'Процент найденного спама в выборке';

