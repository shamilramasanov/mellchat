# MellChat v2.0 - Frontend PWA

Modern Progressive Web Application for multi-platform streaming chat aggregation.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Zustand** - State management
- **Socket.io** - Real-time communication
- **i18next** - Internationalization
- **Framer Motion** - Animations
- **Axios** - HTTP client

## 📁 Project Structure

```
src/
├── app/              # App entry & layout
├── features/         # Feature-based modules
│   ├── auth/        # Authentication
│   ├── chat/        # Chat functionality
│   ├── streams/     # Stream management
│   └── settings/    # Settings
├── shared/          # Shared code
│   ├── components/  # UI Kit
│   ├── hooks/       # Custom hooks
│   ├── services/    # API & WebSocket
│   └── utils/       # Utilities
├── i18n/            # Translations
└── styles/          # Global styles
```

## 🌍 Supported Languages

- 🇺🇸 English
- 🇷🇺 Русский
- 🇺🇦 Українська

## 🎨 Design System

**Liquid Glass** - Modern glassmorphism design with:
- Backdrop blur effects
- Gradient accents (Cyan → Purple → Pink)
- Smooth animations
- Dark theme optimized

## 📱 PWA Features

- ✅ Installable on mobile/desktop
- ✅ Offline support
- ✅ Push notifications
- ✅ iOS Safari optimized

## 🔗 Backend Integration

Configure API URLs in `.env`:

```env
VITE_API_URL=https://your-api-url.com
VITE_WS_URL=wss://your-api-url.com
```

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Output directory: dist/
```

Deploy to:
- Vercel
- Netlify
- Railway
- Any static hosting

## 🧪 Development

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 📄 License

MIT License

---

Built with ❤️ by MellChat Team

