# 🚨 КРИТИЧНО: Применить миграцию БД СЕЙЧАС!

## Проблема
В логах все еще видны 500 ошибки в admin API:
- `GET /api/v1/admin/analytics/full 500`
- `GET /api/v1/admin/moderation/stats 500` 
- `GET /api/v1/admin/moderation/history 500`
- `GET /api/v1/admin/database/overview 500`

## Причина
В базе данных отсутствуют поля, которые используются в SQL запросах:
- `connection_id`
- `is_spam`
- `is_deleted` 
- `moderation_reason`
- `sentiment`

## Решение

### Вариант 1: Через Railway CLI (рекомендуется)
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

### Вариант 2: Через Railway Dashboard
1. Зайти в Railway Dashboard
2. Выбрать проект MellChat
3. Перейти в Database
4. Нажать "Connect" → "PostgreSQL"
5. Скопировать DATABASE_URL
6. Выполнить локально:
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
./apply_moderation_migration.sh
```

### Вариант 3: Прямое подключение к БД
```bash
# Подключиться к PostgreSQL
psql "postgresql://user:password@host:port/database"

# Выполнить SQL
\i backend/api-gateway/database/migrations/add_moderation_fields.sql
```

## После применения миграции
- Все 500 ошибки исчезнут
- Admin API будет работать корректно
- AI Assistant сможет получать данные

## Проверка
После миграции проверьте:
1. Admin панель загружается без ошибок
2. Все вкладки работают
3. AI Assistant отвечает на вопросы
4. В логах нет 500 ошибок
