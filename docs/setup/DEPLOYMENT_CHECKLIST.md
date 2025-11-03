# ✅ Полный чеклист настройки Frontend + Backend

## 📋 Обзор

Этот чеклист покрывает полную настройку MellChat:
- **Backend (Railway):** API сервер и WebSocket
- **Frontend (Vercel):** React PWA приложение
- **Переменные окружения:** Все необходимые настройки
- **Проверка соединения:** Тесты и валидация

---

## 🚂 ШАГ 1: Railway Backend Setup

### 1.1 Создание проекта и сервисов

- [ ] Открыть [Railway Dashboard](https://railway.app)
- [ ] Создать новый проект (или выбрать существующий)
- [ ] Добавить PostgreSQL базу данных (New → Database → PostgreSQL)
- [ ] Добавить Redis (New → Database → Redis)
- [ ] Добавить Service из GitHub репозитория
  - [ ] Root Directory: `backend/api-gateway`
  - [ ] Start Command: `npm start`
  - [ ] Build Command: `npm install`

### 1.2 Railway Variables (Settings → Variables)

#### Обязательные базовые
- [ ] `NODE_ENV=production`
- [ ] ❌ **НЕ ДОБАВЛЯТЬ** `PORT` (Railway устанавливает автоматически)

#### База данных
- [ ] `DATABASE_URL` (Railway создаст автоматически при добавлении PostgreSQL)
  - Формат: `postgresql://postgres:PASSWORD@HOST:PORT/railway`
  - [ ] Проверить что значение не содержит кавычек

#### Redis
- [ ] `REDIS_URL` (Railway создаст автоматически при добавлении Redis)
  - Формат: `redis://default:PASSWORD@HOST:PORT`
  - [ ] Проверить что значение не содержит кавычек

#### CORS - КРИТИЧНО! 🔴
- [ ] `CORS_ORIGIN=https://www.mellchat.live` (без кавычек!)
- [ ] `FRONTEND_URL=https://www.mellchat.live` (без кавычек!)
- [ ] Проверить что значения БЕЗ кавычек и пробелов

#### JWT Authentication
- [ ] `JWT_SECRET=mellchat_super_secret_key_2025_production_oauth`
  - Использовать надежный секретный ключ
  - Никому не передавать

#### OAuth Google
- [ ] `GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com`
- [ ] `GOOGLE_CLIENT_SECRET=your-google-client-secret`
- [ ] `GOOGLE_CALLBACK_URL=https://your-railway-domain.up.railway.app/api/v1/auth/google/callback`

#### YouTube API
- [ ] `YOUTUBE_API_KEY=AIzaSyCLjXWCeJ-2g-cc6dWQyVyihRi6jsiSrtI`
- [ ] `YOUTUBE_API_KEY_1=AIzaSyCLjXWCeJ-2g-cc6dWQyVyihRi6jsiSrtI`
- [ ] `YOUTUBE_API_KEY_2=AIzaSyD4ZO6WKzTkRzINAeU8ilY4o59yOpKlkqY`
- [ ] `YOUTUBE_API_KEY_3=AIzaSyDXV3wWoF67YchGU1BgWLRd9PDY67pGfXA`

#### Gemini AI
- [ ] `GEMINI_API_KEY=AIzaSyBQa-hU8J1hRURFi-AZqGWpFckq8XbjHhg`

#### Kick Streaming
- [ ] `KICK_PUSHER_APP_KEY=32cbd69e4b950bf97679`
- [ ] `KICK_PUSHER_CLUSTER=us2`

#### Twitch API
- [ ] `TWITCH_CLIENT_ID=gp762nuuoqcoxypju8c569th9wz7q5`
- [ ] `TWITCH_CLIENT_SECRET=your_twitch_secret`
- [ ] `TWITCH_ACCESS_TOKEN=4bdy1fx0looodlsxildw6pekcj0fdc`
- [ ] `TWITCH_REFRESH_TOKEN=mdtk78avpyy7nyfntvjiaper0nw33to5ejd3cs8eqg93qrg3ue`

#### Admin (опционально)
- [ ] `ADMIN_USERNAME=shimramasanov`
- [ ] `ADMIN_PASSWORD=Lo1ipop1221`

#### Email (опционально)
- [ ] `EMAIL_PROVIDER=mock` (для начала используй mock)

### 1.3 Railway Service Settings

- [ ] Проверить Root Directory: `backend/api-gateway`
- [ ] Проверить Start Command: `npm start`
- [ ] Проверить что порт НЕ указан в переменных (Railway автоматически устанавливает)
- [ ] В Settings → Networking:
  - [ ] Записать Public Domain (например: `mellchat-production.up.railway.app`)
  - [ ] Или подключить Custom Domain

### 1.4 Railway Deployment

- [ ] Дождаться успешного деплоя (зеленый статус)
- [ ] Проверить логи: Settings → Service → Logs
  - [ ] Нет ошибок запуска
  - [ ] Видно `Server listening on port XXXX`
  - [ ] Видно `CORS allowed origins`

---

## 🎨 ШАГ 2: Vercel Frontend Setup

### 2.1 Создание проекта

- [ ] Открыть [Vercel Dashboard](https://vercel.com)
- [ ] Импортировать проект из GitHub
- [ ] Настроить проект:
  - [ ] Root Directory: `frontend/pwa`
  - [ ] Framework Preset: Vite
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `npm install --legacy-peer-deps`

### 2.2 Vercel Variables (Settings → Environment Variables)

#### API конфигурация - КРИТИЧНО! 🔴
- [ ] `VITE_API_URL=https://mellchat-production.up.railway.app`
  - Использовать Railway Public Domain из шага 1.3
  - Без слеша в конце
  - Environment: Production, Preview, Development

- [ ] `VITE_WS_URL=https://mellchat-production.up.railway.app`
  - Тот же URL что и `VITE_API_URL`
  - Environment: Production, Preview, Development

#### Опциональные
- [ ] `VITE_APP_NAME=MellChat`
- [ ] `VITE_APP_VERSION=2.0.0`

### 2.3 Vercel Configuration

- [ ] Проверить что `vercel.json` существует в `frontend/pwa/`
- [ ] Проверить настройки в `vercel.json`:
  - [ ] `cleanUrls: false`
  - [ ] Rewrites для Service Worker файлов
  - [ ] Headers для SW файлов (Content-Type: application/javascript)

### 2.4 Custom Domain (опционально)

- [ ] Добавить домен в Vercel: Settings → Domains
- [ ] Настроить DNS записи (CNAME или A)
- [ ] Дождаться проверки домена
- [ ] Обновить Railway `CORS_ORIGIN` и `FRONTEND_URL` на новый домен

### 2.5 Vercel Deployment

- [ ] Запустить деплой (автоматически или вручную)
- [ ] Дождаться успешного билда
- [ ] Проверить деплой:
  - [ ] Нет ошибок в Build Logs
  - [ ] Файлы отдаются корректно

---

## 🔍 ШАГ 3: Проверка Backend

### 3.1 Railway Health Check

```bash
curl https://mellchat-production.up.railway.app/api/v1/health
```

**Ожидаемый ответ:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T...",
  "services": {
    "redis": "connected"
  }
}
```

- [ ] Health endpoint отвечает
- [ ] Статус: `healthy`
- [ ] Redis: `connected`

### 3.2 Root Endpoint Check

```bash
curl https://mellchat-production.up.railway.app/
```

**Ожидаемый ответ:**
```json
{
  "service": "MellChat API Gateway",
  "status": "running",
  "version": "..."
}
```

- [ ] Root endpoint отвечает
- [ ] Не возвращает 404 "Application not found"

### 3.3 CORS Preflight Check

```bash
curl -X OPTIONS https://mellchat-production.up.railway.app/api/v1/auth/guest/register \
  -H "Origin: https://www.mellchat.live" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Ожидаемые заголовки:**
```
< HTTP/2 204
< access-control-allow-origin: https://www.mellchat.live
< access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
< access-control-allow-headers: Content-Type, Authorization, X-Session-Id, x-session-id, X-Requested-With
< access-control-allow-credentials: true
```

- [ ] Статус: `204 No Content`
- [ ] `access-control-allow-origin` содержит фронтенд домен
- [ ] `access-control-allow-credentials: true`
- [ ] Все нужные методы и заголовки разрешены

### 3.4 Railway Logs Check

- [ ] Открыть Railway Dashboard → Service → Logs
- [ ] Проверить:
  - [ ] Нет критических ошибок
  - [ ] Видно `CORS allowed origins: [...]`
  - [ ] Видно `Server listening on port XXXX`
  - [ ] WebSocket server инициализирован

---

## 🌐 ШАГ 4: Проверка Frontend

### 4.1 Frontend доступность

```bash
curl -I https://www.mellchat.live
```

**Ожидаемые заголовки:**
```
HTTP/2 200
server: Vercel
```

- [ ] Статус: `200 OK`
- [ ] Сервер: `Vercel`

### 4.2 Service Worker Check

```bash
curl https://www.mellchat.live/sw-v3.js
```

**Ожидаемый ответ:**
- JavaScript код (начинается с `//` или `self.addEventListener`)
- НЕ HTML (не начинается с `<!DOCTYPE html>`)
- Content-Type: `application/javascript`

- [ ] SW файл отдается как JavaScript
- [ ] НЕ возвращает HTML страницу
- [ ] Правильный Content-Type

### 4.3 Environment Variables Check

- [ ] Открыть DevTools → Console
- [ ] Ввести: `console.log(import.meta.env.VITE_API_URL)`
- [ ] Должен вывести Railway URL
- [ ] Проверить `import.meta.env.VITE_WS_URL`

---

## 🔗 ШАГ 5: Проверка соединения Frontend ↔ Backend

### 5.1 Browser Console Check

Открыть https://www.mellchat.live в браузере:

- [ ] Открыть DevTools → Console
- [ ] Проверить на ошибки:
  - [ ] Нет CORS ошибок
  - [ ] Нет WebSocket ошибок (1006)
  - [ ] Service Worker регистрируется (или предупреждение, но не критично)

### 5.2 Network Tab Check

- [ ] Открыть DevTools → Network
- [ ] Перезагрузить страницу
- [ ] Проверить запросы:
  - [ ] `/api/v1/auth/guest/register` → Status 200/201
  - [ ] `/ws` → Status 101 Switching Protocols (WebSocket)
  - [ ] `/sw-v3.js` → Status 200, Type: script

### 5.3 CORS Check (Network Tab)

- [ ] Найти запрос к `/api/v1/auth/guest/register`
- [ ] Проверить Response Headers:
  - [ ] `access-control-allow-origin: https://www.mellchat.live`
  - [ ] `access-control-allow-credentials: true`

### 5.4 WebSocket Check

- [ ] В Network Tab найти WebSocket соединение (`/ws`)
- [ ] Проверить:
  - [ ] Status: 101 Switching Protocols
  - [ ] Connection: Upgrade
  - [ ] В Messages видно сообщения (не только ошибки)

---

## 🔧 ШАГ 6: Решение проблем

### Проблема: Railway 404 "Application not found"

**Симптомы:**
```bash
curl https://mellchat-production.up.railway.app/api/v1/health
# {"status":"error","code":404,"message":"Application not found"}
```

**Решение:**
1. Проверить Railway Dashboard → Service статус (должен быть 🟢)
2. Проверить Root Directory: `backend/api-gateway`
3. Проверить Start Command: `npm start`
4. ❌ Убедиться что `PORT` НЕ указан в Variables
5. Проверить логи на ошибки запуска
6. Restart сервис вручную

### Проблема: CORS ошибки

**Симптомы:**
```
Access to XMLHttpRequest ... has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

**Решение:**
1. Проверить Railway Variables:
   - `CORS_ORIGIN=https://www.mellchat.live` (без кавычек!)
   - `FRONTEND_URL=https://www.mellchat.live` (без кавычек!)
2. Перезапустить Railway сервис
3. Очистить кэш браузера
4. Проверить preflight запрос (шаг 3.3)

### Проблема: WebSocket не подключается (1006)

**Симптомы:**
```
WebSocket connection to 'wss://...' failed:
WebSocket connection closed (code: 1006)
```

**Решение:**
1. Проверить Railway логи на ошибки WebSocket
2. Проверить что `VITE_WS_URL` в Vercel указан правильно
3. Проверить что Railway бэкенд запущен (health check)
4. Проверить WebSocket endpoint в Network Tab
5. Restart Railway сервис

### Проблема: Service Worker ошибка

**Симптомы:**
```
Uncaught SyntaxError: Unexpected token '<'
Failed to register a ServiceWorker
```

**Решение:**
1. Проверить что `vercel.json` настроен правильно (шаг 2.3)
2. Пересобрать фронтенд на Vercel
3. Очистить кэш браузера
4. Проверить что SW файл отдается как JS (шаг 4.2)
5. В DevTools → Application → Service Workers → Unregister старые SW

### Проблема: Переменные окружения не работают

**Решение:**
1. Проверить что переменные указаны БЕЗ кавычек
2. Перезапустить деплой на Vercel (для фронтенда)
3. Перезапустить сервис на Railway (для бэкенда)
4. Проверить через `curl` или в браузере

---

## ✅ Финальный чеклист

Перед тем как считать настройку завершенной:

### Backend
- [ ] Railway сервис запущен (зеленый статус)
- [ ] Health check возвращает `healthy`
- [ ] CORS preflight работает
- [ ] WebSocket endpoint доступен
- [ ] Все обязательные переменные установлены

### Frontend
- [ ] Vercel деплой успешен
- [ ] Frontend доступен по домену
- [ ] Service Worker файлы отдаются как JS
- [ ] Переменные окружения установлены (`VITE_API_URL`, `VITE_WS_URL`)

### Соединение
- [ ] Нет CORS ошибок в консоли
- [ ] WebSocket подключается (Status 101)
- [ ] API запросы проходят (Status 200/201)
- [ ] Нет критических ошибок в Network Tab

### Логи
- [ ] Railway логи чистые (нет критических ошибок)
- [ ] Browser Console чистый (нет блокирующих ошибок)
- [ ] Network Tab показывает успешные запросы

---

## 📝 Полезные команды

### Проверка Backend
```bash
# Health check
curl https://mellchat-production.up.railway.app/api/v1/health

# Root endpoint
curl https://mellchat-production.up.railway.app/

# CORS preflight
curl -X OPTIONS https://mellchat-production.up.railway.app/api/v1/auth/guest/register \
  -H "Origin: https://www.mellchat.live" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Проверка Frontend
```bash
# Frontend доступность
curl -I https://www.mellchat.live

# Service Worker
curl https://www.mellchat.live/sw-v3.js

# Проверка Content-Type
curl -I https://www.mellchat.live/sw-v3.js | grep content-type
```

### Проверка WebSocket
```bash
# Проверка WebSocket endpoint (если есть status endpoint)
curl https://mellchat-production.up.railway.app/ws/status
```

---

## 🔗 Ссылки

- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Google OAuth Console:** https://console.cloud.google.com/apis/credentials
- **Railway Documentation:** https://docs.railway.app
- **Vercel Documentation:** https://vercel.com/docs

---

**Последнее обновление:** 3 ноября 2025

