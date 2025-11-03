# 🔧 Railway Troubleshooting

## ⚠️ Ошибка: Application not found (404)

**Симптом:** При обращении к `https://mellchat-production.up.railway.app` получаешь:
```json
{"status":"error","code":404,"message":"Application not found"}
```

Это означает что Railway не может найти запущенное приложение.

---

## ✅ Шаг 1: Проверь Railway Dashboard

1. Открой [Railway Dashboard](https://railway.app)
2. Выбери проект **mellchat-production**
3. Проверь статус сервиса:
   - 🟢 **Зелёный** — работает
   - 🟡 **Жёлтый** — деплоится
   - 🔴 **Красный** — ошибка

---

## 📋 Шаг 2: Проверь логи

1. В Railway Dashboard перейди в **Service → Logs**
2. Ищи ошибки:
   - `❌ Failed to start`
   - `Error connecting to database`
   - `Missing environment variable`
   - `Port already in use`
3. Скопируй последние 50-100 строк ошибок

---

## 🔄 Шаг 3: Restart сервис

1. В Railway Dashboard перейди в **Service**
2. Нажми **Settings**
3. Найди кнопку **Restart** или **Redeploy**
4. Дождись завершения деплоя (5-10 минут)

---

## ⚙️ Шаг 4: Проверь конфигурацию

### Root Directory
1. **Settings → Deploy**
2. **Root Directory** должно быть **пустым** или `/`
3. Railway найдёт Dockerfile автоматически

### Source
1. **Settings → Source**
2. Проверь что подключен правильный GitHub репозиторий
3. Branch должен быть `main`

---

## 🔑 Шаг 5: Проверь переменные окружения

В **Settings → Variables** должны быть:

### Критичные (без них не запустится)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<railway_auto_generated>
REDIS_URL=<railway_auto_generated>
JWT_SECRET=<your_secret>
```

### Для CORS (иначе фронтенд не заработает)
```bash
CORS_ORIGIN=https://www.mellchat.live
FRONTEND_URL=https://www.mellchat.live
```

**Важно:** Если этих переменных нет — добавь их вручную.

---

## 🐳 Шаг 6: Проверь Dockerfile

Railway должен найти Dockerfile в корне репозитория.

**Проверка:**
```bash
# В локальном репозитории
ls -la | grep Dockerfile

# Должно быть:
# Dockerfile
```

**Содержимое Dockerfile должно быть:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/api-gateway/package*.json ./
RUN npm ci --only=production
COPY backend/api-gateway/src ./src
COPY backend/api-gateway/apply-migrations.js ./
COPY backend/api-gateway/database ./database
RUN mkdir -p logs
USER nodejs
EXPOSE 3001
CMD ["npm", "run", "start:with-migrations"]
```

---

## 🔍 Шаг 7: Проверь что сервис запустился

После деплоя проверь логи на наличие:

```bash
✅ ✅ API Gateway started successfully on 0.0.0.0:3001
✅ Health check endpoint: /api/v1/health
✅ WebSocket server started
```

**Тест:**
```bash
# Должен вернуть 404, но от твоего Express приложения, не от Railway
curl -I https://mellchat-production.up.railway.app/

# Если видишь в заголовках:
# server: railway-edge  ❌ Railway не может найти приложение
# server: Express       ✅ Приложение работает
```

---

## 🚨 Типичные ошибки

### Ошибка: DATABASE_URL not found
**Решение:** Добавь PostgreSQL в Railway проект:
1. **"+" → Database → PostgreSQL**
2. Railway создаст `DATABASE_URL` автоматически

### Ошибка: REDIS_URL not found
**Решение:** Добавь Redis в Railway проект:
1. **"+" → Database → Redis**
2. Railway создаст `REDIS_URL` автоматически

### Ошибка: Port 3001 already in use
**Решение:** 
1. Удали старый сервис
2. Создай новый
3. Проверь что `PORT=3001` в переменных окружения

### Ошибка: npm ci failed
**Решение:**
1. Проверь `package.json` в `backend/api-gateway/`
2. Убедись что все зависимости правильные
3. Проверь что Node.js версия >= 18

### Ошибка: Cannot find module './src/index.js'
**Решение:**
1. Проверь Root Directory в Settings
2. Должно быть пустым, НЕ `backend/api-gateway`
3. Dockerfile должен копировать из `backend/api-gateway/src`

---

## 📞 Когда ничего не помогло

1. **Создай новый сервис:**
   - Удали старый сервис
   - Создай новый из того же репозитория
   - Railway построит заново

2. **Проверь GitHub:**
   - Убедись что код залит в `main` ветку
   - Проверь что Dockerfile в корне репозитория

3. **Railway Support:**
   - Напиши в Railway Discord
   - Пришли логи и скриншоты конфигурации

---

**Последнее обновление:** 2 ноября 2025

