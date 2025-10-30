# 📋 Задачи для разработки MellChat

## 🔄 Текущие задачи

### 1. Улучшение логики скролла в чате через счетчики на карточках стримов

**Статус:** ✅ **ВЫПОЛНЕНО**

**Задача:** Превратить счетчики непрочитанных сообщений и вопросов в карточках стримов в интерактивные кнопки для быстрого перехода к непрочитанному контенту.

**Реализовано:**
- ✅ Счетчики непрочитанных сообщений и вопросов стали кликабельными кнопками
- ✅ При клике на счетчик непрочитанных сообщений - скролл к первому непрочитанному сообщению
- ✅ При клике на счетчик непрочитанных вопросов - скролл к первому непрочитанному вопросу с циклической навигацией
- ✅ Если все сообщения/вопросы прочитаны - скролл к самому последнему сообщению/вопросу
- ✅ Визуальная индикация кликабельности (hover эффекты, cursor: pointer, масштабирование)
- ✅ Автоматическое переключение на стрим при клике на счетчик неактивного стрима
- ✅ Кнопки отключаются когда нет непрочитанных сообщений/вопросов

**Измененные файлы:**
- ✅ `frontend/pwa/src/features/streams/components/StreamCards.jsx` - счетчики стали кнопками с обработчиками
- ✅ `frontend/pwa/src/features/streams/components/RecentStreams.jsx` - аналогично для недавних стримов
- ✅ `frontend/pwa/src/features/chat/components/ChatContainer.jsx` - функции `scrollToFirstUnreadMessage` и `scrollToFirstUnreadQuestion`
- ✅ `frontend/pwa/src/features/streams/components/StreamCards.css` - стили для кликабельных счетчиков
- ✅ `frontend/pwa/src/features/streams/store/streamsStore.js` - регистрация функций скролла

---

### 2. Сохранение ссылки на стрим в карточке автора

**Статус:** ✅ **ВЫПОЛНЕНО**

**Задача:** При подключении к стриму по ссылке, сохранять эту ссылку как кнопку в названии автора.

**Реализовано:**
- ✅ Ссылка на стрим (`streamUrl`) сохраняется в данных стрима при добавлении
- ✅ Название автора отображается как кликабельная ссылка когда есть `streamUrl`
- ✅ При клике на название автора/ссылку - открывается оригинальный стрим в новой вкладке (`target="_blank"`)
- ✅ Работает как в активных стримах, так и в недавних стримах
- ✅ Стилизованные hover эффекты для ссылок
- ✅ `stopPropagation()` предотвращает переключение стрима при клике на ссылку

**Измененные файлы:**
- ✅ `frontend/pwa/src/features/streams/components/StreamCards.jsx` - условный рендеринг ссылки в названии автора
- ✅ `frontend/pwa/src/features/streams/components/RecentStreams.jsx` - аналогично для недавних стримов
- ✅ `frontend/pwa/src/features/streams/store/streamsStore.js` - сохранение `streamUrl` в `createStreamFromURL` и `partialize`
- ✅ `frontend/pwa/src/features/streams/components/StreamCards.css` - стили для `.stream-card__author-link`
- ✅ `frontend/pwa/src/features/streams/components/RecentStreams.css` - стили для `.recent-stream-card__author-link`

---

### 3. Автоматическое определение скопированной ссылки при добавлении стрима

**Статус:** ✅ **ВЫПОЛНЕНО И УЛУЧШЕНО**

**Задача:** При клике на поле добавления стрима автоматически предлагать вставить скопированную ссылку из буфера обмена.

**Реализовано (базовая версия):**
- ✅ При клике на поле добавления стрима автоматически проверяется буфер обмена
- ✅ Если найдена валидная ссылка на стрим - предлагается вставить её
- ✅ Добавлен UI с кнопкой "Вставить" для быстрой вставки

**Улучшения (2025-01-30):**
- ✅ **Автоматическая вставка** - ссылки вставляются автоматически при открытии модалки
- ✅ **Умная валидация в реальном времени** - поле меняет цвет и показывает статус (valid/invalid/checking)
- ✅ **Обработка Ctrl+V / Cmd+V** - мгновенная обратная связь при вставке
- ✅ **Fallback для старых браузеров** - кнопка "Вставить" если Clipboard API недоступен
- ✅ **Умные подсказки** - контекстные сообщения для каждого состояния
- ✅ **Автоматическая проверка имен авторов** - поиск стримов на всех платформах
- ✅ **Улучшенный UX** - анимации, цвета, иконки состояний, умные placeholder'ы

**Измененные файлы:**
- ✅ `frontend/pwa/src/features/streams/components/AddStreamModal.jsx` - полная переработка логики
- ✅ `frontend/pwa/src/features/streams/components/AddStreamModal.css` - стили для состояний и анимаций

---

---

### 4. Улучшение мобильного UI для PWA

**Статус:** ✅ **ВЫПОЛНЕНО**

**Задача:** Оптимизировать интерфейс для мобильных устройств (iPhone, Android и других), особенно для PWA установленных на рабочий стол. Сделать интерфейс удобным и функциональным на всех мобильных устройствах.

**Реализовано:**

1. **✅ Исправление критических проблем iOS PWA:**
   - Убраны устаревшие `-webkit-overflow-scrolling: touch` и `overscroll-behavior: none`
   - Исправлен viewport height с `100dvh` и fallback на `100vh` и `-webkit-fill-available`
   - Улучшены touch события с `touch-action: pan-y` для лучшей совместимости

