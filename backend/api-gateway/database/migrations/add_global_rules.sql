-- Migration: Add global rules table
-- Description: Глобальные правила для фильтрации (анти-спам, вопросы, настроения)
-- Date: 2025-11-01

-- Создаем таблицу глобальных правил
CREATE TABLE IF NOT EXISTS global_rules (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(50) NOT NULL UNIQUE, -- 'spam', 'questions', 'mood', etc.
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT true,
    updated_by VARCHAR(255), -- admin user ID
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_global_rules_type ON global_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_global_rules_enabled ON global_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_global_rules_settings ON global_rules USING GIN(settings_json);

-- Комментарии
COMMENT ON TABLE global_rules IS 'Глобальные правила фильтрации для всех пользователей';
COMMENT ON COLUMN global_rules.rule_type IS 'Тип правила: spam, questions, mood, moderation';
COMMENT ON COLUMN global_rules.settings_json IS 'JSON с настройками правил';
COMMENT ON COLUMN global_rules.enabled IS 'Включено ли правило';

-- Вставляем дефолтные правила
INSERT INTO global_rules (rule_type, settings_json, enabled) VALUES
('spam', '{
  "threshold": 0.7,
  "minLength": 3,
  "maxLength": 500,
  "spamWords": [],
  "patterns": [],
  "emojiRatio": 0.5,
  "capsRatio": 0.7,
  "repeatRatio": 0.3
}'::jsonb, true),
('questions', '{
  "enabled": true,
  "questionWords": ["?", "как", "что", "где", "когда", "почему", "who", "what", "where", "when", "why", "how"],
  "minLength": 5
}'::jsonb, true),
('mood', '{
  "enabled": true,
  "sampleSize": 50,
  "happyThreshold": 0.6,
  "neutralThreshold": 0.4,
  "sadThreshold": 0.2,
  "updateInterval": 1000
}'::jsonb, true)
ON CONFLICT (rule_type) DO NOTHING;

