# 🚀 Деплой MellChat в сеть

## Быстрый старт

### 1. Фронтенд (Vercel) - 5 минут

1. Зайди на [vercel.com](https://vercel.com)
2. Войди через GitHub
3. Нажми "New Project"
4. Выбери репозиторий `mellchat`
5. Настройки:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend/pwa`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Нажми "Deploy"

### 2. Бэкенд (Railway) - 10 минут

1. Зайди на [railway.app](https://railway.app)
2. Войди через GitHub
3. Нажми "New Project" → "Deploy from GitHub repo"
4. Выбери репозиторий `mellchat`
5. Настройки:
   - **Root Directory**: `backend/api-gateway`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Добавь Redis:
   - Нажми "+" → "Database" → "Add Redis"
7. Настрой переменные окружения:
   - `YOUTUBE_API_KEY` = твой YouTube API ключ
   - `KICK_PUSHER_APP_KEY` = `32cbd69e4b950bf97679`
   - `KICK_PUSHER_CLUSTER` = `us2`
8. Нажми "Deploy"

### 3. Обновить URL фронтенда

После деплоя бэкенда:
1. Скопируй URL бэкенда из Railway (например: `https://mellchat-api.railway.app`)
2. В Vercel → Settings → Environment Variables:
   - `REACT_APP_API_URL` = `https://mellchat-api.railway.app`
   - `REACT_APP_WS_URL` = `wss://mellchat-api.railway.app`
3. Пересобери проект в Vercel

## Результат

- **Фронтенд**: `https://mellchat.vercel.app`
- **Бэкенд**: `https://mellchat-api.railway.app`
- **Доступ с телефона**: ✅ Работает!

## Альтернативы

### Netlify (только фронтенд)
- Зайди на [netlify.com](https://netlify.com)
- Подключи GitHub репозиторий
- Настройки: `frontend/pwa` как root directory

### Heroku (полный стек)
- Зайди на [heroku.com](https://heroku.com)
- Создай два приложения: фронтенд и бэкенд
- Подключи GitHub и деплой

## Troubleshooting

### CORS ошибки
- Убедись что фронтенд URL добавлен в CORS настройки бэкенда

### WebSocket не работает
- Проверь что `REACT_APP_WS_URL` использует `wss://` для HTTPS

### Redis ошибки
- Убедись что Redis добавлен в Railway проект
- Проверь переменную `REDIS_URL`