2. **✅ Bottom Tab Bar навигация:**
   - Создана навигация внизу экрана с бейджами активных стримов
   - Адаптивные размеры для разных ориентаций (портрет/ландшафт)
   - Haptic feedback для touch взаимодействий

3. **✅ Компактные карточки стримов:**
   - Горизонтальный скролл с snap-to для мобильных устройств
   - Компактная высота (80px) с оптимизированным контентом
   - Убраны hover эффекты на мобильных устройствах

4. **✅ Pull-to-refresh для чата:**
   - Жест обновления чата с визуальной индикацией
   - Haptic feedback при достижении порога и успешном обновлении
   - Анимация загрузки и статусные сообщения

5. **✅ Responsive breakpoints:**
   - Адаптивность для разных размеров экранов (xs, sm, md, lg, xl, 2xl)
   - CSS переменные для определения типа устройства
   - Media queries для touch/hover устройств

6. **✅ Поддержка orientation changes:**
   - Адаптивные стили для портретной и ландшафтной ориентации
   - Хук `useOrientation` для отслеживания изменений
   - Разные размеры элементов для разных ориентаций

7. **✅ Dynamic font scaling:**
   - Автоматическое масштабирование шрифтов на основе системных настроек
   - Поддержка `prefers-reduced-motion`
   - Сохранение пользовательских предпочтений в localStorage

8. **✅ Dark mode с автоматическим переключением:**
   - Автоматическое определение системной темы
   - Кнопка переключения темы в Header
   - Поддержка `prefers-color-scheme`
   - Обновление meta theme-color для мобильных браузеров

**Измененные файлы:**
- ✅ `frontend/pwa/src/styles/globals.css` - исправления iOS PWA, responsive breakpoints, font scaling
- ✅ `frontend/pwa/src/app/App.css` - viewport height fixes
- ✅ `frontend/pwa/src/app/MainView.css` - orientation support, bottom nav padding
- ✅ `frontend/pwa/src/features/chat/components/ChatContainer.css` - iOS scroll fixes
- ✅ `frontend/pwa/src/features/streams/components/StreamCards.css` - компактные карточки
- ✅ `frontend/pwa/src/shared/components/BottomNav/` - новая навигация
- ✅ `frontend/pwa/src/shared/components/PullToRefresh/` - pull-to-refresh
- ✅ `frontend/pwa/src/shared/hooks/useOrientation.js` - хук ориентации
- ✅ `frontend/pwa/src/shared/hooks/useFontScaling.js` - масштабирование шрифтов
- ✅ `frontend/pwa/src/shared/hooks/useTheme.js` - управление темой
- ✅ `frontend/pwa/src/shared/components/ThemeProvider/` - провайдер темы
- ✅ `frontend/pwa/src/shared/components/FontScaleProvider/` - провайдер шрифтов
- ✅ `frontend/pwa/src/shared/utils/hapticFeedback.js` - haptic feedback
- ✅ `frontend/pwa/src/shared/utils/responsive.js` - responsive utilities

---

---

### 2025-10-29
- ✅ Исправлена проблема с восстановлением подключений после перезагрузки страницы
- ✅ Исправлена проблема с отображением стримов в "Последние стримы" при переходе через MellChat
- ✅ Добавлено управление пользователями и подключениями в админ панели (блокировка/разблокировка, отключение подключений)
- ✅ Удалён неиспользуемый файл `questionDetector.js`
- ✅ **Задача 3**: Реализовано автоматическое определение скопированной ссылки при добавлении стрима
  - При клике на поле добавления стрима автоматически проверяется буфер обмена
  - Если найдена валидная ссылка на стрим - предлагается вставить её
  - Добавлен UI с кнопкой "Вставить" для быстрой вставки
- ✅ **Задача 4**: Реализован упрощенный ввод имени автора с мультиплатформенным поиском
  - Можно вводить только имя автора (например "bysl4m") вместо полной ссылки
  - Автоматический поиск автора на всех платформах (Twitch, Kick)
  - Одновременное подключение ко всем найденным стримам на разных платформах
  - Показываются уведомления о количестве успешно подключенных платформ
- ✅ **Задача 6**: Удалена светлая тема из приложения
  - Удалены все CSS стили для светлой темы из `globals.css`
  - Удалена логика переключения тем из `App.jsx`
  - Удален переключатель темы из настроек (`SettingsPanel.jsx`)
  - Удалены стили светлой темы из `AnimatedBackground.css`
  - Удален компонент `ThemeToggle` и его файлы
  - Удален экспорт `ThemeToggle` из `index.js`
  - Оставлена только тёмная тема
- ✅ **Задача 5**: Улучшен мобильный UI для PWA
  - Добавлена поддержка safe area для всех мобильных устройств (iPhone, Android)
  - Шапка учитывает системные информационные блоки и вырезы камер
  - Все элементы интерфейса правильно позиционируются с учетом safe area
  - Оптимизированы размеры кнопок (минимум 44x44px для мобильных)
  - Улучшены spacing и padding для мобильных устройств
  - Подвал закреплен внизу с учетом safe area
  - Интерфейс оптимизирован для полноэкранного режима PWA
- ✅ **Задача 7**: Отменена - удален прототип UI
- ✅ **Интеграция Google Gemini**: Реализована полная интеграция Gemini API для админ панели
  - Создан сервис `geminiService.js` с полным функционалом
  - Реализованы все AI endpoints (chat, analyze-content, generate-report, optimize-system, troubleshoot)
  - Обновлен AI Insights для использования реальных данных Gemini
  - Добавлена поддержка истории диалога
  - Добавлен `GEMINI_API_KEY` в env.example
