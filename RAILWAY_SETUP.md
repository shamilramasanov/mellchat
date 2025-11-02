# 🚀 Railway Deployment Setup

## Шаг 1: Создай проект на Railway

1. Перейди на [railway.app](https://railway.app)
2. Создай новый проект
3. Подключи GitHub репозиторий

## Шаг 2: Добавь БД и Redis

### PostgreSQL
1. В проекте нажми **"+ New"**
2. Выбери **"Database"** → **"PostgreSQL"**
3. Railway автоматически создаст `DATABASE_URL`

### Redis
1. Нажми **"+ New"** ещё раз
2. Выбери **"Database"** → **"Redis"**
3. Railway автоматически создаст `REDIS_URL`

## Шаг 3: Настрой переменные окружения

В настройках проекта добавь все переменные:

### Обязательные
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=railway.internal  # Railway добавит автоматически
REDIS_URL=railway.internal     # Railway добавит автоматически
JWT_SECRET=твой_секретный_ключ_минимум_32_символа
```

### OAuth (Google)
```bash
GOOGLE_CLIENT_ID=твой_google_client_id
GOOGLE_CLIENT_SECRET=твой_google_client_secret
GOOGLE_CALLBACK_URL=https://твой-проект.up.railway.app/api/v1/auth/google/callback
```

### Frontend
```bash
FRONTEND_URL=https://твой-vercel-app.vercel.app
CORS_ORIGIN=https://твой-vercel-app.vercel.app
```

### API Keys
```bash
# YouTube
YOUTUBE_API_KEY=твой_youtube_key
YOUTUBE_API_KEY_1=твой_youtube_key_1
YOUTUBE_API_KEY_2=твой_youtube_key_2
YOUTUBE_API_KEY_3=твой_youtube_key_3

# Twitch
TWITCH_CLIENT_ID=gp762nuuoqcoxypju8c569th9wz7q5
TWITCH_CLIENT_SECRET=твой_twitch_secret
TWITCH_ACCESS_TOKEN=4bdy1fx0looodlsxildw6pekcj0fdc
TWITCH_REFRESH_TOKEN=mdtk78avpyy7nyfntvjiaper0nw33to5ejd3cs8eqg93qrg3ue

# Kick
KICK_PUSHER_APP_KEY=32cbd69e4b950bf97679
KICK_PUSHER_CLUSTER=us2

# Gemini AI
GEMINI_API_KEY=твой_gemini_key
```

### Админ
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=твой_пароль
ADMIN_EMAIL=твой_email@example.com
```

### Email (опционально)
```bash
EMAIL_PROVIDER=mock  # Для старта используй mock
```

## Шаг 4: Настрой деплой

1. В настройках проекта выбери **"Settings"**
2. Оставь **"Root Directory"** пустым (Railway найдёт `Dockerfile` в корне автоматически)
3. Railway обнаружит Dockerfile и начнёт деплой

## Шаг 5: Проверь деплой

1. Railway начнёт деплой автоматически
2. Смотри логи в реальном времени
3. Дождись зелёного статуса

### Что должно произойти:
1. ✅ Миграции применились успешно
2. ✅ Сервер запустился на порту 3001
3. ✅ Логи показывают "Server running on port 3001"

## Шаг 6: Получи домен

1. В настройках проекта → **"Settings"**
2. В разделе **"Networking"** включи **"Generate Domain"**
3. Скопируй полученный URL (например: `https://твой-проект.up.railway.app`)

## Шаг 7: Обнови callback URL в Google OAuth

1. Перейди в [Google Cloud Console](https://console.cloud.google.com)
2. Выбери свой OAuth 2.0 проект
3. В **"Authorized redirect URIs"** добавь:
   ```
   https://твой-проект.up.railway.app/api/v1/auth/google/callback
   ```

## 🎯 Проверка работоспособности

```bash
# Health check
curl https://твой-проект.up.railway.app/api/v1/health

# Должен вернуть:
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "redis": "connected"
  }
}
```

## ❌ Решение проблем

### Миграции не применяются
- Проверь `DATABASE_URL` в переменных окружения
- Смотри логи Railway

### Сервер не стартует
- Проверь `PORT=3001`
- Убедись что нет ошибок в логах

### CORS ошибки
- Проверь `CORS_ORIGIN` и `FRONTEND_URL`
- Убедись что URL совпадают с Vercel

## 📝 Полный список переменных

Смотри `docs/api_must_have.md` (локально) для примера всех рабочих переменных.

