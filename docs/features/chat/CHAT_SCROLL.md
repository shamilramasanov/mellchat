# Логика автоскролла, счетчиков и управления стримами в MellChat

## 📋 Содержание

1. [Автоматическая прокрутка и "залипание" внизу](#автоматическая-прокрутка-и-залипание-внизу)
2. [Кнопка "Новые сообщения"](#кнопка-новые-сообщения)
3. [Счетчики непрочитанных сообщений и вопросов](#счетчики-непрочитанных-сообщений-и-вопросов)
4. [Навигация по вопросам и сообщениям](#навигация-по-вопросам-и-сообщениям)
5. [Управление стримами (сворачивание/разворачивание/закрытие)](#управление-стримами)

---

## Автоматическая прокрутка и "залипание" внизу

### 🎯 Концепция

Когда пользователь находится внизу чата и приходит новое сообщение, чат должен автоматически прокручиваться вниз, чтобы показать новое сообщение ("залипание внизу"). Если пользователь прокрутил вверх, автоматическая прокрутка останавливается.

### 📊 Ключевые состояния компонента

**Файл:** `frontend/pwa/src/features/newui/components/ChatContainer.jsx`

```javascript
const [isAtBottom, setIsAtBottom] = useState(true);        // Пользователь внизу чата?
const [userPaused, setUserPaused] = useState(false);       // Пользователь прокрутил вверх?
const userPausedRef = useRef(false);                        // Синхронный доступ к userPaused
const messagesCountRef = useRef(messages.length);          // Отслеживание новых сообщений
const isScrollingRef = useRef(false);                      // Флаг активной прокрутки
const isManualScrollRef = useRef(false);                    // Ручная прокрутка (кнопка)?
const isInitialMountRef = useRef(true);                     // Первая загрузка?
const handleScrollRef = useRef(null);                       // Ссылка на handleScroll
```

### 🔍 Определение "внизу чата"

```javascript
const threshold = 48; // пикселей
const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
```

**Порог 48px** учитывает погрешности при прокрутке и предотвращает мерцание кнопки.

### 🔄 Обработчик прокрутки (`handleScroll`)

```javascript
const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = container;
  const threshold = 48;
  const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
  
  setIsAtBottom(atBottom);
  setShowNewMessagesButton(!atBottom && newMessagesCount > 0);
  
  if (!atBottom) {
    // Пользователь НЕ внизу - ставим паузу
    userPausedRef.current = true;
    setUserPaused(true);
  } else {
    // Пользователь внизу - снимаем паузу
    userPausedRef.current = false;
    setUserPaused(false);
  }
};
```

**Ключевой момент:** `handleScroll` обновляет `userPaused` синхронно через ref для доступа в других местах кода.

### ⚡ Автоматическая прокрутка при новых сообщениях

**Алгоритм:**

1. **Проверка условий:**
   - Есть новое сообщение (`hasNewMessage`)
   - Нет поискового запроса (`!searchQuery`)
   - Не происходит уже прокрутка (`!isScrollingRef.current`)
   - Пользователь не прокрутил вверх (`!userPausedRef.current`)

2. **Проверка позиции ДО обновления DOM:**
   ```javascript
   const distanceBeforeNewMessage = currentScrollHeight - currentScrollTop - currentClientHeight;
   const wasAtBottom = distanceBeforeNewMessage < (threshold * 2); // 96px
   ```
   
   **Важно:** Когда приходит новое сообщение, `scrollHeight` увеличивается, но `scrollTop` остается на месте. Это означает, что пользователь БЫЛ внизу, но теперь "отстал". Проверяем синхронно ДО обновления DOM.

3. **Синхронная прокрутка:**
   ```javascript
   el.scrollTop = el.scrollHeight; // Сразу прокручиваем
   ```

4. **Агрессивная прокрутка с несколькими попытками:**
   ```javascript
   const forceScrollToBottom = () => {
     el.scrollTop = el.scrollHeight; // Прокручиваем всегда
     scrollAttempts++;
     
     if (distance > threshold && scrollAttempts < maxScrollAttempts) {
       requestAnimationFrame(forceScrollToBottom); // Повторяем до 5 раз
       return;
     }
     // Финальная проверка и вызов handleScroll
   };
   ```
   
   **Зачем несколько попыток?** DOM обновляется асинхронно, и одна попытка может не достичь низа.

5. **Явный вызов `handleScroll`:**
   ```javascript
   if (handleScrollRef.current) {
     handleScrollRef.current(); // Обновляем состояние после прокрутки
   }
   ```

### 🎯 Первая загрузка

При первой загрузке сообщений автоматически прокручиваем вниз:

```javascript
if (isInitialLoad) {
  el.scrollTop = el.scrollHeight;
  if (handleScrollRef.current) {
    setTimeout(() => handleScrollRef.current(), 0);
  }
  requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight;
    if (handleScrollRef.current) {
      setTimeout(() => handleScrollRef.current(), 0);
    }
  });
}
```

---

## Кнопка "Новые сообщения"

### 📍 Расположение и внешний вид

**Компонент:** `ChatContainer.jsx`

- Позиция: `bottom-16` (64px от низа), центрирование по горизонтали
- Размер: `w-10 h-10` (компактная для touch-устройств)
- Стиль: `bg-black/40`, полупрозрачная, с `backdrop-blur-sm`
- Иконка: `ChevronDown` размером `h-4 w-4`

### 🔍 Условия показа/скрытия

```javascript
showNewMessagesButton = !isAtBottom && newMessagesCount > 0
```

**Показывается когда:**
1. Пользователь НЕ внизу чата (`!isAtBottom`)
2. Есть новые непрочитанные сообщения (`newMessagesCount > 0`)

**Скрывается когда:**
1. Пользователь внизу чата (`isAtBottom === true`)
2. Нет новых сообщений (`newMessagesCount === 0`)

### 🔄 Функция прокрутки (`scrollToBottom`)

```javascript
const scrollToBottom = async (forceManual = false) => {
  const wasManual = forceManual || isManualScrollRef.current;
  
  // Снимаем паузу
  setUserPaused(false);
  userPausedRef.current = false;
  
  // Плавная прокрутка
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  
  // Ждем завершения прокрутки
  await new Promise((resolve) => {
    const checkPosition = () => {
      if (Math.abs(scrollHeight - scrollTop - clientHeight) < 10) {
        resolve();
      } else {
        requestAnimationFrame(checkPosition);
      }
    };
    checkPosition();
  });
  
  // ПРИНУДИТЕЛЬНО устанавливаем scrollTop в самый низ
  el.scrollTop = el.scrollHeight;
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Дополнительная проверка и прокрутка
  if (finalScrollHeight > finalScrollTop + finalClientHeight + 10) {
    el.scrollTop = el.scrollHeight;
  }
  
  // Вызываем handleScroll для обновления состояния
  if (handleScrollRef.current) {
    handleScrollRef.current();
  }
  
  // Помечаем только последнее НЕ-ВОПРОС сообщение как прочитанное
  if (wasManual && messages.length > 0 && onScrollToBottom) {
    let lastNonQuestionMessage = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].isQuestion) {
        lastNonQuestionMessage = messages[i];
        break;
      }
    }
    if (lastNonQuestionMessage) {
      onScrollToBottom(lastNonQuestionMessage.id);
    }
  }
};
```

**Критический момент:** При нажатии кнопки помечается как прочитанное только последнее **НЕ-ВОПРОС** сообщение. Это обновит счетчик сообщений, но не обнулит счетчик вопросов.

---

## Счетчики непрочитанных сообщений и вопросов

### 📊 Структура данных в ChatStore

**Файл:** `frontend/pwa/src/features/chat/store/chatStore.js`

```javascript
{
  messages: [],                    // Все сообщения (макс 200 на стрим)
  lastReadMessageIds: {            // Последнее прочитанное сообщение для каждого стрима
    'twitch-channelname': 'msg-id-123',
    'youtube-channel': 'msg-id-456',
  }
}
```

**Структура сообщения:**
```javascript
{
  id: 'msg-id-123',
  streamId: 'twitch-channelname',
  username: 'user123',
  text: 'Hello!',
  timestamp: 1234567890,
  isQuestion: true,  // Является ли вопросом
}
```

### 🔢 Алгоритм подсчета (`getStreamStats`)

```javascript
getStreamStats: (streamId) => {
  const streamMessages = messages.filter(m => m.streamId === streamId);
  const lastReadId = lastReadMessageIds[streamId];
  
  // Если нет lastReadId - все сообщения непрочитанные
  if (!lastReadId && streamMessages.length > 0) {
    return {
      unreadCount: streamMessages.length,
      unreadQuestionCount: streamMessages.filter(m => m.isQuestion).length,
    };
  }
  
  // Ищем с конца до lastReadId
  let unreadCount = 0;
  let unreadQuestionCount = 0;
  let foundLastRead = false;
  
  for (let i = streamMessages.length - 1; i >= 0; i--) {
    if (streamMessages[i].id === lastReadId) {
      foundLastRead = true;
      break;
    }
    unreadCount++;
    if (streamMessages[i].isQuestion) {
      unreadQuestionCount++;
    }
  }
  
  return {
    unreadCount,
    unreadQuestionCount,
  };
}
```

### 📌 Помечание как прочитанное (`markMessagesAsRead`)

```javascript
markMessagesAsRead: (streamId, lastMessageId) => {
  set(state => ({
    lastReadMessageIds: {
      ...state.lastReadMessageIds,
      [streamId]: lastMessageId,
    }
  }));
}
```

**Когда вызывается:**
1. При переключении стрима → помечается последнее сообщение текущего стрима
2. При нажатии кнопки "Новые сообщения" → помечается последнее не-вопрос сообщение
3. При навигации по вопросам/сообщениям → помечается конкретное сообщение/вопрос

### 🎯 Критический нюанс: Прокрутка ≠ Чтение

**Правило:** Простое прокручивание вниз НЕ помечает сообщения как прочитанные. Помечание происходит только при:
- Явном действии пользователя (переключение стрима, нажатие кнопки, навигация)
- НЕ при автоматической прокрутке

Это позволяет пользователю прокрутить вниз, увидеть новые сообщения, но счетчики останутся без изменений, пока пользователь не выполнит явное действие.

---

## Навигация по вопросам и сообщениям

### 🔍 Навигация по вопросам

**Методы в ChatStore:**

1. **`getFirstUnreadQuestionId(streamId)`** — находит первый непрочитанный вопрос после `lastReadId`
2. **`getNextUnreadQuestionId(streamId, currentQuestionId)`** — находит следующий непрочитанный вопрос после текущего (циклическая навигация)

**Реализация в AppNewUI:**

```javascript
const handleQuestionsClick = (streamId) => {
  const chatStore = useChatStore.getState();
  let nextQuestionId;
  
  if (!currentQuestionId) {
    // Первое нажатие - находим первый непрочитанный вопрос
    nextQuestionId = chatStore.getFirstUnreadQuestionId(streamId);
  } else {
    // Повторное нажатие - следующий вопрос
    nextQuestionId = chatStore.getNextUnreadQuestionId(streamId, currentQuestionId);
    
    // Если следующих нет - возвращаемся к первому (цикл)
    if (!nextQuestionId) {
      nextQuestionId = chatStore.getFirstUnreadQuestionId(streamId);
    }
  }
  
  if (nextQuestionId) {
    setTargetMessageId(nextQuestionId);
    setCurrentQuestionId(nextQuestionId);
    // Помечаем вопрос как прочитанный
    chatStore.markMessagesAsRead(streamId, nextQuestionId);
  }
};
```

### 📨 Навигация по сообщениям

**Методы в ChatStore:**

1. **`getLastUnreadMessageId(streamId)`** — находит последнее непрочитанное сообщение (самое новое)
2. **`getNextUnreadMessageId(streamId, currentMessageId)`** — находит следующее непрочитанное сообщение (циклическая навигация)

**Реализация в AppNewUI:**

```javascript
const handleMessagesClick = (streamId) => {
  const chatStore = useChatStore.getState();
  let nextMessageId;
  
  if (!currentMessageId) {
    // Первое нажатие - последнее непрочитанное сообщение
    nextMessageId = chatStore.getLastUnreadMessageId(streamId);
  } else {
    // Повторное нажатие - следующее сообщение
    nextMessageId = chatStore.getNextUnreadMessageId(streamId, currentMessageId);
    
    // Если следующих нет - возвращаемся к последнему (цикл)
    if (!nextMessageId) {
      nextMessageId = chatStore.getLastUnreadMessageId(streamId);
    }
  }
  
  if (nextMessageId) {
    setTargetMessageId(nextMessageId);
    setCurrentMessageId(nextMessageId);
    // Помечаем сообщение как прочитанное
    chatStore.markMessagesAsRead(streamId, nextMessageId);
  }
};
```

### 🎯 Прокрутка к целевому сообщению

```javascript
useEffect(() => {
  if (!targetMessageId) return;
  const el = messageRefs.current.get(targetMessageId);
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  // Временно ставим паузу
  userPausedRef.current = true;
  setUserPaused(true);
  
  // Через 500ms проверяем позицию и снимаем паузу, если пользователь внизу
  setTimeout(() => {
    const container = containerRef.current;
    if (container) {
      const atBottom = scrollHeight - scrollTop - clientHeight < 48;
      if (atBottom) {
        userPausedRef.current = false;
        setUserPaused(false);
      }
    }
  }, 500);
}, [targetMessageId]);
```

---

## Управление стримами

### 📂 Структура данных в StreamsStore

**Файл:** `frontend/pwa/src/features/streams/store/streamsStore.js`

```javascript
{
  activeStreams: [],           // Активные стримы (подключены к платформе)
  recentStreams: [],           // История всех стримов (включая закрытые)
  activeStreamId: null,        // ID текущего активного стрима
  collapsedStreamIds: [],      // Свернутые стримы (но все еще подключены)
  closedStreamIds: [],        // Закрытые стримы (отключены от платформы)
}
```

### 🔄 Добавление стрима (`addStream`)

**Критическая логика:** При добавлении стрима нужно удалить его из `closedStreamIds` и `collapsedStreamIds`, если он там был.

```javascript
addStream: (stream) => {
  const { activeStreams, closedStreamIds, collapsedStreamIds } = get();
  
  const exists = activeStreams.find(s => s.id === stream.id);
  if (exists) {
    // Стрим уже активен - просто устанавливаем как активный
    const updates = { activeStreamId: stream.id };
    if (closedStreamIds.includes(stream.id)) {
      updates.closedStreamIds = closedStreamIds.filter(id => id !== stream.id);
    }
    if (collapsedStreamIds.includes(stream.id)) {
      updates.collapsedStreamIds = collapsedStreamIds.filter(id => id !== stream.id);
    }
    set(updates);
  } else {
    // Новый стрим - убираем из закрытых/свернутых
    const newClosedStreamIds = closedStreamIds.filter(id => id !== stream.id);
    const newCollapsedStreamIds = collapsedStreamIds.filter(id => id !== stream.id);
    
    set({ 
      activeStreams: [...activeStreams, stream],
      activeStreamId: stream.id,
      closedStreamIds: newClosedStreamIds,
      collapsedStreamIds: newCollapsedStreamIds,
    });
  }
}
```

### 🔽 Сворачивание стрима (`toggleStreamCard`)

```javascript
toggleStreamCard: (streamId) => {
  const { collapsedStreamIds, activeStreamId } = get();
  
  if (collapsedStreamIds.includes(streamId)) {
    // Разворачиваем
    set({ collapsedStreamIds: collapsedStreamIds.filter(id => id !== streamId) });
  } else {
    // Сворачиваем
    set({ collapsedStreamIds: [...collapsedStreamIds, streamId] });
    
    // Если свернули активный стрим - переключаемся на другой
    if (activeStreamId === streamId) {
      const availableStreams = activeStreams.filter(s => 
        !collapsedStreamIds.includes(s.id) && !closedStreamIds.includes(s.id)
      );
      const newActiveId = availableStreams.length > 0 ? availableStreams[0].id : null;
      set({ activeStreamId: newActiveId });
    }
    
    // Обновляем lastViewed в recentStreams
    get().addToRecent({ ...streamToCollapse, lastViewed: new Date().toISOString() });
  }
}
```

**Важно:** Свернутый стрим остается подключенным к платформе и продолжает получать сообщения.

### 🔒 Закрытие стрима (`closeStream`)

```javascript
closeStream: async (streamId) => {
  // 1. Отключаемся от платформы через API
  await fetch('/api/v1/connect/disconnect', {
    method: 'POST',
    body: JSON.stringify({ connectionId: streamToClose.connectionId })
  });
  
  // 2. Удаляем из activeStreams
  const newActiveStreams = activeStreams.filter(s => s.id !== streamId);
  
  // 3. Добавляем в closedStreamIds
  const newClosedStreamIds = [...closedStreamIds, streamId];
  
  // 4. Обновляем recentStreams с lastViewed
  get().addToRecent({ ...streamToClose, lastViewed: new Date().toISOString() });
  
  // 5. Если закрыли активный стрим - переключаемся на другой
  if (activeStreamId === streamId) {
    const availableStreams = newActiveStreams.filter(s => 
      !collapsedStreamIds.includes(s.id) && !closedStreamIds.includes(s.id)
    );
    newActiveStreamId = availableStreams.length > 0 ? availableStreams[0].id : null;
  }
  
  set({ 
    activeStreams: newActiveStreams,
    activeStreamId: newActiveStreamId,
    closedStreamIds: newClosedStreamIds
  });
}
```

**Критический момент:** Закрытый стрим отключается от платформы и перестает получать сообщения. Он перемещается в `recentStreams` с `lastViewed` timestamp.

### 🔄 Переоткрытие стрима (`reopenStream`)

```javascript
reopenStream: async (streamId) => {
  // 1. Проверяем, что стрим закрыт
  if (!closedStreamIds.includes(streamId)) {
    return { success: false, error: 'Stream is not closed' };
  }
  
  // 2. Проверяем лимит (макс 3 активных стрима)
  if (activeStreams.length >= 3) {
    return { success: false, error: 'Maximum 3 streams allowed' };
  }
  
  // 3. Находим стрим в recentStreams
  const streamToReopen = recentStreams.find(s => s.id === streamId);
  
  // 4. Подключаемся к платформе
  const response = await streamsAPI.connect(streamToReopen.streamUrl);
  const connectionId = response?.connection?.id;
  
  // 5. Загружаем исторические сообщения из БД
  const dbMessages = await databaseAPI.getMessages(streamId);
  const normalizedMessages = dbMessages.map(msg => normalizeMessage(msg));
  normalizedMessages.forEach(msg => useChatStore.getState().addMessage(msg));
  
  // 6. Возвращаем в activeStreams и убираем из closedStreamIds
  const newActiveStreams = [...activeStreams, { ...streamToReopen, connectionId }];
  const newClosedStreamIds = closedStreamIds.filter(id => id !== streamId);
  const newCollapsedStreamIds = collapsedStreamIds.filter(id => id !== streamId);
  
  set({ 
    activeStreams: newActiveStreams,
    activeStreamId: streamId,
    closedStreamIds: newClosedStreamIds,
    collapsedStreamIds: newCollapsedStreamIds,
  });
}
```

### 👁️ Видимость активного стрима

**В AppNewUI:**

```javascript
const isActiveVisible = !!activeStreamId 
  && !collapsedStreamIds.includes(activeStreamId) 
  && !closedStreamIds.includes(activeStreamId);

const messagesForActive = isActiveVisible
  ? allMessages.filter(m => m.streamId === activeStreamId)
  : [];
```

**Правило:** Сообщения активного стрима показываются только если он не свернут и не закрыт.

---

## 🎯 Итоговые правила и принципы

### 1. Автоскролл и залипание
- ✅ Автоматическая прокрутка только если пользователь был внизу (`wasAtBottom`)
- ✅ Автоматическая прокрутка только если пользователь не прокрутил вверх (`!userPaused`)
- ✅ Несколько попыток прокрутки для надежности (до 5 раз)
- ✅ Явный вызов `handleScroll` после программной прокрутки

### 2. Счетчики
- ✅ Прокрутка ≠ Чтение (простое скроллирование не обновляет счетчики)
- ✅ Вопросы и сообщения считаются отдельно
- ✅ Помечание как прочитанное только при явных действиях пользователя

### 3. Кнопка "Новые сообщения"
- ✅ Помечает только последнее не-вопрос сообщение (не трогает счетчик вопросов)
- ✅ Плавная прокрутка с принудительной установкой в низ после завершения

### 4. Управление стримами
- ✅ При добавлении стрима удаляется из `closedStreamIds` и `collapsedStreamIds`
- ✅ Свернутый стрим продолжает получать сообщения
- ✅ Закрытый стрим отключается от платформы и перестает получать сообщения

---

## 📝 Технические детали

### Файлы реализации:

1. **ChatContainer.jsx** — логика автоскролла, кнопка "Новые сообщения", обработка прокрутки
2. **chatStore.js** — счетчики, навигация, помечание как прочитанное
3. **streamsStore.js** — управление стримами (добавление/сворачивание/закрытие)
4. **AppNewUI.jsx** — координация всех компонентов, обработка навигации

### Используемые технологии:

- **React Hooks:** `useState`, `useEffect`, `useRef`, `useCallback`
- **Zustand:** состояние для стримов и сообщений
- **React Virtual:** виртуализация длинных списков сообщений
- **requestAnimationFrame:** синхронизация с обновлениями DOM

---

*Документация актуальна на 2025-01-31*

