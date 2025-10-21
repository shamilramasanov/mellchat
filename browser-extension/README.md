# MellChat Browser Extension

Кроссбраузерное расширение для фильтрации чата на стриминговых платформах.

## ✨ Возможности

- 🎯 **Фильтрация сообщений** в реальном времени
- 🚫 **Скрытие оригинального чата**
- ❓ **Отображение только вопросов**
- 🎨 **Темы**: Ретро (Win95), Windows 11, macOS
- 🌍 **Платформы**: YouTube, Twitch, Kick
- 🗣️ **Языки**: русский, английский, украинский

## 📦 Установка

### Chrome / Edge / Brave / Opera

1. Откройте `chrome://extensions/` (или `edge://extensions/`)
2. Включите **Developer mode** (Режим разработчика)
3. Нажмите **Load unpacked** (Загрузить распакованное)
4. Выберите папку `browser-extension`

### Firefox

1. Откройте `about:debugging#/runtime/this-firefox`
2. Нажмите **Load Temporary Add-on** (Загрузить временное дополнение)
3. Выберите файл `browser-extension/manifest-firefox.json`

**Примечание:** Для постоянной установки в Firefox нужно подписать расширение через [AMO](https://addons.mozilla.org/).

### Safari (macOS)

Требуется конвертация через Xcode:
```bash
xcrun safari-web-extension-converter browser-extension
```

## 🚀 Использование

1. **Откройте стрим** на YouTube, Twitch или Kick
2. **Нажмите на иконку расширения** в панели инструментов
3. **Выберите тему** и язык в настройках
4. **Чат автоматически фильтруется** - отображаются только вопросы

## 🎨 Темы

- **Ретро (Win95)**: Классический Windows 95 стиль 💾
- **Windows 11**: Современный Fluent Design 🪟
- **macOS**: Apple Human Interface Guidelines 🍎

## 🔧 Совместимость

| Браузер | Версия | Статус |
|---------|--------|--------|
| Chrome  | 114+   | ✅ Поддерживается |
| Edge    | 114+   | ✅ Поддерживается |
| Firefox | 57+    | ✅ Поддерживается |
| Opera   | 100+   | ✅ Поддерживается |
| Brave   | 1.52+  | ✅ Поддерживается |
| Safari  | 14+    | ⚠️ Требуется конвертация |

## 📁 Структура проекта

```
browser-extension/
├── manifest.json          # Chrome/Edge manifest (V3)
├── manifest-firefox.json  # Firefox manifest (V2)
├── shared/
│   └── browser-polyfill.js # Кроссбраузерный API
├── content/
│   ├── youtube.js         # YouTube content script
│   ├── twitch.js          # Twitch content script
│   ├── kick.js            # Kick content script
│   └── chat-filter.css    # Стили фильтра
├── sidepanel/
│   ├── sidepanel.html     # Боковая панель
│   ├── sidepanel.css
│   └── sidepanel.js
├── popup/
│   ├── popup.html         # Попап расширения
│   ├── popup.css
│   └── popup.js
└── icons/                 # Иконки 16/48/128px
```

## 🛠️ Разработка

### Browser API Polyfill

Расширение использует универсальный `browser-polyfill.js` для совместимости:
- `chrome.*` API (Chrome, Edge, Opera)
- `browser.*` API (Firefox)

### Тестирование

1. **Chrome**: Загрузить через `chrome://extensions/`
2. **Firefox**: Загрузить `manifest-firefox.json` через `about:debugging`
3. **Проверить** на всех платформах (YouTube, Twitch, Kick)

## 📝 TODO

- [ ] Опубликовать в Chrome Web Store
- [ ] Опубликовать в Firefox Add-ons (AMO)
- [ ] Создать версию для Safari
- [ ] Добавить иконки (сейчас заглушки)

---

**MellChat** - Live Chat Manager for Streamers