- ✅ **Очистка проекта**: Проведена комплексная очистка от неиспользуемых файлов и кода
  - Удалены 8 неиспользуемых файлов (test.js, admin.js, validator.js, PerformanceDashboard, DatabaseStatus, ThemeToggle)
  - Очищены ~150 отладочных console.log из 18 файлов
  - Удалены неиспользуемые импорты и экспорты
  - Упрощена логика переключения тем (оставлена только темная)
  - Создан отчет об очистке в `CLEANUP_REPORT.md`

---

### 5. Внедрение страницы пользователя с встроенным ИИ

**Задача:** Создать персональную страницу пользователя с встроенным ИИ-ассистентом для управления чатом в реальном времени.

**Описание функционала:**
- Персональная страница пользователя с ИИ-ассистентом
- Умная фильтрация и анализ сообщений чата
- Интерактивное управление спамом и модерацией
- Анализ интересных вопросов и сообщений

**Основные возможности ИИ-ассистента:**

1. **Анализ качества чата:**
   - "Чат, вопросы есть какие-то интересные?" → ИИ показывает топ интересных вопросов/сообщений
   - "Что происходит в чате?" → Краткий обзор активности и настроения
   - "Есть ли спам?" → Анализ спама и рекомендации по фильтрации

2. **Умная фильтрация:**
   - "Избавь меня от этого спама" → Автоматическое включение фильтра спама
   - "Покажи только вопросы" → Фильтрация только вопросов
   - "Скрыть повторяющиеся сообщения" → Фильтрация дубликатов

3. **Модерация в реальном времени:**
   - "Заблокируй этого пользователя" → Блокировка через ИИ
   - "Есть ли токсичные сообщения?" → Анализ токсичности
   - "Покажи проблемных пользователей" → Список пользователей для модерации

4. **Аналитика и инсайты:**
   - "Какие темы обсуждают?" → Анализ трендов в чате
   - "Кто самые активные зрители?" → Статистика активности
   - "Какое настроение в чате?" → Анализ sentiment

**Файлы для создания/изменения:**
- `frontend/pwa/src/features/user/` - новая папка для пользовательских функций
- `frontend/pwa/src/features/user/components/UserPage.jsx` - главная страница пользователя
- `frontend/pwa/src/features/user/components/AIAssistant.jsx` - ИИ-ассистент для пользователя
- `frontend/pwa/src/features/user/components/ChatFilter.jsx` - компонент фильтрации чата
- `frontend/pwa/src/features/user/components/ChatInsights.jsx` - аналитика чата
- `frontend/pwa/src/features/user/store/userStore.js` - состояние пользователя
- `backend/api-gateway/src/routes/user.js` - API для пользовательских функций
- `backend/api-gateway/src/services/userAIService.js` - ИИ сервис для пользователей
- `backend/api-gateway/database/migrations/add_chat_analysis.sql` - миграция для таблицы аналитики

**Схема базы данных:**
```sql
-- Таблица для хранения аналитики чата
CREATE TABLE IF NOT EXISTS chat_analysis (
    id SERIAL PRIMARY KEY,
    stream_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    sentiment VARCHAR(20) DEFAULT 'neutral', -- positive, negative, neutral
    is_spam BOOLEAN DEFAULT FALSE,
    is_question BOOLEAN DEFAULT FALSE,
    is_toxic BOOLEAN DEFAULT FALSE,
    spam_confidence FLOAT DEFAULT 0.0,
    toxicity_score FLOAT DEFAULT 0.0,
    question_confidence FLOAT DEFAULT 0.0,
    analysis_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_chat_analysis_stream_id ON chat_analysis(stream_id);
CREATE INDEX IF NOT EXISTS idx_chat_analysis_timestamp ON chat_analysis(analysis_timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_analysis_is_spam ON chat_analysis(is_spam);
CREATE INDEX IF NOT EXISTS idx_chat_analysis_is_question ON chat_analysis(is_question);
CREATE INDEX IF NOT EXISTS idx_chat_analysis_is_toxic ON chat_analysis(is_toxic);
CREATE INDEX IF NOT EXISTS idx_chat_analysis_sentiment ON chat_analysis(sentiment);
```

**Детали реализации:**

1. **Frontend (React):**
   - Современный UI с голосовым вводом (опционально)
   - Кнопка активации ИИ (только по запросу)
   - Интерактивные фильтры и настройки
   - История диалогов с ИИ
   - Быстрые команды и горячие клавиши

2. **Backend (Node.js):**
   - API endpoints для пользовательских функций
   - **ИИ активируется только по запросу** (экономия токенов)
   - Анализ данных из БД вместо real-time потока
   - Кэширование результатов анализа
   - Rate limiting для ИИ запросов

3. **База данных (PostgreSQL):**
   - Таблица `chat_analysis` для хранения аналитики
   - Поля: `stream_id`, `message_id`, `sentiment`, `is_spam`, `is_question`, `is_toxic`, `analysis_timestamp`
   - Индексы для быстрого поиска по стриму и времени
   - Автоматическое обновление при новых сообщениях

4. **ИИ функционал (по запросу):**
   - **Активация только при нажатии кнопки/команде**
   - Анализ данных из БД за последние N минут
   - Классификация спама и токсичности
   - Извлечение интересных вопросов
   - Рекомендации по модерации
   - Анализ трендов и тем

5. **Экономия токенов:**
   - ИИ не работает постоянно
   - Анализ только по запросу пользователя
   - Использование предварительно обработанных данных из БД
   - Кэширование результатов на 5-10 минут
   - Batch обработка для группового анализа

