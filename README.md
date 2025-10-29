# MellChat - Multi-platform Streaming Chat Aggregator

![MellChat Logo](https://img.shields.io/badge/MellChat-v2.0.1-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=for-the-badge&logo=postgresql)

MellChat - это современный агрегатор чатов для стриминговых платформ (Twitch, YouTube, Kick) с поддержкой PWA и ИИ-функций.

## 🚀 Быстрый старт

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/mellchat.git
cd mellchat

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

### Переменные окружения

Скопируйте `.env.example` и настройте переменные:

```bash
cp backend/api-gateway/env.example backend/api-gateway/.env
```

## 📚 Документация

Вся документация проекта находится в папке [`docs/`](./docs/):

- **[📖 Полная документация](./docs/INDEX.md)** - Индекс всех документов
- **[📋 Задачи и статус](./docs/TASKS.md)** - Текущие задачи разработки
- **[🎯 Стратегия](./docs/STRATEGY.md)** - Стратегия развития проекта
- **[🔧 API документация](./docs/api.md)** - API endpoints и методы
- **[⚙️ Backend](./docs/BACKEND_README.md)** - Документация backend
- **[🎨 Frontend](./docs/FRONTEND_README.md)** - Документация frontend

## 🎯 Основные возможности

- ✅ **Мультиплатформенная интеграция** - Twitch, YouTube, Kick
- ✅ **PWA поддержка** - Установка на мобильные устройства
- ✅ **ИИ-функции** - Google Gemini интеграция
- ✅ **Real-time чат** - WebSocket соединения
- ✅ **Умная фильтрация** - Адаптивная детекция спама
- ✅ **Админ панель** - Полное управление системой
- ✅ **Мобильная оптимизация** - Адаптивный дизайн

## 🛠️ Технологии

### Frontend
- React 18 + Vite
- Zustand (state management)
- PWA (Service Worker)
- Tailwind CSS
- Framer Motion

### Backend
- Node.js + Express
- PostgreSQL + Redis
- WebSocket
- Google Gemini API
- BullMQ (очереди)

## 📊 Статус проекта

**Версия:** 2.0.1  
**Статус:** 🟢 Активная разработка  
**Последнее обновление:** $(date)

### ✅ Реализовано
- Мультиплатформенная интеграция
- PWA функционал
- ИИ-ассистент с Gemini
- Админ панель
- Система фильтрации
- Мобильная оптимизация

### 🔄 В разработке
- Страница пользователя с ИИ
- Расширенная аналитика
- ИИ-администратор

## 🚀 Развертывание

### Production

```bash
# Сборка проекта
npm run build

# Запуск в production
npm start
```

### Docker

```bash
# Сборка образа
docker build -t mellchat .

# Запуск контейнера
docker run -p 3001:3001 mellchat
```

## 📈 Производительность

- ⚡ **Быстрая загрузка** - Оптимизированный bundle
- 🔄 **Real-time** - WebSocket соединения
- 📱 **PWA** - Offline поддержка
- 🎯 **Адаптивность** - Мобильная оптимизация

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 📞 Поддержка

- 📧 Email: support@mellchat.com
- 💬 Discord: [MellChat Community](https://discord.gg/mellchat)
- 📖 Документация: [docs/](./docs/)

## 🙏 Благодарности

- React команде за отличный фреймворк
- Vite команде за быстрый bundler
- PostgreSQL команде за надежную БД
- Google за Gemini API

---

**MellChat** - Объединяем чаты, создаем сообщества! 🚀
