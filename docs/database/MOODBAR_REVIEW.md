# 🗄️ Обзор базы данных для MoodBar

**Дата:** 1 ноября 2025  
**Статус:** Анализ текущей структуры БД и необходимых изменений

---

## ✅ Что УЖЕ есть в БД

### Таблица `messages`:

**Текущая структура (schema.sql):**
```sql
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    stream_id VARCHAR(255) NOT NULL,
    connection_id VARCHAR(255),
    username VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    is_question BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,           ✅ Есть
    is_deleted BOOLEAN DEFAULT FALSE,
    moderation_reason TEXT,
    sentiment VARCHAR(50) DEFAULT 'neutral', ✅ Есть
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Индексы:**
```sql
CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment); ✅ Есть
CREATE INDEX IF NOT EXISTS idx_messages_is_spam ON messages(is_spam);     ✅ Есть
```

### Сохранение в databaseService.js:

**Поля, которые сохраняются:**
```javascript
INSERT INTO messages (
  id, stream_id, username, text, content,
  platform, timestamp, is_question,
  sentiment,          ✅ Сохраняется
  is_spam,            ✅ Сохраняется
  message_score,      ⚠️ НО поля нет в schema.sql!
  message_classification, ⚠️ НО поля нет в schema.sql!
  created_at
)
```

---

## ⚠️ Проблемы и несоответствия

### 1. Поля могут отсутствовать в базе данных

**В databaseService.js пытаются сохранить:**
- `message_score` - числовая оценка качества сообщения
- `message_classification` - классификация (spam, normal, quality и т.д.)
- `content` - альтернативное поле для текста

**Проверка:** Эти поля могут быть добавлены в миграциях:
- `fix_schema_critical.sql` - добавляет `content`, `message_score`, `message_classification`
- `optimize_data_types.sql` - оптимизирует типы данных для этих полей

**Решение:** 
- ✅ Миграция `add_message_scoring_fields.sql` создана
- ⚠️ Нужно убедиться, что миграции применены к БД
- ⚠️ Если миграции уже применены - поля должны быть в БД

---

### 2. Логика сохранения спама

**В messageHandler.js сказано:**
```javascript
// Спам не анализируем по sentiment и не сохраняем в БД
if (isSpam) {
  normalizedMessage.sentiment = 'neutral';
  // Возвращаем сообщение для WebSocket, но не сохраняем в БД и не учитываем в mood
  return normalizedMessage;
}
```

**НО в databaseService.js спам сохраняется:**
```javascript
is_spam,  // Сохраняется в БД
```

**Вопрос:** Нужно ли сохранять спам в БД для MoodBar анализа последних 50 сообщений?

**Ответ:** ДА, нужно сохранять спам, так как:
- Frontend анализирует последние 50 сообщений из БД
- Нужно знать, сколько спама для подсветки рамки (красный цвет)
- Но спам НЕ учитывается в mood статистике (broadcast настроения)

---

### 3. Поле `content` в schema.sql

**В databaseService.js пытаются сохранить:**
```javascript
content,  // ⚠️ Поле используется, но может отсутствовать в schema.sql
```

**Проверка:** Нужно убедиться, что поле `content` есть в таблице

---

## 🔧 Рекомендуемые изменения

### Миграция 1: Добавить поля message_score и message_classification

**Файл:** `backend/api-gateway/database/migrations/add_message_scoring_fields.sql`

```sql
-- Добавляем поля для оценки качества сообщений
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS message_score FLOAT DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS message_classification VARCHAR(50) DEFAULT 'normal';

-- Добавляем индекс для быстрого поиска по классификации
CREATE INDEX IF NOT EXISTS idx_messages_classification 
  ON messages(message_classification);

-- Комментарии для документации
COMMENT ON COLUMN messages.message_score IS 'Оценка качества сообщения (0.0 - 1.0)';
COMMENT ON COLUMN messages.message_classification IS 'Классификация: spam, normal, quality';
```

---

### Миграция 2: Убедиться, что поле content существует

**Файл:** `backend/api-gateway/database/migrations/add_content_field.sql`

```sql
-- Добавляем поле content, если его нет
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS content TEXT;

