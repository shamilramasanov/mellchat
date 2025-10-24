# 🔌 MellChat API Gateway

Backend service for MellChat - Multi-platform live chat aggregator.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `env.example` to `.env` and configure your environment variables:

```bash
cp env.example .env
```

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3001`

### Production

```bash
npm start
```

## 📡 API Endpoints

### Health Check
```
GET /api/v1/health
```

### Connect to Stream
```
POST /api/v1/connect
Body: { "url": "https://twitch.tv/channel" }
```

### Supported Platforms
- ✅ Twitch
- ✅ Kick
- ✅ YouTube Live

## 🔧 Environment Variables

See `env.example` for full list of required variables.

## 📦 Deployment

See [DEPLOYMENT.md](../../DEPLOYMENT.md) in the root directory for deployment instructions.

### Railway Deployment

This project is configured for Railway deployment using `railway.toml` in the root directory.

## 🔐 Security

- JWT authentication
- CORS protection
- Rate limiting
- Helmet.js security headers

## 📝 License

MIT

