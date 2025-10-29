-- КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ СХЕМЫ БД
-- Выполнять по порядку!

-- 1. Добавляем недостающую колонку content
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;

-- 2. Копируем данные из text в content (если content пустой)
UPDATE messages SET content = text WHERE content IS NULL OR content = '';

-- 3. Добавляем новые поля для аналитики
ALTER TABLE messages ADD COLUMN IF NOT EXISTS 
  sentiment VARCHAR(20) DEFAULT 'neutral';

ALTER TABLE messages ADD COLUMN IF NOT EXISTS 
  is_spam BOOLEAN DEFAULT FALSE;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS 
  message_score INTEGER DEFAULT 50;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS 
  message_classification VARCHAR(20) DEFAULT 'normal';

-- 4. Добавляем колонку для отслеживания времени обновления
ALTER TABLE messages ADD COLUMN IF NOT EXISTS 
  updated_at TIMESTAMP DEFAULT NOW();

-- 5. Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Проверяем результат
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;
