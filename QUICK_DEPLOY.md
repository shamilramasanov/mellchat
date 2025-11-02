# ⚡ Quick Deployment Guide

## 🎯 Быстрый старт (5 минут)

### Backend на Railway
1. Зайди на https://railway.app → **New Project** → **Deploy from GitHub**
2. Выбери репозиторий → папку `backend/api-gateway`
3. Добавь PostgreSQL и Redis через **"+ New" → "Database"**
4. Добавь переменные окружения (см. `backend/api-gateway/env.example`)
5. Скопируй URL деплоя (например: `https://mellchat-production.up.railway.app`)

### Frontend на Vercel
1. Зайди на https://vercel.com → **Add New Project**
2. Импортируй GitHub репозиторий
3. Настрой:
   - **Root Directory**: `frontend/pwa`
   - **Framework**: Vite
4. В **Environment Variables** добавь:
   ```
   VITE_API_URL=https://<твой_railway_url>
   VITE_WS_URL=wss://<твой_railway_url>
   ```
5. Обнови `frontend/pwa/vercel.json` - замени старый URL на новый

## ✅ Чек-лист

- [ ] Railway проект создан и деплоится
- [ ] PostgreSQL и Redis добавлены
- [ ] Все переменные окружения установлены
- [ ] Миграции применены (автоматически через `npm run migrate`)
- [ ] Vercel проект создан
- [ ] Переменные окружения в Vercel настроены
- [ ] `vercel.json` обновлен с новым Railway URL
- [ ] Health check работает: `curl https://<railway-url>/health`

## 🔗 Полезные ссылки

- Подробная инструкция: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Переменные окружения: [backend/api-gateway/env.example](./backend/api-gateway/env.example)

---

**После деплоя не забудь обновить URL в `vercel.json`!**

