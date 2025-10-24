# 🚀 MellChat Deployment Guide

## 📋 Prerequisites

- [Railway Account](https://railway.app/)
- [Vercel Account](https://vercel.com/)
- Git repository (GitHub/GitLab)

---

## 🚂 Backend Deployment (Railway)

### 1. Create New Project on Railway

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Connect Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `MellChat` repository

### 3. Configure Environment Variables

Add these variables in Railway dashboard:

```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration (if using)
POSTGRES_URL=your_postgres_connection_string
REDIS_URL=your_redis_connection_string

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=7d

# OAuth Configuration (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-railway-domain.railway.app/api/v1/auth/google/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=https://your-vercel-domain.vercel.app

# CORS Configuration
CORS_ORIGIN=https://your-vercel-domain.vercel.app

# External APIs
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_ACCESS_TOKEN=your_twitch_access_token
TWITCH_REFRESH_TOKEN=your_twitch_refresh_token

YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_API_KEY_1=your_youtube_api_key_1
YOUTUBE_API_KEY_2=your_youtube_api_key_2
YOUTUBE_API_KEY_3=your_youtube_api_key_3

# Kick API Configuration
KICK_PUSHER_APP_KEY=32cbd69e4b950bf97679
KICK_PUSHER_CLUSTER=us2
```

### 4. Deploy

Railway will automatically deploy when you push to your repository.

**Manual Deploy:**
```bash
cd backend/api-gateway
railway up
```

### 5. Get Your Backend URL

Your backend will be available at:
```
https://your-project-name.up.railway.app
```

---

## ▲ Frontend Deployment (Vercel)

### 1. Install Vercel CLI (optional)

```bash
npm install -g vercel
```

### 2. Deploy from Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your `MellChat` repository
4. Set **Root Directory** to: `frontend/pwa`
5. Framework Preset: **Vite**
6. Build Command: `npm run build`
7. Output Directory: `dist`

### 3. Configure Environment Variables

Add these in Vercel dashboard:

```env
VITE_API_URL=https://your-railway-domain.railway.app
VITE_WS_URL=wss://your-railway-domain.railway.app
VITE_APP_NAME=MellChat
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
```

### 4. Deploy

```bash
cd frontend/pwa
vercel --prod
```

Or push to your repository - Vercel will auto-deploy.

### 5. Get Your Frontend URL

Your frontend will be available at:
```
https://your-project-name.vercel.app
```

---

## 🔄 Update CORS and Redirects

After deployment, update these:

### Backend (Railway)
Update environment variables:
```env
FRONTEND_URL=https://your-actual-vercel-domain.vercel.app
CORS_ORIGIN=https://your-actual-vercel-domain.vercel.app
GOOGLE_CALLBACK_URL=https://your-actual-railway-domain.railway.app/api/v1/auth/google/callback
```

### Frontend (Vercel)
Update environment variables:
```env
VITE_API_URL=https://your-actual-railway-domain.railway.app
VITE_WS_URL=wss://your-actual-railway-domain.railway.app
```

---

## 🧪 Test Your Deployment

1. **Frontend**: Visit your Vercel URL
2. **Backend Health**: Visit `https://your-railway-url/api/v1/health`
3. **WebSocket**: Should connect automatically in the app

---

## 📱 Mobile Testing

Your PWA is now accessible from any device:
- iPhone: Add to Home Screen via Safari
- Android: Install via Chrome prompt

---

## 🔧 Troubleshooting

### Backend not connecting
- Check Railway logs: `railway logs`
- Verify environment variables are set
- Check CORS configuration

### Frontend build fails
- Check Vercel build logs
- Verify `vite.config.js` is correct
- Check Node version (should be 18+)

### WebSocket connection issues
- Ensure `wss://` protocol for HTTPS
- Check backend WebSocket server is running
- Verify firewall/proxy settings

---

## 📊 Monitoring

### Railway
- View logs: `railway logs -f`
- Metrics available in dashboard

### Vercel
- Analytics in dashboard
- Real-time logs for deployments

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is secure and unique
- [ ] Google OAuth credentials are correct
- [ ] CORS is restricted to your frontend domain
- [ ] Rate limiting is enabled
- [ ] API keys are not exposed in frontend
- [ ] Environment variables are not committed to git

---

## 🎉 You're Done!

Your MellChat application is now live! 🚀

**Links:**
- Frontend: `https://your-vercel-domain.vercel.app`
- Backend: `https://your-railway-domain.railway.app`
- API Docs: `https://your-railway-domain.railway.app/api/v1/health`

