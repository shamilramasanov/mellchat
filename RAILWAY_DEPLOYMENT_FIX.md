# 🚀 Исправление деплоя на Railway

## Проблема

Множественные ошибки `ECONNRESET` при подключении к PostgreSQL во время миграций:
```
❌ Migration failed: read ECONNRESET
```

## Причины

1. **Слишком короткий connection timeout** - 2 секунды недостаточно для Railway
2. **Отсутствие retry логики** в скриптах миграций
3. **Нет обработки нестабильного подключения** к БД

## Решение

### Исправления внесены

#### 1. Увеличены таймауты в databaseService.js
```javascript
connectionTimeoutMillis: 30000,  // было 2000
statement_timeout: 30000,        // было 5000
query_timeout: 30000,            // было 10000
```

#### 2. Добавлен retry механизм в apply-migrations.js
- **10 попыток** подключения с инкрементальными задержками
- **30 секунд** timeout на подключение
- **Graceful fallback** - приложение запускается даже если миграции не применились

#### 3. Обновлены скрипты запуска
- `apply-migrations.sh` теперь использует Node.js скрипт
- `package.json` напрямую вызывает `apply-migrations.js`
- `Dockerfile` копирует оба файла миграций

## Инструкция по деплою

### Вариант 1: Через Railway Dashboard (рекомендуется)

1. **Подключите GitHub репозиторий:**
   - Railway → New Project → Deploy from GitHub
   - Выберите репозиторий `MellChat`
   - **Важно**: установите **Root Directory** = `backend/api-gateway`

2. **Добавьте PostgreSQL:**
   - "+ New" → Database → PostgreSQL
   - Railway создаст `DATABASE_URL` автоматически

3. **Добавьте Redis (опционально):**
   - "+ New" → Database → Redis
   - Railway создаст `REDIS_URL` автоматически

4. **Настройте переменные окружения:**
   См. `backend/api-gateway/env.example` для полного списка

   **Обязательные:**
   ```bash
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=<случайный_секрет_минимум_32_символа>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<надежный_пароль>
   ADMIN_EMAIL=admin@example.com
   ```

5. **Автоматический деплой:**
   - Railway автоматически определит `nixpacks.toml` или `Dockerfile`
   - Миграции применятся через `npm run start:with-migrations`
   - Приложение запустится автоматически

### Вариант 2: Через Railway CLI

```bash
# Установите Railway CLI
npm install -g @railway/cli

# Авторизация
railway login

# Создайте проект
railway init

# Настройте переменные окружения
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=<ваш_секрет>
# ... и т.д.

# Деплой
railway up

# Примените миграции вручную (если нужно)
railway run node apply-migrations.js
```

## Проверка успешного деплоя

### 1. Проверьте логи в Railway Dashboard

Должны увидеть:
```
🚀 Applying database migrations...
✅ DATABASE_URL is set
📝 Running migrations using apply-migrations.js...
✅ Connected to database on attempt 1
📂 Migrations directory: ...
✅ Migration add_moderation_fields.sql applied successfully!
🎉 All migrations completed successfully!
```

### 2. Health Check

```bash
curl https://<ваш-railway-domain>/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": "..."
}
```

### 3. Проверка базы данных

```bash
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM messages;"
```

## Troubleshooting

### Миграции все еще падают

1. **Проверьте логи:** Railway Dashboard → Deployments → Latest → Logs
2. **Проверьте DATABASE_URL:** Railway → Variables → DATABASE_URL
3. **Убедитесь что PostgreSQL запущен:** Railway → Database → Status
4. **Попробуйте ручной запуск миграций:**
   ```bash
   railway run node apply-migrations.js
   ```

### Приложение не запускается

1. **Проверьте порт:** Railway автоматически устанавливает `PORT`, не задавайте его вручную
2. **Проверьте переменные окружения:** все обязательные переменные должны быть установлены
3. **Проверьте логи:** Railway Dashboard → Logs

### Database connection errors

1. **Проверьте SSL настройки:**
   - Railway PostgreSQL использует SSL по умолчанию
   - Убедитесь что `databaseService.js` правильно определяет SSL

2. **Проверьте доступность базы:**
   ```bash
   railway run psql $DATABASE_URL -c "SELECT NOW();"
   ```

## Оптимизация для Railway

### 1. Настройка health checks

В `railway.json` (уже настроено):
```json
{
  "deploy": {
    "startCommand": "npm run start:with-migrations",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Мониторинг метрик

Railway предоставляет встроенный мониторинг:
- CPU/Memory usage
- Network traffic
- Database connections
- Error rates

### 3. Environment-specific настройки

```bash
# Production
RAILWAY_ENVIRONMENT=production
NODE_ENV=production

# Staging
RAILWAY_ENVIRONMENT=staging
NODE_ENV=staging
```

## После успешного деплоя

1. Скопируйте Railway URL (например: `https://mellchat-production.up.railway.app`)
2. Обновите `frontend/pwa/vercel.json` с новым URL
3. Деплойте фронтенд на Vercel
4. Проверьте интеграцию между фронтом и бэком

## Полезные ссылки

- [Railway Docs](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [PostgreSQL на Railway](https://docs.railway.app/databases/postgresql)
- [Environment Variables на Railway](https://docs.railway.app/deploy/environment-variables)

## Чек-лист успешного деплоя

- [ ] Railway проект создан с Root Directory `backend/api-gateway`
- [ ] PostgreSQL добавлен и работает
- [ ] Redis добавлен (опционально)
- [ ] Все обязательные переменные окружения установлены
- [ ] Миграции применены успешно (проверьте логи)
- [ ] Health check отвечает 200 OK
- [ ] Приложение запущено без ошибок
- [ ] Database connection pool работает
- [ ] Логи чистые, без `ECONNRESET` ошибок

---

**Важно:** После каждого деплоя проверяйте логи на наличие `ECONNRESET` ошибок. Если они появились снова, проверьте что все исправления применены.

