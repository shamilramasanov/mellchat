# 🔗 Настройка Railway + Vercel

## 📊 Текущая конфигурация

### **Railway Backend (API)**
- **URL:** `https://mellchat-production.up.railway.app`
- **WebSocket:** `wss://mellchat-production.up.railway.app/ws`
- **Port:** 3001 (внутренний Railway)

### **Vercel Frontend**
- **Production URL:** `https://www.mellchat.live` (custom domain)
- **Vercel URL:** `https://mellchat-v5y7.vercel.app` (legacy)
- **Root Directory:** `frontend/pwa`

---

## 🔧 Railway Backend - Переменные окружения

Настрой эти переменные в **Railway Dashboard → Settings → Variables**:

### Обязательные
```bash
NODE_ENV=production
PORT=3001

# БД (Railway создает автоматически при добавлении PostgreSQL)
DATABASE_URL=postgresql://postgres:LazJKTlhgRAdGiEiVAeYxHTvzzvSCsbB@switchyard.proxy.rlwy.net:39699/railway

# Redis (Railway создает автоматически при добавлении Redis)
REDIS_URL=redis://default:HiqTKguDyvwbYBhbpuOpQarjpBWUglNO@switchyard.proxy.rlwy.net:10047

# JWT
JWT_SECRET=mellchat_super_secret_key_2025_production_oauth
```

### CORS - КРИТИЧНО!
```bash
# ДОМЕН ВЕБСАЙТА (главное!)
CORS_ORIGIN=https://www.mellchat.live
FRONTEND_URL=https://www.mellchat.live

# Дополнительно разрешены в коде:
# - https://mellchat.live
# - https://mellchat.vercel.app
# - https://mellchat-v5y7.vercel.app
```

### OAuth Google
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-railway-domain.up.railway.app/api/v1/auth/google/callback
```

### API Keys
```bash
# YouTube
YOUTUBE_API_KEY=AIzaSyCLjXWCeJ-2g-cc6dWQyVyihRi6jsiSrtI
YOUTUBE_API_KEY_1=AIzaSyCLjXWCeJ-2g-cc6dWQyVyihRi6jsiSrtI
YOUTUBE_API_KEY_2=AIzaSyD4ZO6WKzTkRzINAeU8ilY4o59yOpKlkqY
YOUTUBE_API_KEY_3=AIzaSyDXV3wWoF67YchGU1BgWLRd9PDY67pGfXA

# Gemini AI
GEMINI_API_KEY=AIzaSyBQa-hU8J1hRURFi-AZqGWpFckq8XbjHhg

# Kick
KICK_PUSHER_APP_KEY=32cbd69e4b950bf97679
KICK_PUSHER_CLUSTER=us2

# Twitch
TWITCH_CLIENT_ID=gp762nuuoqcoxypju8c569th9wz7q5
TWITCH_CLIENT_SECRET=your_twitch_secret
TWITCH_ACCESS_TOKEN=4bdy1fx0looodlsxildw6pekcj0fdc
TWITCH_REFRESH_TOKEN=mdtk78avpyy7nyfntvjiaper0nw33to5ejd3cs8eqg93qrg3ue
```

### Admin (опционально)
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
ADMIN_EMAIL=admin@mellchat.live
```

### Email (опционально, для старта используй mock)
```bash
EMAIL_PROVIDER=mock
```

---

## 🎨 Vercel Frontend - Переменные окружения

Настрой эти переменные в **Vercel Dashboard → Settings → Environment Variables**:

### API конфигурация
```bash
# КРИТИЧНО! Укажи URL Railway API
VITE_API_URL=https://mellchat-production.up.railway.app
VITE_WS_URL=https://mellchat-production.up.railway.app

# Опционально
VITE_APP_NAME=MellChat
VITE_APP_VERSION=2.0.0
```

---

## 🚀 Шаги настройки

### 1️⃣ Railway Backend

