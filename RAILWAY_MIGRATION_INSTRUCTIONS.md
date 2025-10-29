# 🚀 Инструкция по применению миграции базы данных

## Проблема
В логах видны 500 ошибки в admin API, потому что в базе данных отсутствуют поля, которые используются в SQL запросах:
- `connection_id`
- `is_spam` 
- `is_deleted`
- `moderation_reason`
- `sentiment`

## Решение

### 1. Получить DATABASE_URL из Railway
```bash
# В Railway Dashboard -> Database -> Connect -> PostgreSQL
# Скопировать DATABASE_URL
```

### 2. Применить миграцию локально
```bash
# Установить DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Применить миграцию
./apply_moderation_migration.sh
```

### 3. Или применить миграцию через Railway CLI
```bash
# Установить Railway CLI
npm install -g @railway/cli

# Войти в Railway
railway login

# Подключиться к проекту
railway link

# Выполнить миграцию
railway run psql -f backend/api-gateway/database/migrations/add_moderation_fields.sql
```

### 4. Проверить результат
После применения миграции admin API должен работать без 500 ошибок.

## Поля, которые будут добавлены:
- `connection_id VARCHAR(255)` - ID соединения для группировки сообщений
- `is_spam BOOLEAN DEFAULT FALSE` - флаг спама
- `is_deleted BOOLEAN DEFAULT FALSE` - флаг удаления
- `moderation_reason TEXT` - причина модерации
- `sentiment VARCHAR(50) DEFAULT 'neutral'` - настроение сообщения

## Индексы:
- `idx_messages_connection_id`
- `idx_messages_is_spam`
- `idx_messages_is_deleted`
- `idx_messages_sentiment`
