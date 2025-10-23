# MellChat v2.0

Real-time chat aggregator for Twitch, YouTube, and Kick streams with Liquid Glass UI design.

## Features

- 🌐 **Multi-platform Support**: Twitch, YouTube, Kick
- 💬 **Real-time Chat**: Live message streaming from all platforms
- 🎨 **Liquid Glass UI**: Modern glassmorphism design with animated gradients
- 📱 **PWA Ready**: Progressive Web App with proper scroll handling
- 🌍 **Multi-language**: English, Russian, Ukrainian support
- 🔍 **Smart Filters**: All, Questions, All Questions, Bookmarks, Spam
- ⚡ **Fast & Responsive**: Optimized for mobile and desktop

## Quick Start

### Frontend (PWA)
```bash
cd frontend/pwa
npm install
npm start
```

### Backend (API Gateway)
```bash
cd backend/api-gateway
npm install
PORT=3001 npm start
```

## Deployment

### Vercel (Frontend)
The project is configured with `vercel.json` for easy deployment to Vercel.

### Railway (Backend)
Backend is deployed on Railway with environment variables configured.

## Project Structure

```
├── frontend/pwa/          # React PWA application
├── backend/api-gateway/   # Node.js API server
├── browser-extension/     # Chrome/Firefox extension
└── vercel.json           # Vercel deployment config
```

## Technologies

- **Frontend**: React, PWA, Liquid Glass UI
- **Backend**: Node.js, Express, WebSocket
- **Platforms**: Twitch, YouTube, Kick APIs
- **Deployment**: Vercel, Railway

## License

MIT License
