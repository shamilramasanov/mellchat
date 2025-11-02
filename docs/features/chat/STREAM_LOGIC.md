# Логика управления стримами в MellChat

## 🎯 Общая концепция

Управление стримами основано на **централизованном хранилище (Zustand store)** как единственном источнике истины. Локальное состояние в компонентах используется только для UI-рендеринга.

## 📊 Структура данных в Store

### Основные массивы:
```javascript
{
  activeStreams: [],        // Активные (подключенные) стримы
  recentStreams: [],        // История всех стримов
  collapsedStreamIds: [],   // ID свёрнутых стримов
  closedStreamIds: [],      // ID закрытых стримов
  activeStreamId: null      // ID текущего активного стрима
}
```

### Структура объекта стрима в store:
```javascript
{
  id: 'twitch-channelname',      // Уникальный ID (platform-streamId)
  platform: 'twitch',             // Платформа (youtube/twitch/kick)
  streamId: 'channelname',        // Имя канала/стримера
  streamUrl: 'https://...',       // URL стрима (НЕ "url"!)
  connectionId: 'uuid',           // ID подключения к WebSocket
  title: 'Stream title',          // Название стрима
  viewers: 1234,                  // Количество зрителей
  isLive: true,                   // Онлайн/офлайн
  connectedAt: '2025-10-30...',   // Время подключения
}
```

### Структура объекта стрима в UI (AppNewUI):
```javascript
{
  id: 'twitch-channelname',       // ID (такой же как в store)
  platform: 'twitch',             // Платформа
  authorName: 'channelname',      // Имя стримера (из streamId)
  url: 'https://...',             // URL (из streamUrl!)
  unreadMessages: 0,              // Счётчик непрочитанных
  unreadQuestions: 0,             // Счётчик вопросов
  isActive: true,                 // Флаг активности
  lastViewed: Date,               // Время последнего просмотра
  isOnline: true,                 // Онлайн/офлайн
}
```

**ВАЖНО:** Store использует `streamUrl`, а UI использует `url`. При синхронизации делаем маппинг!

### Состояния стрима:

1. **Активный (Active)** - стрим в `activeStreams`, НЕ в `closedStreamIds`
2. **Свёрнутый (Collapsed)** - ID в `collapsedStreamIds`, стрим остаётся подключенным
3. **Закрытый (Closed)** - ID в `closedStreamIds`, стрим отключен от платформы
4. **В истории (Recent)** - стрим в `recentStreams`, может быть в любом состоянии

## 🔄 Операции и их логика

### 1. Добавление нового стрима (`addStream`)

**Что происходит:**
```
1. Создаём объект стрима через createStreamFromURL()
2. Добавляем в activeStreams
3. Добавляем в recentStreams (если там ещё нет)
4. Устанавливаем как activeStreamId
5. Подключаемся к платформе через API
6. Обновляем connectionId после успешного подключения
```

**Результат:**
- Стрим отображается в StreamCards
- Сообщения начинают приходить через WebSocket
- Стрим становится активным (выделен)

---

### 2. Сворачивание стрима (`toggleStreamCard`)

**Что происходит:**
```
1. Вызов: handleCollapseClick(streamId)
2. Store: toggleStreamCard(streamId)
3. Проверяем, есть ли streamId в collapsedStreamIds
4. Если есть - РАЗВОРАЧИВАЕМ:
   - Удаляем из collapsedStreamIds
5. Если нет - СВОРАЧИВАЕМ:
   - Добавляем в collapsedStreamIds
   - Если это activeStreamId - переключаемся на первый доступный стрим
```

**Важно:**
- ✅ Стрим остаётся в `activeStreams`
- ✅ WebSocket подписка остаётся активной
- ✅ Сообщения продолжают приходить
- ✅ Счётчики непрочитанных обновляются
- ❌ Стрим НЕ отображается в `StreamCards`

**UI реакция:**
- `StreamCards` фильтрует: `!collapsedStreamIds.includes(id) && !closedStreamIds.includes(id)`
- Карточка исчезает, но стрим "живой"
- В истории показывается как "Активный" (не "Закрытый")

---

### 3. Закрытие стрима (`closeStream`)

**Что происходит:**
```
1. Вызов: handleCloseStream(streamId)
2. Store: closeStream(streamId)
3. Находим стрим в activeStreams по connectionId
4. Отключаемся от платформы (API: /api/v1/connect/disconnect)
5. Добавляем streamId в closedStreamIds
6. Удаляем стрим из activeStreams
7. Если это activeStreamId - переключаемся на первый доступный стрим
8. Стрим остаётся в recentStreams (для истории)
9. StreamSubscriptionManager отписывается от WebSocket
```

