# 📱 MellChat PWA - Mobile-First Frontend

**Максимально зручний мобільний інтерфейс** для керування live chat питаннями.

## 🎯 Особливості UI/UX

### ✅ Mobile-First Design
- **Тільки вертикальна орієнтація** - оптимізовано для телефону
- **Великі тач-таргети** - мінімум 44x44px (iOS стандарт)
- **Жести та свайпи** - інтуїтивна навігація
- **Адаптивна типографіка** - `clamp()` для fluid розмірів

### ⚡ Performance
- **Instant loading** - Service Worker з кешуванням
- **Оптимізовані анімації** - 60 FPS на всіх пристроях
- **Lazy loading** - компоненти завантажуються за потребою
- **Мінімальний JavaScript** - < 100KB gzipped

### 🎨 Доступність
- **Контрастність** - WCAG AAA compliant
- **Підтримка Screen Readers** - семантичний HTML
- **Клавіатурна навігація** - всі дії доступні з клавіатури
- **Reduced Motion** - респект до `prefers-reduced-motion`

### 🔋 PWA Features
- **Офлайн робота** - кешування критичних ресурсів
- **Встановлення на головний екран** - працює як нативний додаток
- **Push сповіщення** - (опціонально)
- **Background Sync** - синхронізація при поверненні онлайн

## 🚀 Швидкий старт

### 1. Встановлення

```bash
cd frontend/pwa

# Встановіть залежності
npm install

# Створіть .env
cp env.example .env

# Відредагуйте змінні
nano .env
```

### 2. Запуск в режимі розробки

```bash
npm start
```

Додаток відкриється на `http://localhost:3000`

### 3. Тестування на реальному пристрої

**Через локальну мережу:**

```bash
# Знайдіть IP вашого Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Наприклад: 192.168.1.100
# На телефоні відкрийте: http://192.168.1.100:3000
```

**Через ngrok (для зовнішнього доступу):**

```bash
# Встановіть ngrok
brew install ngrok

# Запустіть тунель
ngrok http 3000

# Отримаєте URL типу: https://abc123.ngrok.io
```

### 4. Production Build

```bash
# Збірка для production
npm run build

# Тестування production збірки
npx serve -s build
```

## 📁 Структура файлів

```
frontend/pwa/
├── public/
│   ├── index.html              # HTML з PWA метатегами
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Service Worker
│   ├── robots.txt
│   ├── favicon.ico
│   └── icons/                  # PWA іконки
│       ├── icon-72x72.png
│       ├── icon-192x192.png
│       └── icon-512x512.png
│
├── src/
│   ├── index.js                # Entry point
│   ├── index.css               # Global styles
│   ├── App.js                  # Main component
│   └── App.css                 # Main styles
│
├── package.json
├── env.example
└── README.md
```

## 🎨 Теми і кастомізація

### Зміна кольорів

У `src/App.css` відредагуйте CSS змінні:

```css
:root {
  --accent: #6366f1;        /* Основний акцент */
  --success: #10b981;       /* Успіх */
  --danger: #ef4444;        /* Помилка */
  --warning: #f59e0b;       /* Попередження */
}
```

### Адаптація під бренд

```css
/* Градієнт логотипу */
.logo {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

## 📱 Тестування на пристроях

### iOS Safari (iPhone/iPad)
```bash
# На Mac підключіть iPhone через USB
# Safari → Develop → [Your iPhone] → localhost:3000
```

### Android Chrome
```bash
# chrome://inspect#devices
# Підключіть Android через USB
# Включіть USB debugging
```

### Емулятори

**iOS Simulator:**
```bash
# Встановіть Xcode
open -a Simulator

# Відкрийте Safari на симуляторі
# Введіть: http://localhost:3000
```

**Android Emulator:**
```bash
# Через Android Studio
# Відкрийте Chrome
# Введіть: http://10.0.2.2:3000
```

## 🔧 Налаштування Backend

У `.env` вкажіть адресу вашого backend:

```bash
REACT_APP_API_URL=http://localhost:5000
```

### API Endpoints (які очікує frontend):

```
POST   /api/connect                    # Підключення до каналу
GET    /api/questions                  # Список питань
GET    /api/messages                   # Список повідомлень
POST   /api/questions/:id/upvote       # Голосування
GET    /api/health                     # Health check
```

### Приклад відповіді `/api/questions`:

```json
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "username": "user123",
      "text": "Як почати стрімити?",
      "timestamp": "2025-10-20T12:00:00Z",
      "category": "question",
      "upvotes": 5,
      "answered": false
    }
  ],
  "total": 1,
  "answered": 0,
  "upvotes": 5
}
```

## 🐛 Відладка

### React DevTools

```bash
# Встановіть розширення для Chrome/Firefox
# https://react.dev/learn/react-developer-tools
```

### Service Worker

```bash
# Chrome DevTools → Application → Service Workers
# Можна примусово оновити або видалити
```

### Console Logs

У `.env` увімкніть debug режим:

```bash
REACT_APP_DEBUG=true
```

## 🚀 Деплой

### Vercel (рекомендовано)

```bash
# Встановіть Vercel CLI
npm i -g vercel

# Деплой
vercel

# Production деплой
vercel --prod
```

### Netlify

```bash
# Встановіть Netlify CLI
npm i -g netlify-cli

# Деплой
netlify deploy

# Production
netlify deploy --prod
```

### Firebase Hosting

```bash
# Встановіть Firebase CLI
npm i -g firebase-tools

# Логін
firebase login

# Ініціалізація
firebase init hosting

# Деплой
npm run build
firebase deploy
```

## 📊 Performance Metrics

### Lighthouse Score (target)
- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100
- **PWA:** ✓

### Bundle Size
- **Main JS:** ~50KB gzipped
- **Main CSS:** ~10KB gzipped
- **Total:** ~60KB

## 🔒 Безпека

### Content Security Policy

У `public/index.html` додайте:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' http://localhost:5000 ws://localhost:5000;">
```

## 📚 Корисні посилання

- [React Documentation](https://react.dev)
- [PWA Guidelines](https://web.dev/progressive-web-apps/)
- [iOS Design Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io)

## 🤝 Підтримка

При виникненні проблем:

1. Перевірте консоль браузера (F12)
2. Перевірте Network tab на помилки API
3. Очистіть кеш: Application → Clear storage
4. Перезапустіть `npm start`

## 📝 TODO

- [ ] Додати WebSocket для real-time оновлень
- [ ] Імплементувати Pull-to-Refresh
- [ ] Додати анімації переходів між табами
- [ ] Додати Dark/Light auto-switch за системним налаштуванням
- [ ] Додати багатомовність (i18n)
- [ ] Інтеграція з аналітикою

---

**Made with ❤️ for mobile users**
