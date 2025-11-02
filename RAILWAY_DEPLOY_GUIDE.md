# 🚂 Railway Deployment Guide - MellChat Backend

## Быстрый старт

### 1. Подключите GitHub к Railway

1. Перейдите на [Railway.app](https://railway.app)
2. Войдите через GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Выберите репозиторий `MellChat`

### 2. Настройте Root Directory

**ВАЖНО:** Установите Root Directory в `backend/api-gateway`

Railway Dashboard → Service Settings → Root Directory → `backend/api-gateway`

### 3. Добавьте PostgreSQL Database

1. В проекте нажмите **"+ New"**
2. Выберите **Database** → **Add PostgreSQL**
3. Railway автоматически создаст `DATABASE_URL`
4. Подождите запуска БД (~1 минута)

### 4. Добавьте Redis (Опционально)

1. **"+ New"** → **Database** → **Add Redis**
2. Автоматически создастся `REDIS_URL`

### 5. Настройте Environment Variables

Railway Dashboard → Variables → **Generate Domain** (для получения URL)

**ОБЯЗАТЕЛЬНЫЕ переменные:**

```bash
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=<случайная_строка_минимум_32_символа>
JWT_EXPIRES_IN=7d

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<надежный_пароль>
ADMIN_EMAIL=admin@mellchat.live

# Frontend
FRONTEND_URL=https://mellchat.vercel.app
CORS_ORIGIN=https://mellchat.vercel.app

# OAuth Google (замените на свои значения)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://<твой-railway-url>/api/v1/auth/google/callback

# External APIs (замените на свои значения)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_ACCESS_TOKEN=your_twitch_access_token
TWITCH_REFRESH_TOKEN=your_twitch_refresh_token

YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_API_KEY_1=your_youtube_api_key_1
YOUTUBE_API_KEY_2=your_youtube_api_key_2
YOUTUBE_API_KEY_3=your_youtube_api_key_3

# Kick
KICK_PUSHER_APP_KEY=your_kick_pusher_key
KICK_PUSHER_CLUSTER=us2

# Email (mock для начала)
EMAIL_PROVIDER=mock

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 6. Автоматический деплой

Railway автоматически:
- Определит `nixpacks.toml` или `Dockerfile`
- Установит зависимости
- Применит миграции через `npm run start:with-migrations`
- Запустит приложение

### 7. Проверка деплоя

#### Логи
Railway Dashboard → Deployments → Latest → Logs

Должны увидеть:
```
✅ Connected to database on attempt 1
📝 Running migrations...
🎉 All migrations completed successfully!
✅ API Gateway started successfully on 0.0.0.0:3001
```

#### Health Check
```bash
curl https://<твой-railway-url>/health
```

Должен вернуть:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "redis": "connected"
  }
}
```

#### Test API
```bash
curl https://<твой-railway-url>/api/v1/health
```

### 8. Обновите Frontend

Скопируйте Railway URL и обновите:

**frontend/pwa/src/shared/utils/constants.js:**
```javascript
export const API_URL = 'https://твой-railway-url.up.railway.app';
```

Или добавьте в `.env`:
```bash
VITE_API_URL=https://твой-railway-url.up.railway.app
```

## Troubleshooting

### Миграции не применены

**Решение:**
Railway Dashboard → Variables → Проверьте `DATABASE_URL`

Если нет → Создайте заново PostgreSQL
```bash
# Проверка вручную
railway run node apply-migrations.js
```

### Приложение не запускается

**Проверьте:**
1. Root Directory установлен в `backend/api-gateway` ✅
2. Все обязательные переменные установлены
3. PostgreSQL запущен
4. Логи на наличие ошибок

**Логи:**
```bash
railway logs
```

### Connection timeout

**Решение:**
Увеличено до 30 секунд в `apply-migrations.js` и `databaseService.js`. Если проблемы остаются:

1. Railway → Database → Metrics
2. Проверьте доступность БД
3. Перезапустите сервис

### PORT конфликты

**Решение:**
- Railway автоматически устанавливает `PORT` переменную
- Не устанавливайте `PORT` вручную
- Приложение использует `process.env.PORT || 3001`

## После успешного деплоя

1. ✅ Health check работает
2. ✅ Миграции применены
3. ✅ WebSocket работает на `/ws`
4. ✅ Admin панель доступна
5. ✅ API отвечает

## Полезные команды Railway CLI

```bash
# Установка
npm install -g @railway/cli

# Логин
railway login

# Логи
railway logs

# Переменные
railway variables

# SSH в контейнер
railway shell

# Запустить команду
railway run node apply-migrations.js

# Перезапуск
railway restart
```

## Структура деплоя

```
MellChat/
└── backend/
    └── api-gateway/      ← Root Directory
        ├── src/          ← Код
        ├── database/     ← Миграции
        ├── nixpacks.toml ← Build config
        ├── railway.json  ← Deploy config
        └── package.json  ← Dependencies
```

## Автоматические обновления

При каждом `git push` в `main`:
1. Railway запускает новый build
2. Применяет миграции
3. Запускает приложение
4. Zero-downtime deployment

## Мониторинг

Railway предоставляет:
- CPU/Memory usage
- Network traffic
- Database connections
- Error rates
- Log aggregation

## Стоимость

**Free tier:**
- $5 кредитов/месяц
- PostgreSQL включен
- SSL сертификаты
- Достаточно для разработки

**Production:**
- ~$10-20/месяц (starter plan)
- Неограниченные деплои
- Мониторинг
- Support

## Чеклист успешного деплоя

- [ ] GitHub репозиторий подключен
- [ ] Root Directory = `backend/api-gateway`
- [ ] PostgreSQL добавлен
- [ ] Все переменные окружения установлены
- [ ] Railway domain получен
- [ ] Миграции применены (проверить логи)
- [ ] Health check проходит
- [ ] API отвечает корректно
- [ ] Frontend обновлен с новым URL
- [ ] SSL сертификат активен (автоматически)

---

**Готово!** Backend работает на Railway 🎉