**Важно:**
- ✅ Стрим удаляется из `activeStreams`
- ✅ WebSocket подписка АВТОМАТИЧЕСКИ отменяется (через useEffect cleanup)
- ✅ Сообщения ПЕРЕСТАЮТ приходить
- ✅ Стрим остаётся в `recentStreams` (раздел "Недавно закрытые")
- ❌ Стрим НЕ отображается в `StreamCards`

**UI реакция:**
- `StreamCards` фильтрует: `!closedStreamIds.includes(id)`
- Стрим переходит в "Недавно закрытые" в `RecentStreamsScreen`
- `StreamSubscriptionManager` перестаёт слушать сообщения

**Критично:**
`StreamSubscriptionManager` подписывается ТОЛЬКО на `activeStreams`, НЕ на `recentStreams`! Это гарантирует, что закрытые стримы не получают сообщения.

---

### 4. Открытие стрима из истории (`onStreamSelect`)

**Сценарий A: Стрим активен (возможно свёрнут)**
```
1. Проверяем: const stream = activeStreams.find(s => s.id === id)
2. Если найден в activeStreams:
   - Устанавливаем setActiveStreamId(id)
   - Если в collapsedStreamIds:
     → Вызываем toggleStreamCard(id) для разворачивания
   - Переходим на экран 'main'
```

**Сценарий B: Стрим закрыт**
```
1. Проверяем: closedStreamIds.includes(id)
2. Если закрыт:
   - Вызываем reopenStream(id)
   - Store делает:
     * Проверяет лимит (макс 3 стрима)
     * Находит стрим в recentStreams
     * Подключается к платформе заново (API: /api/v1/connect)
     * Получает новый connectionId
     * Добавляет в activeStreams
     * Удаляет из closedStreamIds
     * Устанавливает как activeStreamId
   - Если успешно: setActiveStreamId(id)
   - Переходим на экран 'main'
```

**Сценарий C: Стрим не найден**
```
1. Стрим НЕ в activeStreams И НЕ в closedStreamIds
2. Логируем warning (странная ситуация)
3. Возможно стрим был удалён из recentStreams
```

**Важно:**
- Различаем "свёрнутый" (collapsed) и "закрытый" (closed)
- Свёрнутый просто разворачиваем (мгновенно)
- Закрытый переподключаем заново (async операция)

---

### 5. Переключение между стримами (`switchStream`)

**Что происходит:**
```
1. Устанавливаем новый activeStreamId в store
2. Обновляем lastViewed для нового активного стрима
3. UI автоматически перерендеривается
```

**UI реакция:**
- `StreamCard` активного стрима получает подсветку
- `ChatContainer` показывает сообщения нового стрима
- Счётчики "непрочитанных" обнуляются

---

## 🎨 UI компоненты и их роль

### `AppNewUI.jsx` (Оркестратор)
```javascript
// Читает из store:
- collapsedStreamIds  // Для фильтрации
- closedStreamIds     // Для фильтрации
- activeStreamId      // Для выделения

// Локальный state:
- streams[]          // Копия activeStreams для рендера
- messages[]         // Сообщения (дублирует chatStore)

// Подписывается на store:
useEffect(() => {
  useStreamsStore.subscribe((state) => {
    // Синхронизирует streams[] с activeStreams
  })
}, [])
```

### `StreamCards.jsx` (Отображение карточек)
```javascript
const collapsedStreamIds = useStreamsStore(s => s.collapsedStreamIds);
const closedStreamIds = useStreamsStore(s => s.closedStreamIds);

const visibleStreams = streams.filter(s => 
  !collapsedStreamIds.includes(s.id) && 
  !closedStreamIds.includes(s.id)
);
```

### `RecentStreamsScreen.jsx` (История)
```javascript
// Отображает ВСЕ стримы из recentStreams
// Разделяет на:
- Активные (в activeStreams, не в closedStreamIds)
- Закрытые (в closedStreamIds)

// При клике на стрим:
- Активный → разворачивает и переключает
- Закрытый → переподключает заново
```

---

## 🔍 Диаграмма состояний стрима

```
┌─────────────────────────────────────────────────────────────┐
│                         NEW STREAM                          │
│                     (добавление по URL)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   ACTIVE    │◄──────────────┐
                  │  (видимый)  │               │
                  └──────┬──────┘               │
                         │                      │
           ┌─────────────┼─────────────┐       │
           │             │             │       │
           │ collapse    │ close       │ expand
           │             │             │       │
           ▼             ▼             │       │
    ┌──────────┐  ┌──────────┐        │       │
    │COLLAPSED │  │  CLOSED  │        │       │
    │(скрытый) │  │(отключен)│        │       │
    └────┬─────┘  └────┬─────┘        │       │
         │             │              │       │
         │ expand      │ reopen       │       │
         │             │              │       │
         └─────────────┴──────────────┴───────┘
```

---

## ⚠️ Важные правила