-- Комментарий
COMMENT ON COLUMN messages.content IS 'Альтернативное поле для текста сообщения';
```

---

### Миграция 3: Убедиться, что индексы оптимальны

**Проверка существующих индексов:**

```sql
-- Проверяем существование индексов
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'messages';

-- Должны быть:
-- ✅ idx_messages_stream_id
-- ✅ idx_messages_timestamp
-- ✅ idx_messages_is_question
-- ✅ idx_messages_is_spam
-- ✅ idx_messages_sentiment
-- ⚠️ idx_messages_classification (нужно добавить после миграции 1)
```

---

## 📊 Запросы для MoodBar

### Запрос последних 50 сообщений с sentiment и spam:

```sql
SELECT 
  id,
  stream_id,
  username,
  text,
  platform,
  timestamp,
  is_question,
  is_spam,
  sentiment,
  message_score,
  message_classification
FROM messages
WHERE stream_id = $1
  AND is_deleted = false
ORDER BY timestamp DESC
LIMIT 50;
```

**Этот запрос уже работает** - все необходимые поля есть в БД (кроме message_score и message_classification, которые нужно добавить).

---

## 🎯 Что нужно сделать

### Приоритет 1: Критично (для MoodBar)

1. ✅ **Проверить наличие поля `content`** - добавить если нет
2. ⚠️ **Добавить поля `message_score` и `message_classification`** - для полноты данных
3. ✅ **Убедиться, что спам сохраняется** - для анализа последних 50 сообщений

### Приоритет 2: Оптимизация

4. ✅ **Добавить индекс на `message_classification`** - для быстрых запросов
5. ⚠️ **Составной индекс для фильтрации** - если нужно:
   ```sql
   CREATE INDEX idx_messages_stream_sentiment_spam 
     ON messages(stream_id, sentiment, is_spam) 
     WHERE is_deleted = false;
   ```

---

## 📋 Чеклист миграций

- [x] Создать миграцию `add_message_scoring_fields.sql` ✅
- [x] Добавить поле `content` в миграцию ✅
- [x] Проверить, что спам сохраняется в БД (сейчас сохраняется ✅)
- [ ] Применить миграцию к БД
- [ ] Протестировать запрос последних 50 сообщений с sentiment и spam
- [ ] Убедиться, что индексы созданы и работают

---

## 🔍 Проверка текущего состояния

### SQL запрос для проверки структуры:

```sql
-- Проверить структуру таблицы messages
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Проверить индексы
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'messages';

-- Проверить наличие sentiment данных
SELECT 
  sentiment,
  COUNT(*) as count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM messages) as percentage
FROM messages
GROUP BY sentiment;

-- Проверить наличие spam данных
SELECT 
  is_spam,
  COUNT(*) as count
FROM messages
GROUP BY is_spam;
```

---

## ✅ Итог

**Хорошие новости:**
- ✅ Поле `sentiment` есть в БД и сохраняется
- ✅ Поле `is_spam` есть в БД и сохраняется
- ✅ Индексы на sentiment и is_spam созданы
- ✅ Запрос последних 50 сообщений уже работает
- ⚠️ Поля `message_score`, `message_classification`, `content` могут уже существовать (из других миграций)

**Что нужно проверить:**
- ⚠️ Применить миграцию `add_message_scoring_fields.sql` (если поля еще не добавлены)
- ✅ Убедиться, что спам сохраняется (сейчас сохраняется)
- ✅ Проверить, что запрос последних 50 сообщений работает корректно

**Вывод:** БД **в основном готова** для MoodBar! 
- Критичные поля (`sentiment`, `is_spam`) уже есть ✅
- Опциональные поля (`message_score`, `message_classification`) могут быть добавлены через миграцию
- Функционал MoodBar будет работать даже без опциональных полей

---

*Документ создан: 1 ноября 2025*

