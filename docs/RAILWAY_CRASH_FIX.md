# 🔥 Railway Crash Fix - Правильная настройка

## Проблема

Приложение **крашится сразу после миграций**. В логах видны:
1. ✅ Миграции проходят успешно
2. ✅ Rate limiter инициализируется
3. ✅ Redis подключается
4. ❌ **Сервер НЕ стартует** - process завершается

## Причина

Railway не находит файлы из-за **неправильного Root Directory**.

## Решение

### 1. Проверьте Root Directory в Railway

Railway Dashboard → **Settings** → **Root Directory** должно быть:

```
backend/api-gateway
```

**НЕ должно быть:**
- Пусто
- `.`
- `/`

### 2. Пересоздайте сервис если Root Directory не помогает

**Способ 1: Через Railway Dashboard**

1. Удалите существующий сервис (НЕ удаляйте проект!)
2. **"+ New"** → **"Empty Service"**
3. В настройках сервиса:
   - **GitHub Repo:** выбрать `shamilramasanov/mellchat`
   - **Branch:** `main`
   - **Root Directory:** `backend/api-gateway` ⚠️ **КРИТИЧНО!**
4. **Generate Domain** для получения URL
5. Подождите автоматического деплоя

**Способ 2: Через railway.json**

Railway использует `railway.json` в корне проекта если его нет в `backend/api-gateway/`.

Создайте `/railway.json` в **корне репозитория**:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend/api-gateway && npm install"
  },
  "deploy": {
    "startCommand": "cd backend/api-gateway && npm run start:with-migrations",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 3. Альтернатива: Используйте Docker вместо Nixpacks

Railway Dashboard → Settings → Builder → выбрать **Dockerfile**

Тогда Railway будет использовать `/Dockerfile` из корня.

## После исправления

Ожидаемые логи:
```
✅ Connected to database on attempt 1
📝 Running migrations...
🎉 Migrations completed!
✅ All routes loaded successfully  
✅ API Gateway started successfully on 0.0.0.0:3001
```

## Debug

Если проблема осталась, проверьте:

1. **Root Directory установлен:**
   Railway Dashboard → Settings → Root Directory = `backend/api-gateway`

2. **Файлы на месте:**
   Railway Dashboard → Settings → **"Open Shell"**:
   ```bash
   ls -la
   # Должны быть: package.json, src/, apply-migrations.js
   ```

3. **Запуск вручную:**
   ```bash
   cat package.json | grep start
   npm run start:with-migrations
   ```

## Проверка

Health check:
```bash
curl https://ваш-railway-url.up.railway.app/health
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

## Быстрое решение

Если ничего не помогает:

1. Railway Dashboard → Service → Settings
2. **"Delete Service"** (НЕ проект!)
3. "+ New" → "Empty Service"
4. **Root Directory: `backend/api-gateway`**
5. Done!

---
**Причина всех проблем:** Railway ищет файлы в корне репозитория, а не в `backend/api-gateway/`.