### ❌ НЕЛЬЗЯ:
1. Хранить `isCollapsed` или `isClosed` в локальном state компонента
2. Дублировать логику сворачивания/закрытия в компонентах
3. Изменять `collapsedStreamIds`/`closedStreamIds` напрямую
4. Использовать условные хуки (if с useMemo/useCallback)

### ✅ НУЖНО:
1. Всегда вызывать методы store для изменения состояния
2. Читать `collapsedStreamIds`/`closedStreamIds` из store через хуки
3. Синхронизировать локальный state через `useEffect` с подпиской
4. Фильтровать видимые стримы на уровне UI, а не данных

---

## 🐛 Типичные проблемы и решения

### Проблема: "Стрим закрылся, но сообщения продолжают приходить"
**Причина:** `StreamSubscriptionManager` подписывается на `recentStreams` вместо только `activeStreams`  
**Решение:** Подписка ТОЛЬКО на `activeStreams`, в cleanup отписываемся от всех connectionIds

### Проблема: "Карточки стримов не отображаются"
**Причина:** Несоответствие полей `streamUrl` (store) и `url` (UI)  
**Решение:** При синхронизации маппить `url: stream.streamUrl || stream.url`

### Проблема: "Стрим в store, но не показывается в UI"
**Причина:** Фильтр в восстановлении проверяет `stream.url`, но в store это `stream.streamUrl`  
**Решение:** Проверять оба поля: `stream.streamId && (stream.url || stream.streamUrl)`

### Проблема: "Ошибка хуков React (Rendered more hooks)"
**Причина:** Условный вызов внутри `useMemo`: `useMemo(() => (func ? func() : {}), [])`  
**Решение:** Использовать `if` внутри: `useMemo(() => { if (!func) return {}; return func(); }, [])`

### Проблема: "activeStreamId сбрасывается в null"
**Причина:** `activeStreamId` в зависимостях `useEffect` вызывает переподписку  
**Решение:** Убрать `activeStreamId` из dependencies синхронизации

### Проблема: "Invalid URL: twitch.tv/channel"
**Причина:** Regex паттерны требуют `https://` в начале  
**Решение:** Использовать `normalizeStreamUrl()` для добавления `https://` автоматически

---

## 📝 Пример полного флоу

### Пользователь добавляет стрим:
```
1. Вводит URL в AddStreamModal
2. → handleAddStream()
3. → createStreamFromURL() создаёт объект
4. → addStreamToStore() добавляет в store
5. → streamsAPI.connect() подключается к платформе
6. → WebSocket начинает получать сообщения
7. → Store триггерит подписчиков
8. → AppNewUI синхронизирует локальный state
9. → StreamCards рендерит новую карточку
```

### Пользователь сворачивает стрим:
```
1. Кликает на кнопку сворачивания
2. → handleCollapseClick()
3. → toggleStreamCard() в store
4. → ID добавляется в collapsedStreamIds
5. → Store триггерит подписчиков
6. → StreamCards перерендеривается
7. → Фильтр !collapsedStreamIds.includes() скрывает карточку
```

### Пользователь открывает стрим из истории:
```
1. Переходит в RecentStreamsScreen
2. Кликает на стрим
3. → onStreamSelect(id)
4. → Проверка: стрим в activeStreams?
5a. Да, свёрнут → toggleStreamCard() + setActiveStreamId()
5b. Нет, закрыт → addStream() (переподключение)
6. → Переход на экран 'main'
7. → Стрим отображается в StreamCards
```

---

## 🎯 Итого: Single Source of Truth

```
┌──────────────────────────────────────────────────────────────────┐
│                 ZUSTAND STORE (Single Source)                    │
│                                                                  │
│  activeStreams[]       ← Какие стримы подключены (макс 3)       │
│  recentStreams[]       ← История всех стримов                   │
│  collapsedStreamIds[]  ← Какие стримы свёрнуты                  │
│  closedStreamIds[]     ← Какие стримы закрыты                   │
│  activeStreamId        ← Какой стрим активен                    │
│                                                                  │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     │ subscribe()
                     │
        ┌────────────┼────────────────────┐
        │            │                    │
        ▼            ▼                    ▼
┌───────────────┐ ┌────────────────┐ ┌──────────────────────┐
│   AppNewUI    │ │  StreamCards   │ │ SubscriptionManager  │
│               │ │                │ │                      │
│ - streams[]   │ │ Фильтрует по:  │ │ Подписывается ТОЛЬКО │
│ - activeId    │ │ !collapsed &&  │ │ на activeStreams     │
│               │ │ !closed        │ │ (НЕ recentStreams!)  │
└───────────────┘ └────────────────┘ └──────────────────────┘
```

**Золотое правило:** 
1. Store управляет состоянием
2. Компоненты только читают и отображают
3. WebSocket подписки ТОЛЬКО на activeStreams
4. При синхронизации: `streamUrl` → `url`, `streamId` → `authorName`

