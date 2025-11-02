-- Migration: Add user global rules table
-- Description: Пользовательские правила, дополняющие глобальные (создаются через ИИ)
-- Date: 2025-11-01

-- Создаем таблицу пользовательских правил
CREATE TABLE IF NOT EXISTS user_global_rules (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL, -- 'spam', 'questions', 'mood', etc.
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT, -- Описание правила, созданное пользователем
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Уникальность: один пользователь может иметь только одно правило каждого типа
    UNIQUE(user_id, rule_type)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_user_global_rules_user_id ON user_global_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_global_rules_type ON user_global_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_user_global_rules_enabled ON user_global_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_user_global_rules_settings ON user_global_rules USING GIN(settings_json);

-- Комментарии
COMMENT ON TABLE user_global_rules IS 'Пользовательские правила, дополняющие глобальные правила фильтрации';
COMMENT ON COLUMN user_global_rules.rule_type IS 'Тип правила: spam, questions, mood, moderation';
COMMENT ON COLUMN user_global_rules.settings_json IS 'JSON с настройками правила (дополняет глобальные)';
COMMENT ON COLUMN user_global_rules.description IS 'Описание правила в свободной форме, созданное пользователем через ИИ';

