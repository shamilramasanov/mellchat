# MellChat v2.0 🚀

> **Real-time chat aggregator** for Twitch, YouTube, and Kick streams with stunning Liquid Glass UI design.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-brightgreen)](https://mellchat.vercel.app)
[![Version](https://img.shields.io/badge/Version-2.0-blue)](https://github.com/shamilramasanov/mellchat)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## ✨ Features

### 🌐 **Multi-Platform Support**
- **Twitch** - Full chat integration with emotes
- **YouTube** - Live chat and super chat support  
- **Kick** - Complete chat functionality
- **Real-time** - Instant message streaming

### 🎨 **Liquid Glass UI**
- **Glassmorphism Design** - Modern translucent effects
- **Animated Gradients** - Dynamic background animations
- **Responsive Layout** - Perfect on all devices
- **Dark Theme** - Easy on the eyes

### 💬 **Smart Chat Features**
- **Live Message Streaming** - Real-time updates
- **Smart Filters** - All, Questions, Bookmarks, Spam
- **Message Search** - Find messages by username or content
- **Unread Counter** - Track new messages per stream
- **Swipe Navigation** - Easy stream switching

### 📱 **Progressive Web App**
- **Installable** - Add to home screen
- **Offline Ready** - Works without internet
- **Push Notifications** - Stay updated
- **Mobile Optimized** - Touch-friendly interface

### 🌍 **Internationalization**
- **English** - Full support
- **Русский** - Complete Russian translation
- **Українська** - Full Ukrainian support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shamilramasanov/mellchat.git
cd mellchat
```

2. **Install Frontend Dependencies**
```bash
cd frontend/pwa
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../../backend/api-gateway
npm install
```

### Development

**Start Frontend (PWA)**
```bash
cd frontend/pwa
npm run dev
# Open http://localhost:5173
```

**Start Backend (API Gateway)**
```bash
cd backend/api-gateway
PORT=3001 npm start
# API runs on http://localhost:3001
```

## 🏗️ Project Structure

```
MellChat/
├── 📱 frontend/pwa/              # React PWA Application
│   ├── src/
│   │   ├── app/                 # Main app components
│   │   ├── features/            # Feature modules
│   │   │   ├── auth/            # Authentication
│   │   │   ├── chat/            # Chat functionality
│   │   │   ├── settings/        # User settings
│   │   │   └── streams/         # Stream management
│   │   ├── shared/              # Shared components
│   │   └── styles/              # Global styles
│   └── dist/                    # Built PWA files
├── 🔧 backend/api-gateway/       # Node.js API Server
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   └── middleware/          # Express middleware
│   └── Dockerfile               # Container config
├── 🔌 browser-extension/        # Chrome/Firefox Extension
│   ├── content/                 # Content scripts
│   ├── popup/                   # Extension popup
│   └── sidepanel/               # Side panel
└── 📄 Configuration Files
    ├── vercel.json              # Vercel deployment
    ├── railway.toml             # Railway deployment
    └── package.json             # Root dependencies
```

## 🛠️ Technologies

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool
- **Zustand** - State management
- **React i18next** - Internationalization
- **PWA** - Progressive Web App features

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **WebSocket** - Real-time communication
- **Redis** - Caching and session storage

### Platforms
- **Twitch API** - Chat integration
- **YouTube API** - Live chat support
- **Kick API** - Chat functionality

### Deployment
- **Vercel** - Frontend hosting
- **Railway** - Backend hosting
- **Docker** - Containerization

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Automatic deployment via Vercel CLI
vercel --prod

# Or connect GitHub repo to Vercel dashboard
```

### Backend (Railway)
```bash
# Deploy via Railway CLI
railway login
railway link
railway up
```

### Environment Variables

**Backend (.env)**
```env
PORT=3001
REDIS_URL=redis://localhost:6379
TWITCH_CLIENT_ID=your_twitch_client_id
YOUTUBE_API_KEY=your_youtube_api_key
KICK_API_URL=https://kick.com/api
```

## 📱 Browser Extension

The project includes a browser extension for enhanced functionality:

- **Chrome** - Full support
- **Firefox** - Complete compatibility
- **Content Scripts** - Platform integration
- **Side Panel** - Dedicated chat interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Twitch** - For the amazing streaming platform
- **YouTube** - For the comprehensive API
- **Kick** - For the innovative streaming platform
- **Vercel** - For the excellent hosting platform
- **Railway** - For the seamless backend deployment

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/shamilramasanov/mellchat/issues)
- **Discussions** - [GitHub Discussions](https://github.com/shamilramasanov/mellchat/discussions)
- **Email** - [Contact](mailto:support@mellchat.com)

---

<div align="center">

**Made with ❤️ by [Shamil Ramasanov](https://github.com/shamilramasanov)**

[⭐ Star this repo](https://github.com/shamilramasanov/mellchat) | [🐛 Report Bug](https://github.com/shamilramasanov/mellchat/issues) | [💡 Request Feature](https://github.com/shamilramasanov/mellchat/issues)

</div>