# 🚀 Railway Clean Start Guide

## Что мы сделали

1. ✅ **Упростили Dockerfile** - теперь просто `CMD ["node", "src/index.js"]`
2. ✅ **Убрали все railway.json и nixpacks.toml** из поддиректорий
3. ✅ **Локально всё работает** - проверили руками

## Текущая конфигурация

### Dockerfile (корень репозитория)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/api-gateway/package*.json ./
RUN npm ci --only=production
COPY backend/api-gateway/src/ ./src/
COPY backend/api-gateway/apply-migrations.js ./apply-migrations.js
COPY backend/api-gateway/database/ ./database/
RUN mkdir -p logs
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3001
WORKDIR /app
CMD ["node", "src/index.js"]
```

### Что нужно сделать в Railway

1. **Railway Dashboard → Settings → Builder**
   - Выберите **"Dockerfile"** (не Nixpacks!)
   
2. **Railway Dashboard → Settings → Root Directory**
   - Оставьте **пустым** (Railway будет использовать Dockerfile из корня)

3. **Railway Dashboard → Deployments**
   - Нажмите **"Deploy"** или подождите автоматический деплой

4. **Проверьте логи**
   ```
   ✅ Connected to database on attempt 1
   📝 Running migrations...
   ✅ All routes loaded successfully
   ✅ API Gateway started successfully on 0.0.0.0:3001
   ```

## Ожидаемый результат

После деплоя должно быть:
- ✅ Сервер стартует на порту 3001
- ✅ Миграции применяются автоматически
- ✅ API отвечает на /api/v1/health
- ✅ WebSocket работает на /ws

## Если не работает

Покажи полные логи из Railway Dashboard → Deployments → Latest → Logs

---
**Главное:** Dockerfile из корня, никаких railway.json/nixpacks.toml в поддиректориях!

