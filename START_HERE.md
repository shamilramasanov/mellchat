# 🚀 MellChat - Инструкция по запуску

## Требования

- **Node.js** 18+ 
- **PostgreSQL** 15+
- **Redis** 7+

## Установка

### 1. База данных PostgreSQL

```bash
# Создай базу данных
createdb mellchat

# Или через psql
psql -U postgres
CREATE DATABASE mellchat;
```

### 2. Redis

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

### 3. Backend

```bash
cd backend/api-gateway

# Установи зависимости
npm install

# Скопируй env.example в .env
cp env.example .env

# Отредактируй .env
# DATABASE_URL=postgresql://postgres:password@localhost:5432/mellchat
# REDIS_URL=redis://localhost:6379

# Запусти миграции
npm run migrate

# Запусти dev-сервер
npm run dev
```

Backend будет на `http://localhost:3001`

### 4. Frontend

```bash
cd frontend/pwa

# Установи зависимости
npm install

# Запусти dev-сервер
npm run dev
```

Frontend будет на `http://localhost:5173`

## Проверка

```bash
# Backend health check
curl http://localhost:3001/api/v1/health

# Frontend
open http://localhost:5173
```

## Production

### Backend

```bash
cd backend/api-gateway
npm run start
```

### Frontend

```bash
cd frontend/pwa
npm run build
npm run preview
```

## Решение проблем

### База данных не подключается

Проверь `.env`:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/mellchat
```

### Redis не работает

```bash
redis-cli ping  # Должен вернуть PONG
```

### Миграции падают

Очисти базу:
```bash
psql -d mellchat -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run migrate
```