6. **Интеграция с существующим чатом:**
   - Подключение к текущим WebSocket соединениям
   - **Сохранение метаданных сообщений в БД**
   - Интеграция с системой модерации
   - Синхронизация с админ панелью

**Примеры использования:**
```
Пользователь: "Чат, что происходит?" (нажимает кнопку ИИ)
ИИ: "В чате 47 сообщений за последние 5 минут. 3 интересных вопроса о геймплее, 2 жалобы на лаги, остальное - обычный флуд. Рекомендую ответить на вопрос про босса."

Пользователь: "Избавь меня от спама" (нажимает кнопку ИИ)
ИИ: "Включил фильтр спама. Заблокировал 12 повторяющихся сообщений. Показываю только уникальный контент."

Пользователь: "Покажи интересные вопросы" (нажимает кнопку ИИ)
ИИ: "Нашел 5 интересных вопросов:
1. 'Как пройти этот квест?' - от User123
2. 'Почему игра лагает?' - от Gamer456
3. 'Когда следующий стрим?' - от Fan789"
```

**Экономия токенов:**
- ❌ **Было бы:** Постоянный анализ каждого сообщения = ~1000 токенов/час
- ✅ **Стало:** Анализ только по запросу = ~50-100 токенов/час
- 💰 **Экономия:** 90% токенов Gemini
- ⚡ **Скорость:** Мгновенные ответы из БД

**Приоритет:** Высокий
**Сложность:** Средняя-Высокая
**Время:** 2-3 недели

---

### 6. Оптимизация базы данных для максимальной информативности ИИ

**Задача:** Переработать структуру базы данных для предоставления ИИ максимального количества контекстной информации о сообщениях, пользователях и их поведении.

**Цель:** ИИ должен знать от кого, когда, какого характера приходят сообщения, чтобы давать максимально точные и релевантные ответы.

**Текущие проблемы:**
- Недостаточно метаданных о сообщениях
- Нет истории поведения пользователей
- Отсутствует контекстная информация
- ИИ работает "вслепую" без полной картины

**Новая структура БД:**

1. **Расширенная таблица сообщений:**
```sql
-- Обновленная таблица messages с полной аналитикой
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_join_time TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_message_count INTEGER DEFAULT 1;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_platform VARCHAR(50);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_followers_count INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_is_subscriber BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_is_moderator BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_length INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contains_emoji BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contains_mention BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contains_link BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS caps_ratio FLOAT DEFAULT 0.0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS repetition_score FLOAT DEFAULT 0.0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS response_to_message_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS stream_duration_at_message INTEGER; -- секунды с начала стрима
ALTER TABLE messages ADD COLUMN IF NOT EXISTS concurrent_viewers INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_position_in_stream INTEGER; -- порядковый номер в стриме
```

