# MellChat UI Prototype

Прототип UI для MellChat в стиле Material Design.

## Особенности

- **Material Design** - легкий, современный дизайн без избыточных эффектов
- **Минималистичный** - минимум теней, максимум читаемости
- **Адаптивный** - полностью адаптивен для всех устройств
- **PWA** - работает как прогрессивное веб-приложение
- **Safe Area** - учитывает вырезы камер и системные блоки

## Запуск

```bash
npm install
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5174`

## Установка как PWA

1. Откройте приложение в браузере
2. Нажмите на кнопку "Установить" в адресной строке
3. Или используйте меню браузера: "Установить приложение"

## Сборка для production

```bash
npm run build
npm run preview
```

## Структура проекта

```
mellchat-ui-prototype/
├── src/
│   ├── components/     # React компоненты
│   ├── styles/         # Глобальные стили
│   ├── App.jsx         # Главный компонент
│   └── main.jsx        # Точка входа
├── public/             # Статические файлы
│   └── icons/          # Иконки для PWA
└── index.html          # HTML шаблон
```

## Дизайн система

### Цвета
- Primary: `#6200ee` (Material Purple)
- Secondary: `#03dac6` (Material Teal)
- Background: `#ffffff`
- Surface: `#ffffff`
- Error: `#b00020`

### Типографика
- Font Family: Roboto, system fonts
- Размеры: 12px, 14px, 16px, 18px, 20px, 24px

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

## Компоненты

- **Header** - шапка приложения
- **StreamList** - список активных стримов
- **ChatView** - просмотр чата выбранного стрима
- **Message** - карточка сообщения

## Технологии

- React 18
- Vite
- Material Design принципы
- CSS Variables
- PWA с Vite PWA Plugin

