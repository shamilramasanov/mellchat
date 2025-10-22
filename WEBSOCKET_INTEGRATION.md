# WebSocket Integration

## ✅ Что сделано:

### 1. **WebSocket Hook** (`src/hooks/useWebSocket.js`)
- Автоподключение к `wss://mellchat-production.up.railway.app`
- Автореконнект при обрыве связи (до 5 попыток)
- Подписка на сообщения от стримов
- Управление стримами (добавление/удаление)

### 2. **Интеграция в App.js**
- Использование WebSocket данных вместо моков
- Мок данные показываются только если нет активных стримов
- Реальные сообщения приходят через WebSocket

### 3. **Add Stream Modal**
- Красивая модалка для добавления стримов
- Автоопределение платформы (YouTube/Twitch/Kick)
- Валидация URL
- Индикатор загрузки

---

## 🔌 Как работает:

1. **При загрузке приложения:**
   - Автоматически подключается к WebSocket серверу
   - Показывает мок-данные для демо (пока нет активных стримов)

2. **Добавление стрима:**
   - Нажмите на FAB кнопку (+)
   - Вставьте URL стрима (YouTube/Twitch/Kick)
   - Автоматически подключается к backend API
   - Подписывается на WebSocket события для этого стрима

3. **Получение сообщений:**
   - Backend транслирует сообщения через WebSocket
   - Frontend обновляет список сообщений в реальном времени
   - Сообщения сохраняются по `connectionId`

4. **Удаление стрима:**
   - Наведите на карточку стрима
   - Нажмите на ✕
   - Отписывается от WebSocket
   - Отключается от backend

---

## 🌐 Environment Variables:

По умолчанию используются production URL:
- `REACT_APP_API_URL`: https://mellchat-production.up.railway.app
- `REACT_APP_WS_URL`: wss://mellchat-production.up.railway.app

Для локальной разработки создайте `.env`:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

---

## 🚀 Деплой на Vercel:

1. **Build команда:** `npm run build`
2. **Output директория:** `build`
3. **Environment Variables (добавить в Vercel):**
   - `REACT_APP_API_URL` = `https://mellchat-production.up.railway.app`
   - `REACT_APP_WS_URL` = `wss://mellchat-production.up.railway.app`

---

## 📝 TODO (следующие шаги):

- [ ] Автовставка URL из буфера обмена
- [ ] Сохранение реакций на backend
- [ ] Сохранение закладок на backend
- [ ] Push уведомления
- [ ] OAuth Google
- [ ] Облачное хранилище чатов

---

## 🧪 Тестирование:

### Локально:
```bash
cd frontend/pwa
npm start
# Откроется http://localhost:3001
```

### Проверка подключения:
1. Откройте DevTools → Console
2. Должно быть: `✅ WebSocket connected`
3. Нажмите FAB (+) и добавьте стрим
4. Сообщения должны появляться в реальном времени

---

## 🐛 Troubleshooting:

**WebSocket не подключается:**
- Проверьте что Railway backend запущен
- Проверьте CORS настройки в backend
- Проверьте URL в console.log

**Сообщения не приходят:**
- Проверьте что стрим действительно активен
- Проверьте console.log для ошибок
- Проверьте что подписка на connectionId прошла успешно

**Реакции/закладки не работают:**
- Это нормально - пока сохраняется только локально
- Backend интеграция - следующий шаг