2. **Таблица пользователей:**
```sql
CREATE TABLE IF NOT EXISTS users_analytics (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    total_messages INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_spam_messages INTEGER DEFAULT 0,
    total_toxic_messages INTEGER DEFAULT 0,
    avg_message_length FLOAT DEFAULT 0.0,
    avg_caps_ratio FLOAT DEFAULT 0.0,
    spam_ratio FLOAT DEFAULT 0.0,
    toxicity_ratio FLOAT DEFAULT 0.0,
    question_ratio FLOAT DEFAULT 0.0,
    is_regular_user BOOLEAN DEFAULT FALSE,
    is_problematic_user BOOLEAN DEFAULT FALSE,
    user_behavior_score FLOAT DEFAULT 0.0, -- -1.0 до 1.0
    preferred_message_time TIME,
    most_active_hours JSONB,
    common_topics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

3. **Таблица контекста стримов:**
```sql
CREATE TABLE IF NOT EXISTS stream_context (
    stream_id VARCHAR(255) PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    streamer_name VARCHAR(255) NOT NULL,
    stream_title TEXT,
    stream_category VARCHAR(100),
    stream_language VARCHAR(10),
    stream_start_time TIMESTAMP NOT NULL,
    stream_end_time TIMESTAMP,
    peak_viewers INTEGER DEFAULT 0,
    avg_viewers FLOAT DEFAULT 0.0,
    total_messages INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_spam INTEGER DEFAULT 0,
    total_toxic INTEGER DEFAULT 0,
    stream_mood VARCHAR(20) DEFAULT 'neutral', -- positive, negative, neutral, chaotic
    dominant_topics JSONB,
    active_users_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

4. **Таблица временных паттернов:**
```sql
CREATE TABLE IF NOT EXISTS time_patterns (
    id SERIAL PRIMARY KEY,
    stream_id VARCHAR(255) NOT NULL,
    time_window TIMESTAMP NOT NULL, -- 5-минутные интервалы
    message_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    spam_count INTEGER DEFAULT 0,
    toxic_count INTEGER DEFAULT 0,
    avg_sentiment FLOAT DEFAULT 0.0,
    active_users INTEGER DEFAULT 0,
    viewers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

5. **Таблица связей между сообщениями:**
```sql
CREATE TABLE IF NOT EXISTS message_relationships (
    id SERIAL PRIMARY KEY,
    parent_message_id VARCHAR(255) NOT NULL,
    child_message_id VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL, -- reply, mention, reaction, spam_duplicate
    confidence FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Индексы для производительности:**
```sql
-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_stream_time ON messages(stream_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment);
CREATE INDEX IF NOT EXISTS idx_messages_is_spam ON messages(is_spam);
CREATE INDEX IF NOT EXISTS idx_messages_is_question ON messages(is_question);
CREATE INDEX IF NOT EXISTS idx_messages_user_platform ON messages(user_platform);
CREATE INDEX IF NOT EXISTS idx_messages_stream_duration ON messages(stream_duration_at_message);

CREATE INDEX IF NOT EXISTS idx_users_analytics_platform ON users_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_users_analytics_behavior ON users_analytics(user_behavior_score);
CREATE INDEX IF NOT EXISTS idx_users_analytics_problematic ON users_analytics(is_problematic_user);

CREATE INDEX IF NOT EXISTS idx_stream_context_platform ON stream_context(platform);
CREATE INDEX IF NOT EXISTS idx_stream_context_start_time ON stream_context(stream_start_time);
CREATE INDEX IF NOT EXISTS idx_stream_context_mood ON stream_context(stream_mood);

CREATE INDEX IF NOT EXISTS idx_time_patterns_stream_time ON time_patterns(stream_id, time_window);
```

**Файлы для изменения:**
- `backend/api-gateway/database/schema.sql` - обновить основную схему
- `backend/api-gateway/database/migrations/optimize_for_ai.sql` - миграция оптимизации
- `backend/api-gateway/src/handlers/messageHandler.js` - обновить обработку сообщений
- `backend/api-gateway/src/services/analyticsService.js` - добавить новые методы
- `backend/api-gateway/src/services/userAIService.js` - использовать новые данные

**Детали реализации:**

1. **Автоматическое обогащение данных:**
   - При получении сообщения - автоматически вычислять метаданные
   - Обновлять статистику пользователей в реальном времени
   - Сохранять контекст стрима и временные паттерны

2. **ИИ получает полную картину:**
   - Кто пишет (статистика пользователя, поведение, репутация)
   - Когда пишет (время стрима, активность зрителей, настроение чата)
   - Что пишет (содержание, эмоции, тип сообщения)
   - Контекст (тема стрима, категория, язык, зрители)

3. **Примеры использования ИИ:**
```
ИИ: "User123 пишет много вопросов (15 за час), обычно активен в начале стрима, 
     рейтинг поведения 0.8 (хороший пользователь). Сейчас 30 минут стрима, 
     чат в позитивном настроении, 1200 зрителей. Рекомендую ответить на его вопрос."
```

**Приоритет:** Критический
**Сложность:** Высокая
**Время:** 1-2 недели

---

### 7. Расширение ИИ-администратора для полного управления системой

**Задача:** Сделать ИИ полноценным администратором системы, способным выполнять любые задачи через админ панель по запросу.

**Цель:** ИИ должен уметь анализировать данные, принимать решения и автоматически настраивать параметры системы без ручного вмешательства.

**Основные возможности ИИ-администратора:**

1. **Умная настройка фильтров:**
   - "Настрой фильтры для этого стрима" → ИИ анализирует сообщения и устанавливает оптимальные параметры
   - "Сделай фильтр спама более строгим" → Анализ спама и корректировка порогов
   - "Настрой фильтр вопросов" → Определение паттернов вопросов и настройка детекции
   - "Оптимизируй все фильтры" → Комплексный анализ и настройка всех параметров

2. **Автоматическая модерация:**
   - "Заблокируй всех спамеров" → ИИ находит и блокирует пользователей по паттернам
   - "Найди токсичных пользователей" → Анализ поведения и блокировка
   - "Очисти чат от флуда" → Удаление повторяющихся сообщений
   - "Восстанови заблокированных пользователей" → Анализ и разблокировка по запросу

3. **Системная оптимизация:**
   - "Оптимизируй базу данных" → Анализ производительности и создание индексов
   - "Очисти старые данные" → Удаление устаревших записей
   - "Настрой кэширование" → Оптимизация кэша на основе паттернов использования
   - "Проверь здоровье системы" → Диагностика и исправление проблем

4. **Аналитика и отчеты:**
   - "Создай отчет за неделю" → Генерация детального отчета с графиками
   - "Проанализируй активность пользователей" → Глубокий анализ поведения
   - "Найди аномалии в системе" → Выявление необычных паттернов
   - "Предскажи нагрузку на завтра" → Прогнозирование на основе данных

5. **Управление пользователями:**
   - "Найди самых активных пользователей" → Ранжирование по активности
   - "Создай VIP-список" → Выбор пользователей для VIP статуса
   - "Найди проблемных пользователей" → Выявление нарушителей
   - "Оптимизируй права доступа" → Настройка ролей и разрешений

6. **Мониторинг и алерты:**
   - "Настрой уведомления" → Создание правил для алертов
   - "Мониторь производительность" → Отслеживание метрик системы
   - "Создай дашборд" → Настройка персонального дашборда
   - "Настрой логирование" → Оптимизация системы логирования

**Техническая реализация:**

1. **ИИ-команды в админ панели:**
```javascript
// Примеры команд для ИИ
const aiCommands = {
  "настрой фильтры": "analyzeAndConfigureFilters",
  "оптимизируй систему": "optimizeSystem",
  "создай отчет": "generateReport",
  "заблокируй спамеров": "blockSpammers",
  "очисти базу": "cleanupDatabase",
  "настрой алерты": "configureAlerts"
};
```

2. **API endpoints для ИИ-действий:**
```javascript
// Новые API endpoints
POST /api/v1/admin/ai/configure-filters
POST /api/v1/admin/ai/optimize-system
POST /api/v1/admin/ai/generate-report
POST /api/v1/admin/ai/block-users
POST /api/v1/admin/ai/cleanup-data
POST /api/v1/admin/ai/configure-alerts
```

3. **ИИ-сервис с полными правами:**
```javascript
// Расширенный ИИ сервис
class AIAdminService {
  async analyzeAndConfigureFilters(streamId) {
    // Анализ сообщений и настройка фильтров
  }
  
  async optimizeSystem() {
    // Оптимизация БД, кэша, индексов
  }
  
  async generateReport(timeRange) {
    // Генерация детального отчета
  }
  
  async blockSpammers(criteria) {
    // Поиск и блокировка спамеров
  }
  
  async cleanupDatabase() {
    // Очистка старых данных
  }
}
```

**Примеры использования:**

1. **Настройка фильтров:**
```
Админ: "Настрой фильтры для стрима bysl4m"
ИИ: "Анализирую 5000 сообщений за последний час...
     Найдено 15% спама, 8% вопросов, 3% токсичных сообщений.
     Устанавливаю параметры:
     - Спам: порог 0.7, блокировка повторений
     - Вопросы: детекция по знакам ?, словам 'как', 'что', 'почему'
     - Токсичность: порог 0.8, блокировка оскорблений
     Фильтры настроены и активированы!"
```

2. **Оптимизация системы:**
```
Админ: "Оптимизируй систему"
ИИ: "Анализирую производительность...
     Найдены проблемы:
     - Медленные запросы к таблице messages
     - Недостаточно индексов для поиска
     - Старые данные занимают 80% места
     
     Выполняю оптимизацию:
     - Создаю 5 новых индексов
     - Удаляю данные старше 30 дней
     - Оптимизирую кэш
     - Перезапускаю сервисы
     
     Результат: скорость запросов увеличена на 300%!"
```

3. **Управление пользователями:**
```
Админ: "Найди и заблокируй всех спамеров"
ИИ: "Анализирую поведение 1000+ пользователей...
     Найдено 23 спамера по критериям:
     - Повторяющиеся сообщения > 50%
     - Короткие сообщения < 10 символов
     - Высокий рейтинг спама > 0.8
     
     Блокирую пользователей:
     - user123, user456, user789...
     - Всего заблокировано: 23 пользователя
     - Удалено сообщений: 1,247
     
     Спам в чате снижен на 85%!"
```

**Файлы для создания/изменения:**
- `frontend/pwa/src/admin/components/AIAdminPanel.jsx` - панель ИИ-команд
- `frontend/pwa/src/admin/components/AICommandInterface.jsx` - интерфейс команд
- `backend/api-gateway/src/routes/aiAdmin.js` - API для ИИ-действий
- `backend/api-gateway/src/services/aiAdminService.js` - сервис ИИ-администратора
- `backend/api-gateway/src/services/filterOptimizationService.js` - оптимизация фильтров
- `backend/api-gateway/src/services/systemOptimizationService.js` - оптимизация системы

**Приоритет:** Критический
**Сложность:** Очень высокая
**Время:** 3-4 недели

---

### 8. Интеграция ИИ с анализом сообщений

**Задача:** Интегрировать ИИ с существующей системой анализа сообщений для более точного и контекстного анализа.

**Проблема:** Текущий анализ работает на жестких правилах и словарях, не учитывает контекст и смысл сообщений.

**Текущие проблемы:**
- Жесткие правила в `messageScoringEngine.js` и `adaptiveSpamDetector.js`
- Нет понимания контекста стрима и поведения пользователей
- Статичные пороги, не адаптирующиеся к реальным данным
- Отсутствие анализа смысла сообщений

**Решение: Гибридная ИИ-система анализа**

1. **Технический анализ (быстрый):**
   - Сохранить существующие алгоритмы для быстрой предварительной фильтрации
   - Использовать для очевидного спама (повторения, короткие сообщения)
   - Обрабатывать 80% сообщений без обращения к ИИ

2. **ИИ-анализ (контекстный):**
   - Для спорных случаев и сложных сообщений
   - Анализ с учетом контекста стрима и пользователя
   - Понимание смысла и намерений
   - Адаптация к специфике конкретного стрима

**Новая архитектура:**

1. **Двухуровневая система анализа:**
```javascript
// Быстрый технический анализ
const technicalAnalysis = {
  isSpam: adaptiveSpamDetector.detectSpam(text),
  score: messageScoringEngine.calculateMessageScore(message, features),
  classification: messageScoringEngine.classifyMessage(score)
};

// ИИ-анализ для спорных случаев
if (technicalAnalysis.score >= 25 && technicalAnalysis.score <= 60) {
  const aiAnalysis = await geminiService.analyzeMessage(message, context);
  // Объединяем результаты
}
```

2. **Контекстный анализ ИИ:**
   - История поведения пользователя
   - Тема и настроение стрима
   - Время и активность зрителей
   - Паттерны сообщений в чате

3. **Адаптивные пороги:**
   - ИИ анализирует эффективность текущих порогов
   - Автоматически корректирует параметры фильтров
   - Учитывает специфику каждого стрима

**Основные возможности:**

1. **Умная детекция спама:**
   - "Это спам?" → ИИ анализирует с учетом контекста
   - "Настрой фильтр для этого стрима" → Адаптация под специфику
   - "Найди паттерны спама" → Выявление новых типов спама

2. **Анализ качества сообщений:**
   - "Интересное ли это сообщение?" → Оценка релевантности
   - "Это вопрос?" → Точная детекция вопросов
   - "Токсичное ли сообщение?" → Анализ токсичности

3. **Контекстный анализ:**
   - "Подходит ли это сообщение для стрима?" → Анализ релевантности
   - "Нарушает ли правила чата?" → Проверка соответствия правилам
   - "Стоит ли ответить пользователю?" → Рекомендации по взаимодействию

4. **Поддержка разных типов стримов:**
   - **Игровые стримы:** Игровой жаргон, реакции на геймплей, технические вопросы
   - **Разговорные стримы:** Личные вопросы, дружеское общение, эмоции
   - **Политические стримы:** Мнения, дискуссии, конструктивная критика
   - **Образовательные стримы:** Вопросы по теме, уточнения, изучение материала
   - **Развлекательные стримы:** Юмор, реакции, развлекательный контент
   - **Новостные стримы:** Обсуждение новостей, факты, комментарии
   - **Кулинарные стримы:** Рецепты, советы, вопросы о готовке
   - **Музыкальные стримы:** Обсуждение музыки, запросы, реакции

**Техническая реализация:**

1. **Новый сервис `aiMessageAnalyzer.js`:**
```javascript
class AIMessageAnalyzer {
  // Типы стримов и их характеристики
  STREAM_TYPES = {
    gaming: {
      keywords: ['игра', 'геймплей', 'босс', 'квест', 'уровень'],
      spamPatterns: ['gg', 'ez', 'noob', 'op', 'nerf'],
      qualityIndicators: ['вопрос', 'совет', 'стратегия', 'прохождение']
    },
    political: {
      keywords: ['политика', 'выборы', 'закон', 'правительство', 'депутат'],
      spamPatterns: ['спам', 'реклама', 'оскорбления'],
      qualityIndicators: ['мнение', 'аргумент', 'факт', 'источник']
    },
    educational: {
      keywords: ['обучение', 'урок', 'лекция', 'материал', 'изучение'],
      spamPatterns: ['флуд', 'оффтоп', 'спам'],
      qualityIndicators: ['вопрос', 'уточнение', 'пример', 'объяснение']
    },
    entertainment: {
      keywords: ['развлечение', 'юмор', 'смех', 'веселье', 'прикол'],
      spamPatterns: ['спам', 'реклама'],
      qualityIndicators: ['реакция', 'эмоция', 'комментарий', 'мнение']
    }
  };

  async analyzeMessage(message, context) {
    // Определяем тип стрима
    const streamType = this.detectStreamType(context);
    
    // Технический анализ с учетом типа стрима
    const technical = this.technicalAnalysis(message, streamType);
    
    // ИИ-анализ для спорных случаев
    if (this.needsAIAnalysis(technical)) {
      const aiResult = await this.aiAnalysis(message, context, streamType);
      return this.combineResults(technical, aiResult);
    }
    
    return technical;
  }
  
  detectStreamType(context) {
    // Анализируем контекст стрима для определения типа
    const title = context.streamTitle?.toLowerCase() || '';
    const category = context.streamCategory?.toLowerCase() || '';
    const recentMessages = context.recentMessages || [];
    
    // Простой алгоритм определения типа
    for (const [type, config] of Object.entries(this.STREAM_TYPES)) {
      const keywordCount = config.keywords.filter(keyword => 
        title.includes(keyword) || category.includes(keyword)
      ).length;
      
      if (keywordCount >= 2) {
        return type;
      }
    }
    
    return 'general'; // Общий тип по умолчанию
  }
  
  async optimizeFilters(streamId, streamType) {
    // ИИ анализирует эффективность фильтров
    // с учетом типа стрима
  }
}
```

2. **Обновление `messageHandler.js`:**
```javascript
// Интеграция с ИИ-анализатором
const aiAnalyzer = require('../services/aiMessageAnalyzer');

// В методе addMessage:
const analysis = await aiAnalyzer.analyzeMessage(normalizedMessage, {
  streamId,
  streamTitle: stream.title,
  streamCategory: stream.category,
  streamLanguage: stream.language,
  userHistory: await getUserHistory(username),
  streamContext: await getStreamContext(streamId),
  chatMood: await getChatMood(streamId),
  recentMessages: await getRecentMessages(streamId, 10)
});
```

3. **API endpoints для ИИ-анализа:**
```javascript
POST /api/v1/admin/ai/analyze-message
POST /api/v1/admin/ai/optimize-filters
POST /api/v1/admin/ai/analyze-context
POST /api/v1/admin/ai/detect-stream-type
POST /api/v1/admin/ai/configure-stream-filters
```

**Примеры использования для разных типов стримов:**

1. **Игровые стримы:**
```
Сообщение: "gg ez noob"
Технический анализ: score=30, classification='low-quality'
ИИ-анализ: "Короткое сообщение, но в контексте игрового стрима это нормальная реакция на победу. Не спам."
Результат: Показать сообщение, но с низким приоритетом
```

2. **Разговорные стримы:**
```
Сообщение: "Привет! Как дела?"
Технический анализ: score=45, classification='quality'
ИИ-анализ: "Дружеское приветствие в разговорном стриме. Высокое качество, показать в приоритете."
Результат: Показать с высоким приоритетом
```

3. **Политические стримы:**
```
Сообщение: "Согласен с вашей позицией по этому вопросу"
Технический анализ: score=60, classification='quality'
ИИ-анализ: "Конструктивное мнение в политическом обсуждении. Важно для дискуссии."
Результат: Показать с высоким приоритетом
```

4. **Образовательные стримы:**
```
Сообщение: "Можете объяснить этот термин подробнее?"
Технический анализ: score=70, classification='quality'
ИИ-анализ: "Вопрос по теме образовательного стрима. Очень релевантно."
Результат: Показать с максимальным приоритетом
```

5. **Адаптация фильтров под тип стрима:**
```
Админ: "Настрой фильтры для политического стрима"
ИИ: "Анализирую 1000 сообщений...
     Найдено: 40% мнений, 30% вопросов, 20% дискуссий, 10% спама
     Оптимизирую пороги:
     - Спам: повышаю до 0.8 (строже к оффтопу)
     - Вопросы: добавляю политические термины
     - Токсичность: строже к оскорблениям
     - Релевантность: приоритет тематическим сообщениям"
```

6. **Универсальный контекстный анализ:**
```
Сообщение: "Когда следующий стрим?"
Контекст: Политический стрим, 30 минут обсуждения
ИИ: "Вопрос не по теме политического обсуждения. От постоянного зрителя. Показать в конце."
```

**Файлы для изменения:**
- `backend/api-gateway/src/services/aiMessageAnalyzer.js` - новый ИИ-анализатор
- `backend/api-gateway/src/handlers/messageHandler.js` - интеграция с ИИ
- `backend/api-gateway/src/services/messageScoringEngine.js` - обновление для работы с ИИ
- `backend/api-gateway/src/services/adaptiveSpamDetector.js` - интеграция с ИИ
- `backend/api-gateway/src/routes/aiAnalysis.js` - API для ИИ-анализа

**Преимущества универсальности:**

1. **Адаптивность к контенту:**
   - ИИ понимает специфику каждого типа стрима
   - Автоматически настраивает фильтры под контент
   - Учитывает культурные и языковые особенности

2. **Точность анализа:**
   - "gg ez" в игровом стриме = нормально
   - "gg ez" в политическом стриме = спам
   - Контекст определяет качество сообщения

3. **Масштабируемость:**
   - Легко добавлять новые типы стримов
   - Обучение на реальных данных
   - Адаптация к новым трендам

4. **Пользовательский опыт:**
   - Релевантные сообщения для каждого типа стрима
   - Меньше ложных срабатываний фильтров
   - Более точная модерация

**Приоритет:** Критический
**Сложность:** Высокая
**Время:** 2-3 недели

---

## 📊 Статус админ панели

### ✅ Реализовано:

1. **Авторизация:**
   - ✅ Login система с JWT токенами
   - ✅ Middleware для проверки прав доступа

2. **Dashboard (Главная панель):**
   - ✅ Real-time метрики (активные соединения, сообщения/сек, пользователи онлайн)
   - ✅ Интерактивные графики (message flow, platform distribution)
   - ✅ AI Insights с рекомендациями (теперь с Gemini)
   - ✅ System Alerts

3. **System Management (Управление системой):**
   - ✅ Управление подключениями (просмотр активных, отключение)
   - ✅ Управление пользователями (просмотр подключенных, блокировка/разблокировка)
   - ✅ Отправка сообщений:
     - ✅ Broadcast сообщения всем пользователям
     - ✅ Персональные сообщения конкретным пользователям
   - ✅ Health check системы

4. **AI Assistant:**
   - ✅ Базовый интерфейс для чата с ИИ
   - ✅ API endpoint для общения с AI (с Gemini)
   - ✅ Интеграция Google Gemini (полная)
   - ✅ Поддержка истории диалога

### ✅ Полностью реализовано:

1. **Analytics** ✅ (backend + frontend)
   - ✅ Аналитика по платформам (Twitch, YouTube, Kick)
   - ✅ Отчеты по времени, стримам, пользователям
   - ✅ Качество контента (спам, sentiment, вопросы)
   - ✅ Пользовательская активность
   - ✅ ИИ-генерируемые отчеты через Gemini
   - ✅ Графики и таблицы на frontend

2. **Moderation** ✅ (backend + frontend)
   - ✅ Автоматическая модерация через Gemini
   - ✅ ИИ-анализ контента (спам + токсичность)
   - ✅ Блокировка/разблокировка пользователей
   - ✅ Статистика модерации
   - ✅ История модерации
   - ✅ Анализ сообщений в реальном времени

3. **Database Management** ✅ (backend + frontend)
   - ✅ Мониторинг БД (table sizes, index usage, slow queries)
   - ✅ Мониторинг пула соединений
   - ✅ ИИ-анализ БД через Gemini с рекомендациями
   - ✅ Отображение медленных запросов

4. **Security & Access** ✅ (backend + frontend)
   - ✅ Audit logging всех действий админа
   - ✅ Role-based access control (базовая версия)
   - ✅ Статистика по действиям
   - ✅ Просмотр ролей и прав доступа
   - ⏳ 2FA (в планах)
   - ⏳ Расширенный мониторинг безопасности (в планах)

### ✅ Все основные модули реализованы!

**Статус:** 🎉 Все 4 модуля полностью реализованы (backend + frontend)

**Что работает:**
- ✅ Analytics с графиками и отчетами
- ✅ Moderation с ИИ модерацией
- ✅ Database Management с мониторингом
- ✅ Security с audit logging и RBAC

### 📝 Будущие улучшения (опционально):

1. **Расширение функционала:**
   - ⏳ 2FA для админов
   - ⏳ Appeal система для пользователей
   - ⏳ Более детальный threat detection
   - ⏳ Streaming responses для Gemini (real-time)

2. **Оптимизации:**
   - ⏳ Кэширование аналитики
   - ⏳ Batch обработка модерации
   - ⏳ Автоматическая оптимизация БД на основе рекомендаций Gemini

---

## 📝 Примечания

- Все задачи должны быть реализованы с учётом существующих паттернов кода
- Тестировать на production окружении перед коммитом
- Следовать правилам из `.cursorrules`