1. Открой [Railway Dashboard](https://railway.app)
2. Выбери проект **mellchat-production**
3. Перейди в **Settings → Variables**
4. Проверь все переменные из раздела выше
5. **Важно:** Проверь что `CORS_ORIGIN` и `FRONTEND_URL` содержат `https://www.mellchat.live`
6. Сохрани изменения
7. Railway автоматически перезапустит сервис

### 2️⃣ Vercel Frontend

1. Открой [Vercel Dashboard](https://vercel.com)
2. Выбери проект **MellChat** (или найди по домену `mellchat.live`)
3. Перейди в **Settings → Environment Variables**
4. Добавь переменную:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://mellchat-production.up.railway.app`
   - **Environment:** Production, Preview, Development
5. Сохрани
6. Перейди в **Deployments**
7. Найди последний деплой и нажми **"Redeploy"**

### 3️⃣ Проверка

#### Backend Health Check
```bash
curl https://mellchat-production.up.railway.app/api/v1/health
```
**Ожидаемый ответ:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "redis": "connected",
    "database": "connected"
  }
}
```

#### Frontend доступность
```bash
curl -I https://www.mellchat.live
```
**Ожидаемые заголовки:**
```
HTTP/2 200
server: Vercel
x-vercel-cache: HIT
```

#### Service Worker
```bash
curl https://www.mellchat.live/sw-v3.js
```
**Ожидаемый ответ:** JavaScript код, НЕ HTML

---

## ❌ Решение проблем

### Railway 404 "Application not found"

**Проблема:** При запросе на Railway URL видишь:
```json
{"status":"error","code":404,"message":"Application not found"}
```

**Причина:** Бэкенд не запущен или деплой упал на Railway.

**Решение:**
1. Открой [Railway Dashboard](https://railway.app)
2. Проверь статус сервиса (должен быть зелёный 🟢)
3. Перейди в **Service → Logs** и проверь на ошибки
4. Если сервис не запущен:
   - Проверь что Dockerfile в корне репозитория
   - Проверь переменные окружения
   - Restart сервис вручную
5. Проверь что Root Directory в настройках пустой (Railway найдёт Dockerfile автоматически)

**Проверка:**
```bash
# Должен вернуть 404 НО от Railway бэкенда, не от Railway инфраструктуры
curl -I https://mellchat-production.up.railway.app/

# Если видишь "railway-edge" в заголовках - Railway не может найти приложение
# Если видишь "Express" - бэкенд работает
```

### CORS ошибки

**Проблема:** В логах браузера видишь `Access-Control-Allow-Origin` ошибку

**Решение:**
1. Проверь что `CORS_ORIGIN=https://www.mellchat.live` в Railway
2. Проверь что Railway бэкенд запущен (Health check)
3. Перезапусти Railway сервис
4. Очисти кэш браузера

**Проверка:**
```bash
# В терминале
curl -X OPTIONS https://mellchat-production.up.railway.app/api/v1/auth/guest/register \
  -H "Origin: https://www.mellchat.live" \
  -H "Access-Control-Request-Method: POST" \
  -v
```
Должен вернуть заголовок `access-control-allow-origin: https://www.mellchat.live`

### WebSocket падает (1006)

**Проблема:** В логах видишь `WebSocket connection failed` code 1006

**Решение:**
1. Проверь логи Railway: Settings → Service → Logs
2. Убедись что WebSocket сервер запущен
3. Проверь что переменная `PORT=3001` установлена
4. Restart сервис на Railway

**Проверка:**
```bash
# Проверь WebSocket endpoint
curl https://mellchat-production.up.railway.app/ws/status
```
Ожидается: `{"status":"active","connections":N}`

### Service Worker ошибка

**Проблема:** `Unexpected token '<'` при загрузке SW файлов

**Решение:**
✅ **УЖЕ ИСПРАВЛЕНО** в `frontend/pwa/vercel.json`
- Пересобери фронтенд на Vercel
- Очисти кэш браузера
- Проверь что файлы отдаются с правильным MIME типом

---

## 🔄 Деплой фронтенда

### Через Vercel Dashboard
1. Открой [Vercel Dashboard](https://vercel.com)
2. Проект **MellChat**
3. **Deployments** → **Create Deployment**
4. Выбери ветку `main`
5. Дождись завершения

### Через GitHub (автоматически)
```bash
# В локальной папке frontend/pwa
git add .
git commit -m "feat: update SW config"
git push origin main

# Vercel автоматически задеплоит
```

---

## 📝 Ссылки на консоли

- **Railway:** https://railway.app/dashboard
- **Vercel:** https://vercel.com/dashboard
- **Google OAuth:** https://console.cloud.google.com/apis/credentials

---

## ✅ Чеклист перед релизом

- [ ] Railway backend запущен (health check OK)
- [ ] `CORS_ORIGIN` и `FRONTEND_URL` указаны правильно
- [ ] Vercel переменная `VITE_API_URL` установлена
- [ ] Frontend передеплоен на Vercel
- [ ] Service Worker загружается (sw-v3.js возвращает JS, не HTML)
- [ ] CORS работает (нет ошибок в консоли)
- [ ] WebSocket подключается (в DevTools → Network → WS)
- [ ] Google OAuth callback URL указан в консоли Google

---

**Последнее обновление:** 2 ноября 2025

