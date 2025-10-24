# MellChat v2.0 - UI/UX Documentation

## 📋 Содержание
1. [О проекте MellChat](#о-проекте-mellchat)
2. [Как это работает](#как-это-работает)
3. [Общий обзор](#общий-обзор)
4. [Liquid Glass Effect - Техническая реализация](#liquid-glass-effect---техническая-реализация)
5. [Цветовая схема](#цветовая-схема)
6. [Типографика](#типографика)
7. [Компоненты](#компоненты)
8. [Internationalization (i18n)](#internationalization-i18n)
9. [Экраны](#экраны)
10. [Взаимодействие](#взаимодействие)
11. [Адаптивность](#адаптивность)
12. [Performance](#performance)
13. [Accessibility](#accessibility)
14. [Технические детали](#технические-детали)

---

## 🚀 О проекте MellChat

### Что это?
**MellChat** — это современное Progressive Web Application (PWA) для агрегации и управления чатами с множественных стриминговых платформ в режиме реального времени.

### 🎯 Миссия
Упростить работу стримерам и модераторам, предоставив **единый интерфейс** для одновременного мониторинга чатов с YouTube, Twitch и Kick. Больше никаких переключений между вкладками, никаких упущенных вопросов от зрителей, никакого хаоса.

### 👥 Для кого?
- **Стримеры**: Которые ведут трансляции на нескольких платформах одновременно (мультистриминг)
- **Модераторы**: Которым нужно отслеживать чат на всех каналах
- **Контент-мейкеры**: Которые хотят анализировать вопросы аудитории и важные сообщения
- **Зрители**: Которые хотят следить за несколькими стримами одновременно

### 💡 Решаемая проблема
При мультистриминге (трансляция одновременно на YouTube, Twitch, Kick) стример не может физически следить за всеми чатами. Это приводит к:
- ❌ Упущенным вопросам от зрителей
- ❌ Невозможности модерации всех чатов
- ❌ Потере вовлеченности аудитории
- ❌ Хаосу из открытых вкладок и окон

**MellChat решает это**, объединяя все чаты в одном месте с умными фильтрами и инструментами модерации.

---

## 🏗️ Как это работает

### Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (PWA)                        │
│  React.js + WebSocket + i18n + Service Workers              │
└────────────────────┬────────────────────────────────────────┘
                     │ WebSocket (WSS)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (API Gateway)                     │
│     Node.js + Express + Socket.io + Passport OAuth          │
└────────┬────────────────────┬─────────────────┬─────────────┘
         │                    │                 │
         ↓                    ↓                 ↓
    ┌────────┐          ┌─────────┐       ┌─────────┐
    │YouTube │          │ Twitch  │       │  Kick   │
    │  API   │          │   API   │       │   API   │
    └────────┘          └─────────┘       └─────────┘
```

### Процесс работы

1. **Подключение стрима**
   - Пользователь вставляет URL стрима (YouTube/Twitch/Kick)
   - Backend определяет платформу и извлекает ID канала
   - Устанавливается WebSocket соединение с платформой

2. **Получение сообщений**
   - Backend подписывается на события чата через API платформы
   - Сообщения нормализуются в единый формат
   - Через WebSocket передаются в frontend в реальном времени

3. **Обработка и отображение**
   - Frontend получает сообщения через Socket.io
   - Применяются активные фильтры и настройки
   - Сообщения отображаются с анимациями и поддержкой эмодзи
   - Автоматическое определение вопросов (содержат "?")

4. **Интерактивность**
   - Пользователь может лайкать, дизлайкать, сохранять сообщения
   - Фильтровать по типу (все, вопросы, закладки, спам)
   - Искать по никнейму или тексту сообщения
   - Переключаться между активными стримами

### 🔑 Ключевые возможности

#### 1. Мультиплатформенность
- ✅ YouTube Live Chat
- ✅ Twitch Chat
- ✅ Kick Chat
- 🎯 Все чаты в одном окне

#### 2. Умные фильтры
- 📝 **All**: Все сообщения
- ❓ **Questions**: Автоматическое определение вопросов
- 🔖 **Bookmarks**: Сохраненные сообщения
- 🌐 **All Questions**: Вопросы со всех стримов сразу
- 🚫 **Spam**: Детекция спама по рейтингу

#### 3. Сортировка
- 🕒 По времени
- 🔥 По популярности (лайки)
- 💬 По активности

#### 4. Мультиязычность
- 🇺🇸 English
- 🇷🇺 Русский
- 🇺🇦 Українська
- Auto-detection языка браузера

#### 5. PWA функции
- 📱 Устанавливается как нативное приложение
- 🔄 Работает офлайн (Service Workers)
- ⚡ Мгновенная загрузка
- 🌙 Оптимизировано для iOS Safari

#### 6. Расширенные настройки
- 🎨 Размер шрифта (4 варианта)
- 📏 Плотность отображения (3 варианта)
- 🔄 Автопрокрутка с настраиваемой задержкой
- 🌈 Цвета никнеймов (3 режима)
- 🔔 Уведомления (селективные)
- 📦 Хранение истории (1-365 дней)

#### 7. Эмодзи поддержка
- BTTV (BetterTTV) - 65+ эмодзи
- FFZ (FrankerFaceZ)
- 7TV
- Twitch native emotes
- Отображаются в реальном времени

### 🔐 Безопасность
- OAuth 2.0 авторизация через Google
- JWT токены для сессий
- Rate limiting для защиты от спама
- HTTPS/WSS шифрование
- CORS защита

### 📊 Производительность
- **WebSocket** для real-time коммуникации (низкая латентность)
- **Redis** для кеширования эмодзи и сессий
- **GPU ускорение** для анимаций (backdrop-filter, transform)
- **Debounce** для поиска и оптимизации
- **useMemo/useCallback** для оптимизации React

---

## 🎨 Общий обзор

### Дизайн-система: Liquid Glass
**Концепция**: Современный glassmorphism дизайн с эффектом "жидкого стекла", сочетающий прозрачность, размытие и яркие градиенты.

### Ключевые характеристики:
- 🌊 **Liquid Glass эффекты**: backdrop-filter, размытие 24px
- 🎨 **Градиенты**: Cyan → Purple → Pink
- ✨ **Анимации**: Плавные переходы 250ms cubic-bezier
- 🌙 **Темная тема**: Глубокий темно-синий фон (#0f0f23)
- 💫 **Glow эффекты**: Свечение вокруг активных элементов

---

## 🔬 Liquid Glass Effect - Техническая реализация

### Введение
Дизайн MellChat вдохновлен [современным Liquid Glass эффектом](https://github.com/callstack/liquid-glass), популярным в iOS 18+. Хотя оригинальная библиотека создана для React Native, мы реализовали веб-эквивалент используя CSS `backdrop-filter` и современные техники glassmorphism.

### 🎯 Что такое Liquid Glass?

**Liquid Glass** — это визуальный эффект, создающий иллюзию полупрозрачного, размытого стекла, которое "плавает" над контентом. Эффект включает:

1. **Размытие фона** (backdrop blur)
2. **Полупрозрачность** (transparency)
3. **Светлые границы** (frosted edges)
4. **Динамическая адаптация** к контенту сзади
5. **Мягкие тени** (soft shadows)

### 📐 Базовая реализация в CSS

#### Минимальный Glass эффект:
```css
.glass-element {
  /* Полупрозрачный фон */
  background: rgba(255, 255, 255, 0.1);
  
  /* Размытие фона - ключевое свойство! */
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px); /* Safari */
  
  /* Светлая граница для эффекта "инея" */
  border: 1px solid rgba(255, 255, 255, 0.18);
  
  /* Скругленные углы */
  border-radius: 12px;
  
  /* Мягкая тень */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

#### Продвинутый Glass с градиентами:
```css
.glass-element-advanced {
  /* Градиентный фон для глубины */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  
  /* Многослойное размытие */
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  
  /* Градиентная граница */
  border: 1px solid;
  border-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.3),
    rgba(255, 255, 255, 0.1)
  ) 1;
  
  /* Внутреннее свечение */
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### 🎨 Варианты Glass Effect

#### 1. Clear Glass (прозрачное стекло)
```css
.glass-clear {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```
**Использование**: Легкие overlay, tooltips, dropdown меню

#### 2. Regular Glass (стандартное стекло)
```css
.glass-regular {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
```
**Использование**: Карточки, модальные окна, панели

#### 3. Frosted Glass (матовое стекло)
```css
.glass-frosted {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(48px) brightness(1.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
}
```
**Использование**: Главные элементы, hero секции, header

### 💡 Интерактивные Glass элементы

#### Hover эффект:
```css
.glass-interactive {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.glass-interactive:hover {
  /* Увеличение прозрачности */
  background: rgba(255, 255, 255, 0.15);
  
  /* Больше размытия */
  backdrop-filter: blur(32px) saturate(180%);
  
  /* Ярче граница */
  border-color: rgba(255, 255, 255, 0.3);
  
  /* Сильнее тень */
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
  
  /* Подъем */
  transform: translateY(-2px);
}
```

#### Active (pressed) эффект:
```css
.glass-interactive:active {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  transform: translateY(0) scale(0.98);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
```

### 🌈 Tinted Glass (цветное стекло)

#### Cyan tint:
```css
.glass-cyan {
  background: rgba(76, 201, 240, 0.1);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(76, 201, 240, 0.2);
  box-shadow: 0 8px 32px rgba(76, 201, 240, 0.15);
}
```

#### Purple tint:
```css
.glass-purple {
  background: rgba(114, 9, 183, 0.1);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(114, 9, 183, 0.2);
  box-shadow: 0 8px 32px rgba(114, 9, 183, 0.15);
}
```

### 🔄 Анимированный Glass

#### Появление (materialization):
```css
@keyframes glass-appear {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(24px);
    transform: scale(1);
  }
}

.glass-animated {
  animation: glass-appear 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Пульсация (pulsing glow):
```css
@keyframes glass-pulse {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(76, 201, 240, 0.2);
    border-color: rgba(255, 255, 255, 0.18);
  }
  50% {
    box-shadow: 0 8px 48px rgba(76, 201, 240, 0.4);
    border-color: rgba(76, 201, 240, 0.3);
  }
}

.glass-pulse {
  animation: glass-pulse 2s ease-in-out infinite;
}
```

### 🎯 Практические примеры из MellChat

#### 1. Glass Card (карточки стримов):
```css
.stream-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 1rem;
  transition: all 250ms ease;
}

.stream-card:hover {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}
```

#### 2. Glass Modal (модальные окна):
```css
.modal-glass {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(48px) saturate(180%);
  -webkit-backdrop-filter: blur(48px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 24px 64px rgba(0, 0, 0, 0.5);
}
```

#### 3. Glass Header:
```css
.header-glass {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
```

### ⚠️ Важные соображения

#### Browser Support:
```css
/* Проверка поддержки */
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .glass {
    backdrop-filter: blur(24px);
  }
}

/* Fallback для старых браузеров */
@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: rgba(255, 255, 255, 0.3);
    /* Более непрозрачный фон вместо размытия */
  }
}
```

#### Performance оптимизация:
```css
.glass-optimized {
  /* GPU ускорение */
  will-change: backdrop-filter, transform;
  transform: translateZ(0);
  
  /* Contain для изоляции */
  contain: layout style paint;
  
  /* Размытие */
  backdrop-filter: blur(24px);
}
```

#### iOS Safari специфика:
```css
.glass-ios {
  /* Safari требует -webkit- префикс */
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
  
  /* Предотвращение мерцания */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}
```

### 📊 Сравнение с React Native Liquid Glass

| Свойство | React Native | Web (CSS) |
|----------|--------------|-----------|
| Размытие | Native UIVisualEffectView | `backdrop-filter: blur()` |
| Прозрачность | Native API | `rgba()` |
| Интерактивность | Touch handlers | `:hover`, `:active` |
| Анимации | Animated API | CSS transitions/animations |
| Performance | Native 60fps | GPU accelerated |
| Tint Colors | `tintColor` prop | `background` с цветом |
| Color Scheme | Автоматическая адаптация | `@media (prefers-color-scheme)` |

### 🎨 Рекомендации по использованию

#### DO ✅
- Используйте на контрастных фонах
- Комбинируйте с тенями для глубины
- Добавляйте тонкие границы
- GPU ускорение для анимаций
- Fallback для старых браузеров

#### DON'T ❌
- Не злоупотребляйте размытием (макс 48px)
- Избегайте на белом фоне
- Не накладывайте много слоев glass
- Не используйте без границ
- Избегайте на текстовых блоках

### 🔗 Полезные ресурсы
- [Callstack Liquid Glass](https://github.com/callstack/liquid-glass) - React Native реализация
- [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [Can I Use backdrop-filter](https://caniuse.com/css-backdrop-filter)

---

## 🎨 Цветовая схема

### Основные цвета

#### Фоновые цвета
```css
--bg-primary: #0f0f23        /* Основной темный фон */
--bg-secondary: #1a1a2e      /* Вторичный фон */
--bg-gradient: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)
```

#### Glass эффекты
```css
--glass-white: rgba(255, 255, 255, 0.1)         /* Прозрачное стекло */
--glass-white-hover: rgba(255, 255, 255, 0.15)  /* При наведении */
--glass-border: rgba(255, 255, 255, 0.18)       /* Границы стекла */
```

#### Акцентные цвета
```css
--accent-blue: #4CC9F0      /* Голубой (основной) */
--accent-purple: #7209B7    /* Фиолетовый */
--accent-pink: #F72585      /* Розовый */
--accent-green: #4361EE     /* Зеленый */
--accent-cyan: #00D9FF      /* Циан */
```

#### Градиенты
```css
--gradient-primary: linear-gradient(135deg, #4CC9F0 0%, #7209B7 100%)
--gradient-secondary: linear-gradient(135deg, #F72585 0%, #7209B7 100%)
--gradient-success: linear-gradient(135deg, #4361EE 0%, #4CC9F0 100%)
```

#### Текстовые цвета
```css
--text-primary: #ffffff              /* Основной текст (белый) */
--text-secondary: rgba(255, 255, 255, 0.7)  /* Вторичный текст */
--text-tertiary: rgba(255, 255, 255, 0.5)   /* Третичный текст */
```

### Семантические цвета
- 🟢 **Success**: #10B981 (зеленый)
- 🔴 **Error**: #EF4444 (красный)
- 🟡 **Warning**: #F59E0B (оранжевый)
- 🔵 **Info**: #3B82F6 (синий)

---

## 📝 Типографика

### Шрифт
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', sans-serif
```

### Размеры шрифтов
```css
--font-size-xs: 0.75rem    /* 12px - метки, timestamps */
--font-size-sm: 0.875rem   /* 14px - вторичный текст */
--font-size-base: 1rem     /* 16px - основной текст */
--font-size-lg: 1.125rem   /* 18px - подзаголовки */
--font-size-xl: 1.25rem    /* 20px - заголовки H3 */
--font-size-2xl: 1.5rem    /* 24px - заголовки H2 */
--font-size-3xl: 2rem      /* 32px - главные заголовки */
```

### Начертания
- **Regular**: 400 (основной текст)
- **Medium**: 500 (кнопки, важные элементы)
- **Semibold**: 600 (подзаголовки)
- **Bold**: 700 (заголовки, акценты)

---

## 🧩 Компоненты

### 1. Header (Шапка приложения)

#### Структура
```
┌─────────────────────────────────────────────────────────┐
│  MellChat v2.0    [●] Online    [👤] [⚙️]              │
└─────────────────────────────────────────────────────────┘
```

#### Элементы:
- **Логотип**: Gradient текст (cyan → purple), clickable
- **Connection Status**: Индикатор подключения (зеленый/красный)
- **Profile Button**: Иконка профиля пользователя
- **Settings Button**: Иконка настроек (⚙️)

#### Стили:
```css
height: auto (flex: 0 0 auto)
padding: 1rem 1.5rem
background: rgba(15, 15, 35, 0.95)
backdrop-filter: blur(20px)
border-bottom: 1px solid rgba(255, 255, 255, 0.1)
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3)
```

---

### 2. StreamCards (Карточки стримов)

#### Визуальный вид
```
┌────────┐  ┌────────┐  ┌────────┐
│ [✕]    │  │ [✕]    │  │ [✕]    │
│ 🎮 YT  │  │ 🎮 TW  │  │ 🎮 KK  │
│ Title  │  │ Title  │  │ Title  │
│ 💬 123 │  │ 💬 456 │  │ 💬 789 │
│ 🔴LIVE │  │ 🔴LIVE │  │ 🔴LIVE │
└────────┘  └────────┘  └────────┘
```

#### Характеристики:
- **Размер**: min-width: 140px, max-width: 180px
- **Горизонтальная прокрутка**: Swipe на мобильных
- **Активная карточка**: Gradient border + glow эффект
- **Платформы**: YouTube (красный), Twitch (фиолетовый), Kick (зеленый)

#### Интерактивность:
- Click → Переключение активного стрима
- Close button (✕) → Закрытие стрима
- Swipe left/right → Навигация между стримами

---

### 3. ChatContainer (Контейнер сообщений)

#### Архитектура
```
┌─────────────────────────────────────┐
│  [Sort: 🕒 Time | 🔥 Popular]       │ ← Sort Panel (только для Questions)
├─────────────────────────────────────┤
│  [🗑️ Clear]                          │ ← Header Actions
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ username        2 min ago   │   │
│  │ Message text here...        │   │
│  │ 👍 5  👎 1  🔖  📋          │   │
│  └─────────────────────────────┘   │
│                                     │ ← Scrollable Area
│  ┌─────────────────────────────┐   │
│  │ username2       5 min ago   │   │
│  │ Another message?            │   │
│  │ 👍 12  👎 0  🔖  📋         │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│ [All] [❓Questions] [🔖Bookmarks]  │ ← Filters (fixed)
│ [🌐All Questions] [🚫Spam]         │
│ 🔍 [Search messages...]            │ ← Search (fixed)
└─────────────────────────────────────┘
```

#### Message Card (Карточка сообщения)

**Полная структура:**
```
┌──────────────────────────────────────────────┐
│ username                    2 minutes ago    │ ← Header
│ [🎮 Twitch]                                  │ ← Platform badge
├──────────────────────────────────────────────┤
│ This is the message text content. Can be    │ ← Body
│ multiline and contain emojis 🎉              │
├──────────────────────────────────────────────┤
│ 👍 12  👎 2  🔖 Bookmark  📋 Copy           │ ← Actions
└──────────────────────────────────────────────┘
```

**Детали элементов:**

1. **Username** (никнейм автора)
   - Цвет зависит от настройки `nicknameColors`:
     - Random: случайный цвет (хеш от username)
     - Platform: цвет платформы
     - Mono: белый
   - Font-weight: 600 (semibold)
   - Clickable (может быть связан с профилем)

2. **Timestamp** (время отправки)
   - Формат: "X minutes/hours ago" или "just now"
   - Цвет: rgba(255, 255, 255, 0.5)
   - Font-size: 0.75rem (12px)
   - Обновляется реактивно

3. **Platform Badge** (бейдж платформы)
   - YouTube: 📺 + красная граница
   - Twitch: 🎮 + фиолетовая граница
   - Kick: ⚡ + зеленая граница
   - Опциональный (может скрываться в настройках)

4. **Message Text** (текст сообщения)
   - Поддержка эмодзи (BTTV, FFZ, 7TV, Twitch)
   - Автоматическое определение вопросов (содержит "?")
   - Font-size: зависит от настройки `fontSize`
   - Padding: зависит от настройки `density`

5. **Actions** (действия с сообщением)
   - 👍 **Like**: увеличивает счетчик, подсвечивает
   - 👎 **Dislike**: уменьшает счетчик (для спам-фильтра)
   - 🔖 **Bookmark**: добавляет в закладки
   - 📋 **Copy**: копирует текст в clipboard
   - Hover эффект: scale(1.1) + glow

**Стили карточки:**
```css
background: rgba(255, 255, 255, 0.05)
backdrop-filter: blur(12px)
border: 1px solid rgba(255, 255, 255, 0.1)
border-radius: 12px
padding: var(--spacing-md) /* зависит от density */
margin-bottom: var(--spacing-sm)
transition: all 250ms ease
```

**Анимация появления:**
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: slideUp 0.3s ease-out
```

#### Особенности прокрутки:
- ✅ **Верх и низ ФИКСИРОВАНЫ** (header, filters, search)
- ✅ **Только список сообщений скроллится**
- ✅ **Auto-scroll**: Автоматическая прокрутка к новым сообщениям

---

### 4. Filters & Search (Фильтры и поиск)

#### Фильтры сообщений:

**Основные фильтры:**
```
[All*] [❓Questions] [🔖Bookmarks] [🌐All Questions] [🚫Spam]
```

1. **All** (Все сообщения)
   - Показывает все сообщения из активного стрима
   - По умолчанию активен
   - Иконка: нет

2. **Questions** (Вопросы)
   - Фильтрует сообщения содержащие "?"
   - Включает sort панель (Time/Popular/Active)
   - Иконка: ❓
   - **Sort опции:**
     - 🕒 Time: по времени (новые сверху)
     - 🔥 Popular: по лайкам (больше лайков сверху)
     - 💬 Active: по активности (больше ответов сверху)

3. **Bookmarks** (Закладки)
   - Показывает только сохраненные сообщения
   - Хранятся в localStorage
   - Иконка: 🔖

4. **All Questions** (Все вопросы)
   - Вопросы со ВСЕХ активных стримов
   - Мультиплатформенный вид
   - Иконка: 🌐

5. **Spam** (Спам)
   - Сообщения с негативным рейтингом (дизлайки > лайки)
   - Для модерации
   - Иконка: 🚫

**Визуальные характеристики фильтров:**
```css
/* Неактивный */
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
color: rgba(255, 255, 255, 0.7)

/* Активный */
background: linear-gradient(135deg, #4CC9F0, #7209B7)
border: none
color: white
box-shadow: 0 4px 12px rgba(76, 201, 240, 0.3)
```

**Горизонтальная прокрутка:**
- Свайпится горизонтально на мобильных
- `touch-action: pan-x`
- `-webkit-overflow-scrolling: touch`
- Скрытый scrollbar

#### Поиск:

**Внешний вид:**
```
┌────────────────────────────────────┐
│ 🔍 Search by username or message...│
└────────────────────────────────────┘
```

**Функциональность:**
- **Real-time поиск**: С debounce 300ms
- **Ищет в**:
  - Username (никнейм)
  - Message text (текст сообщения)
- **Case-insensitive**: Не чувствителен к регистру
- **Подсветка**: Найденные совпадения подсвечиваются
- **Keyboard shortcut**: Ctrl/Cmd + K для фокуса

**Стили:**
```css
background: rgba(255, 255, 255, 0.08)
border: 1px solid rgba(255, 255, 255, 0.15)
border-radius: 24px
padding: 0.75rem 1rem
color: white

/* Focus */
border-color: #4CC9F0
box-shadow: 0 0 0 3px rgba(76, 201, 240, 0.2)
```

---

### 5. WebSocket Connection Status (Статус подключения)

#### Индикатор в Header:

**Онлайн:**
```
[●] Online
```
- Цвет индикатора: #10B981 (зеленый)
- Пульсирующая анимация
- Текст: "Online" / "Онлайн" / "Онлайн"

**Оффлайн / Переподключение:**
```
[●] Reconnecting...
```
- Цвет индикатора: #EF4444 (красный)
- Вращающаяся анимация
- Текст: "Reconnecting..." / "Переподключение..." / "Перепідключення..."

**Подключено к стриму:**
```
[●] Connected
```
- Цвет индикатора: #3B82F6 (синий)
- Статичный
- Текст: "Connected" / "Подключено" / "Підключено"

#### Детали WebSocket:

**URL подключения:**
```javascript
const WS_URL = process.env.REACT_APP_WS_URL || 'wss://mellchat-production.up.railway.app'
```

**События:**
- `connect`: Успешное подключение
- `disconnect`: Потеря соединения
- `message`: Новое сообщение чата
- `stream:connected`: Подключение к стриму
- `stream:disconnected`: Отключение от стрима
- `error`: Ошибка подключения

**Auto-reconnect:**
- Автоматическое переподключение при потере связи
- Экспоненциальная задержка: 1s, 2s, 4s, 8s, 16s (max)
- Восстановление состояния после переподключения

**Визуальная обратная связь:**
- Toast уведомления при подключении/отключении
- Изменение цвета индикатора
- Анимация статуса
- Блокировка действий при отсутствии соединения
- "New Messages" badge при появлении новых сообщений

---

#### Стили:
```css
background: rgba(255, 255, 255, 0.1)
backdrop-filter: blur(24px)
border: 1px solid rgba(255, 255, 255, 0.18)
border-radius: 12px
padding: 1rem
animation: slideUp 0.3s ease-out
```

#### Интерактивные элементы:
- **👍/👎**: Реакции на сообщение (toggle)
- **🔖**: Добавить в закладки
- **📋**: Копировать текст сообщения

#### Цвет никнейма:
- Рандомные яркие цвета
- Glow эффект вокруг текста
- Пример: `color: #7FFF7F; text-shadow: 0 0 8px rgba(127, 255, 127, 0.3)`

---

### 5. Filters Panel (Панель фильтров)

#### Внешний вид
```
┌──────┬──────────┬────────────────┬────────────┬────────┐
│  All │ ❓Quest  │ 🌐 All Quest   │ 🔖 Bookm   │ 🚫Spam │
│ (25) │  (5)     │     (12)       │   (3)      │  (1)   │
└──────┴──────────┴────────────────┴────────────┴────────┘
```

#### Состояния кнопки:
- **Неактивная**: `background: rgba(255, 255, 255, 0.1)`
- **Hover**: `background: rgba(255, 255, 255, 0.15)`
- **Активная**: `background: gradient-primary` + glow эффект
- **Disabled**: `opacity: 0.4` + cursor: not-allowed

---

### 6. FAB (Floating Action Button)

#### Визуализация
```
              ┌──────┐
              │  +   │  ← Пульсирующая кнопка
              └──────┘
```

#### Характеристики:
```css
position: fixed
bottom: 2rem (или 8rem если есть стримы)
right: 2rem
width: 56px
height: 56px
background: linear-gradient(135deg, #4CC9F0, #7209B7)
border-radius: 50%
font-size: 2rem
box-shadow: 0 8px 32px rgba(76, 201, 240, 0.4)
animation: pulse 2s ease-in-out infinite
z-index: 1000
```

#### Анимация pulse:
- Увеличение/уменьшение тени
- Пульсация каждые 2 секунды
- Hover: Поворот на 90° + scale(1.1)

---

### 7. Modals (Модальные окна)

#### AddStreamModal
```
┌───────────────────────────────────────┐
│  Add Stream                      [✕]  │
├───────────────────────────────────────┤
│                                       │
│  Stream URL                           │
│  ┌─────────────────────────────────┐ │
│  │ https://youtube.com/...         │ │
│  └─────────────────────────────────┘ │
│                                       │
│          [Cancel]  [Add Stream]       │
└───────────────────────────────────────┘
```

#### SettingsPanel
```
┌───────────────────────────────────────┐
│  Settings                        [✕]  │
├───────────────────────────────────────┤
│                                       │
│  Language                             │
│  [English] [Русский] [Українська]    │
│                                       │
│  Auto-translate                       │
│  [Toggle]                             │
│                                       │
│  Font Size                            │
│  [Small] [Medium] [Large]            │
│                                       │
│                    [Close]            │
└───────────────────────────────────────┘
```

#### Стили модалок:
```css
background: rgba(15, 15, 35, 0.95)
backdrop-filter: blur(24px)
border: 1px solid rgba(255, 255, 255, 0.18)
border-radius: 16px
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5)
animation: scaleIn 0.2s ease-out
```

---

### 8. UI Components

#### Button
```css
/* Варианты */
.button--primary     /* Gradient background */
.button--secondary   /* Ghost с border */
.button--danger      /* Красный для удаления */
.button--ghost       /* Прозрачный */

/* Размеры */
.button--sm          /* Маленькая */
.button--md          /* Средняя */
.button--lg          /* Большая */
```

#### Input
```css
background: rgba(255, 255, 255, 0.1)
border: 1px solid rgba(255, 255, 255, 0.18)
border-radius: 12px
padding: 0.625rem 0.875rem
color: white
backdrop-filter: blur(12px)

/* Focus */
border-color: #4CC9F0
box-shadow: 0 0 0 3px rgba(76, 201, 240, 0.1)
```

#### GlassCard
```css
background: rgba(255, 255, 255, 0.1)
backdrop-filter: blur(24px)
border: 1px solid rgba(255, 255, 255, 0.18)
border-radius: 16px
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3)

/* Hover */
transform: translateY(-2px)
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4)
```

#### 8. Tooltip
**Назначение**: Всплывающие подсказки при наведении

```css
.tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 4000;
  pointer-events: none;
  white-space: nowrap;
}
```

**Использование**:
- При hover на иконки и кнопки
- Показывает дополнительную информацию
- Fade-in анимация 150ms
- Позиционируется автоматически (сверху/снизу)

#### 9. SkeletonLoader
**Назначение**: Placeholder для загружающегося контента

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.05) 0%,
    rgba(255,255,255,0.1) 50%,
    rgba(255,255,255,0.05) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8px;
}
```

**Использование**:
- Карточки стримов при загрузке
- Сообщения чата при загрузке
- Плавная анимация "волны"

---

## 🌍 Internationalization (i18n)

### Поддерживаемые языки
1. **English (EN)** 🇺🇸
2. **Русский (RU)** 🇷🇺
3. **Українська (UK)** 🇺🇦

### Автоопределение языка
```javascript
// Порядок определения:
1. Сохраненный язык из localStorage
2. Язык браузера (navigator.language)
3. Язык HTML тега
4. Fallback: English
```

### Примеры переводов

#### Filters (Фильтры)
| Key | EN | RU | UK |
|-----|----|----|-----|
| filter.all | All | Все | Всі |
| filter.questions | Questions | Вопросы | Питання |
| filter.bookmarks | Bookmarks | Закладки | Закладки |
| filter.spam | Spam | Спам | Спам |

#### Chat (Чат)
| Key | EN | RU | UK |
|-----|----|----|-----|
| chat.noMessages | No messages yet | Пока нет сообщений | Поки немає повідомлень |
| chat.newMessages | New Messages | Новые сообщения | Нові повідомлення |
| chat.like | Like | Нравится | Подобається |
| chat.bookmark | Bookmark | Закладка | Закладка |
| chat.copy | Copy message | Копировать сообщение | Копіювати повідомлення |

#### Settings (Настройки)
| Key | EN | RU | UK |
|-----|----|----|-----|
| settings.title | Settings | Настройки | Налаштування |
| settings.language | Language | Язык | Мова |
| settings.autoScroll | Auto Scroll | Автопрокрутка | Автопрокрутка |
| settings.fontSize | Font Size | Размер шрифта | Розмір шрифту |

#### Connection (Подключение)
| Key | EN | RU | UK |
|-----|----|----|-----|
| connection.online | Online | Онлайн | Онлайн |
| connection.offline | Reconnecting... | Переподключение... | Перепідключення... |
| connection.connected | Connected | Подключено | Підключено |

### Переключение языка
```javascript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

// Переключение
i18n.changeLanguage('ru');

// Использование
<h1>{t('settings.title')}</h1>
// Результат: "Настройки" (если язык RU)
```

### Интерполяция
```javascript
// Пример с переменными
t('stream.viewers', { count: 1234 })
// EN: "1234 viewers"
// RU: "1234 зрителей"
```

### Особенности
- Все переводы хранятся в `/frontend/pwa/src/i18n/index.js`
- Используется библиотека `react-i18next`
- Переводы применяются мгновенно без перезагрузки
- Fallback на английский если перевод не найден
- Язык сохраняется в localStorage

---

## 📱 Экраны

### 1. AuthScreen (Экран авторизации)

**Назначение**: Приветственный экран с возможностью авторизации через Google

```
┌─────────────────────────────────────┐
│        [Animated Gradients]         │ ← 3 плавающих градиента
│                                     │
│            MellChat                 │ ← С glow эффектом
│                                     │
│   Connect your favorite streaming   │ ← Переводится
│            platforms                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔐 Login with Google        │   │ ← Primary button
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Skip for now           │   │ ← Ghost button
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

#### Визуальные особенности:
- **Фон**: Три анимированных градиентных сферы (cyan, purple, pink)
- **Логотип**: "MellChat" с мягким glow эффектом
- **Кнопки**: Full-width, размер "lg"
- **Анимации**: Fade-in при появлении, плавающие градиенты

#### Переводы:
- `auth.subtitle`: "Connect your favorite streaming platforms" / "Подключите ваши любимые платформы для стримов" / "Підключіть ваші улюблені платформи для стрімів"
- `auth.login`: "Login with Google" / "Войти через Google" / "Увійти через Google"
- `auth.skip`: "Skip for now" / "Пропустить" / "Пропустити"

#### Поведение:
- **Login**: Редирект на `${API_URL}/api/v1/auth/google`
- **Skip**: Сохраняет флаг в localStorage и переходит к Recent Streams
- **Появление**: При первом запуске или отсутствии токена/skip флага

---

### 2. RecentStreams (Недавние стримы)

**Назначение**: Показывает историю просмотренных стримов и позволяет быстро переподключиться

#### С историей:
```
┌─────────────────────────────────────┐
│      📌 Recent Streams              │ ← Переводится
│   Click to reopen a stream          │
│                                     │
│  ┌───────┬─────────────────────┐   │
│  │ 🎥    │ Stream Title    [×] │   │ ← YouTube
│  │       │ youtube             │   │
│  └───────┴─────────────────────┘   │
│                                     │
│  ┌───────┬─────────────────────┐   │
│  │ 🎮    │ Another Stream  [×] │   │ ← Twitch
│  │       │ twitch              │   │
│  └───────┴─────────────────────┘   │
│                                     │
│  ┌───────┬─────────────────────┐   │
│  │ ⚡    │ Cool Stream     [×] │   │ ← Kick
│  │       │ kick                │   │
│  └───────┴─────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   ➕ Add Stream             │   │ ← Временная кнопка
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Пустое состояние:
```
┌─────────────────────────────────────┐
│      📌 Recent Streams              │
│   Click to reopen a stream          │
│                                     │
│         📺                          │
│    No recent streams                │ ← Переводится
│  Add your first stream using        │
│      the + button above             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   ➕ Add Stream             │   │ ← Временная кнопка
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Переводы:
- `recent.title`: "Recent Streams" / "Недавние стримы" / "Недавні стріми"
- `recent.subtitle`: "Click on a stream to reconnect..." / "Нажмите на стрим для переподключения..." / "Натисніть на стрім для перепідключення..."
- `recent.empty.title`: "No recent streams" / "Нет недавних стримов" / "Немає недавніх стрімів"
- `recent.empty.subtitle`: "Add your first stream..." / "Добавьте ваш первый стрим..." / "Додайте ваш перший стрім..."
- `recent.remove`: "Remove from history" / "Удалить из истории" / "Видалити з історії"

#### Функциональность:
- **Click на карточку**: Переподключает к стриму
- **Click на [×]**: Удаляет из истории (с подтверждением)
- **Временная кнопка "Add Stream"**: Триггерит клик на глобальный FAB
- **Сортировка**: По дате последнего просмотра (новые сверху)
- **Хранение**: localStorage, ключ `recentStreams`
- **Лимит**: До 20 последних стримов

#### Визуальные особенности:
- Glass card эффект для каждого стрима
- Иконки платформ с соответствующими цветами
- Hover эффект: scale + glow
- Анимация fade-in при загрузке

---

### 3. Main Screen (Основной экран)

```
┌─────────────────────────────────────────┐
│ MellChat v2.0  [●] Online [👤] [⚙️]    │ ← Header (fixed)
├─────────────────────────────────────────┤
│ [Stream1] [Stream2] [Stream3]          │ ← Stream Cards (fixed)
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Message 1                         │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │ ← Scrollable
│  │ Message 2                         │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [All] [Questions] [Bookmarks]          │ ← Filters (fixed)
│ 🔍 [Search...]                          │ ← Search (fixed)
└─────────────────────────────────────────┘
                              ┌──┐
                              │+ │ ← FAB (fixed)
                              └──┘
```

---

### 4. Add Stream Modal (Модальное окно добавления стрима)

**Назначение**: Добавление нового стрима по URL

#### Внешний вид:
```
┌─────────────────────────────────────┐
│  ➕ Add Stream                  [✕] │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔗 Paste URL...             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌──────────────────┐              │
│  │ 🎮 Twitch        │ ← Platform    │
│  └──────────────────┘    badge     │
│                                     │
│  [Cancel]  [Connect]                │
└─────────────────────────────────────┘
```

#### Функциональность:
- **Auto-detection платформы**: При вводе URL автоматически определяет YouTube/Twitch/Kick
- **Platform badge**: Цветная иконка платформы с соответствующим цветом:
  - YouTube: 📺 #FF0000 (красный)
  - Twitch: 🎮 #9146FF (фиолетовый)
  - Kick: ⚡ #53FC18 (зеленый)
- **Валидация**: Показывает ошибку если URL невалидный
- **Loading state**: Кнопка "Connect" меняется на "⏳ Loading..."

#### Ошибки:
- ⚠️ "Please enter a URL"
- ⚠️ "Invalid stream URL. Supported: YouTube, Twitch, Kick"
- ⚠️ "Failed to add stream"

---

### 5. Settings Panel (Панель настроек)

**Назначение**: Настройка поведения приложения и внешнего вида

#### Структура панели:
```
┌─────────────────────────────────────┐
│  Settings                       [✕] │ ← Header
├─────────────────────────────────────┤
│                                     │
│  Language                           │
│  [🇺🇸 EN] [🇷🇺 RU] [🇺🇦 UK]        │
│                                     │
│  ☑ Auto Translation                 │
│                                     │
│  Font Size                          │
│  [Small] [Medium*] [Large] [XLarge] │
│                                     │
│  ☑ Auto Scroll                      │
│  Auto Scroll Delay: [====|---] 5s   │
│                                     │
│  Display Density                    │
│  [Compact] [Comfortable*] [Spacious]│
│                                     │
│  Notifications                      │
│  ☑ Notify New Messages              │
│  ☑ Notify Questions                 │
│                                     │
│  History Retention                  │
│  [30] days                          │
│                                     │
│  Nickname Colors                    │
│  [Random*] [Platform] [Mono]        │
│                                     │
├─────────────────────────────────────┤
│         [Close]                     │ ← Footer
└─────────────────────────────────────┘
```

#### Детальное описание настроек:

**1. Language (Язык интерфейса)**
- 🇺🇸 English
- 🇷🇺 Русский  
- 🇺🇦 Українська
- Сохраняется в localStorage
- Применяется мгновенно

**2. Auto Translation (Автоперевод)**
- Checkbox toggle
- Переводит сообщения на язык интерфейса
- По умолчанию: выключено

**3. Font Size (Размер шрифта)**
- Small: 0.875rem (14px)
- Medium: 1rem (16px) - по умолчанию
- Large: 1.125rem (18px)
- Extra Large: 1.25rem (20px)
- Влияет на сообщения чата

**4. Auto Scroll (Автопрокрутка)**
- Checkbox toggle
- Автоматическая прокрутка к новым сообщениям
- По умолчанию: включено

**5. Auto Scroll Delay (Задержка автопрокрутки)**
- Range slider: 3-15 секунд
- По умолчанию: 5 секунд
- Задержка перед автопрокруткой после ручного скролла
- Видна только если Auto Scroll включен

**6. Display Density (Плотность отображения)**
- Compact: минимальные отступы
- Comfortable: стандартные отступы - по умолчанию
- Spacious: увеличенные отступы
- Влияет на padding сообщений

**7. Notifications (Уведомления)**
- Notify New Messages: уведомление о каждом новом сообщении
- Notify Questions: уведомление только о вопросах (содержат "?")
- Browser notifications (требует разрешения)

**8. History Retention (Хранение истории)**
- Number input: 1-365 дней
- По умолчанию: 30 дней
- Автоматически удаляет старые записи из истории

**9. Nickname Colors (Цвета никнеймов)**
- Random: случайные цвета для каждого пользователя - по умолчанию
- Platform: цвет платформы стрима
- Mono: белый цвет для всех

---

## 🖱️ Взаимодействие (UX)

### Навигация

#### Keyboard Shortcuts
```
Ctrl/Cmd + K     → Focus на поиск
Ctrl/Cmd + N     → Добавить новый стрим
Ctrl/Cmd + ,     → Открыть настройки
Ctrl/Cmd + 1-9   → Переключение между стримами
Escape           → Закрыть модальное окно
```

#### Touch Gestures
```
Swipe Left/Right   → Переключение между стримами
Pull to Refresh    → Заблокировано (предотвращено)
Vertical Scroll    → Прокрутка сообщений
Horizontal Scroll  → Прокрутка карточек стримов / фильтров
```

#### Mouse Actions
```
Click Logo         → Закрыть все стримы → Recent Streams
Click Stream Card  → Активировать стрим
Click Close (✕)    → Закрыть стрим
Click Filter       → Применить фильтр
Hover на элементы  → Glow + scale эффект
```

---

### Feedback (Обратная связь)

#### Анимации
1. **SlideUp**: При появлении новых сообщений (0.3s ease-out)
2. **FadeIn**: При загрузке контента (0.5s ease-out)
3. **ScaleIn**: При открытии модальных окон (0.2s ease-out)
4. **Pulse**: FAB кнопка (2s infinite)
5. **Float**: Фоновые градиенты (12-15s infinite)

#### Toasts (Уведомления)
```javascript
Position: top-right
Duration: 3000ms
Styles: Glass effect + blur(24px)
Types:
  - Success: ✅ Зеленая иконка
  - Error: ❌ Красная иконка
  - Info: ℹ️ Синяя иконка
```

#### Loading States
- **Skeleton Loader**: Для карточек стримов
- **Spinner**: Для добавления стрима
- **Connection Status**: Реальное время подключения WebSocket

---

### Микроанимации

#### Buttons
```css
transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1)
hover: scale(1.05) + glow
active: scale(0.95)
```

#### Cards
```css
hover: translateY(-4px) + increased shadow
active: translateY(-2px)
```

#### Reactions
```css
click: scale animation + emoji pop (500ms)
toggle: rotate(360deg) transition
```

---

## 📱 Адаптивность

### Desktop (≥1024px)
```
- Полноразмерные карточки стримов
- Видны все фильтры в один ряд
- Hover эффекты активны
- Keyboard shortcuts доступны
```

### Tablet (768px - 1023px)
```
- Компактные карточки стримов
- Горизонтальная прокрутка фильтров
- Touch + Mouse поддержка
```

### Mobile (≤767px)
```
- Мобильные карточки (min-width: 160px)
- Swipe navigation между стримами
- Touch-оптимизированные кнопки (min 44x44px)
- FAB кнопка 48x48px
- Safe area support для iOS
```

### iOS Safari специфика
```css
/* Viewport height fix */
height: calc(var(--vh, 1vh) * 100)
min-height: -webkit-fill-available

/* Предотвращение zoom */
maximum-scale=1, user-scalable=no

/* Touch action */
-webkit-overflow-scrolling: touch
```

---

## ⚡ Performance

### Оптимизации

#### CSS
- **Backdrop-filter**: GPU ускорение
- **Will-change**: Для анимируемых элементов
- **Transform**: Вместо position для анимаций
- **Contain**: layout style для изоляции

#### React
- **useMemo**: Для фильтрации сообщений
- **useCallback**: Для event handlers
- **Debounce**: Для поиска (300ms)
- **Virtual Scrolling**: Планируется для больших списков

#### Lazy Loading
- Компоненты модалок загружаются по требованию
- Изображения платформ с loading="lazy"
- Code splitting для маршрутов

---

## 🎯 Accessibility

### ARIA
```html
role="tablist"              → Filters
role="tab"                  → Filter button
aria-selected="true"        → Active filter
aria-label="..."            → Buttons без текста
aria-controls="..."         → Связь с контролируемым контентом
```

### Keyboard Navigation
- Tab order логичный и последовательный
- Focus visible: 2px solid blue outline
- Escape для закрытия модалок
- Enter/Space для активации кнопок

### Screen Readers
- Семантический HTML (header, main, nav, article)
- Alt text для всех изображений
- aria-live для динамического контента

---

## 🔧 Технические детали

### CSS Variables
```css
/* Все переменные в :root */
--spacing-*    /* 0.25rem - 3rem */
--radius-*     /* 8px - 24px */
--shadow-*     /* sm, md, lg, xl */
--blur-*       /* 12px, 24px, 48px */
--transition-* /* 150ms, 250ms, 350ms */
```

### Z-index Scale
```
1 - Default content
10 - Chat messages
50 - Stream cards
100 - Header
1000 - FAB
2000 - Modals
3000 - Toasts
4000 - Tooltips
```

### Breakpoints
```css
mobile: 0 - 767px
tablet: 768px - 1023px
desktop: 1024px+
```

---

## 📊 Metrics

### Loading Performance
- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1

### Animation Performance
- 60 FPS для всех анимаций
- GPU acceleration для transforms
- RequestAnimationFrame для custom animations

---

## 🎨 Design Tokens

### Spacing Scale
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### Border Radius Scale
```
sm: 8px    → Small elements
md: 12px   → Cards, inputs
lg: 16px   → Large cards
xl: 24px   → Modals
full: 9999px → Buttons, avatars
```

### Shadow Scale
```
sm: subtle shadow
md: default cards
lg: hover state
xl: modals, focus
```

---

Создано: 23 октября 2024
Версия: 2.0
Автор: MellChat Team

