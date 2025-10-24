# ✅ Deployment Checklist

## 📋 Pre-Deployment

### Backend (Railway)
- [x] `.gitignore` настроен
- [x] `railway.toml` готов
- [x] `env.example` актуален
- [x] `package.json` с правильными скриптами
- [x] README.md создан
- [ ] Все изменения закоммичены в git
- [ ] Repository запушен на GitHub

### Frontend (Vercel)
- [x] `vercel.json` создан
- [x] `.env` настроен на production URL
- [x] `.env.local` для локальной разработки
- [x] `.env.mobile` для мобильного тестирования
- [x] iOS PWA оптимизации применены
- [x] Все компоненты работают
- [ ] Все изменения закоммичены в git
- [ ] Repository запушен на GitHub

---

## 🚀 Deployment Steps

### 1. Commit & Push Changes

```bash
cd /Users/apple/Desktop/MellChat

# Add all changes
git add .

# Commit
git commit -m "feat: complete refactor with liquid glass UI, iOS PWA support, and archive system"

# Push to main
git push origin main
```

### 2. Deploy Backend (Railway)

#### Option A: Via Dashboard
1. Go to https://railway.app/dashboard
2. Create new project
3. Connect GitHub repository
4. Select root directory: `/`
5. Railway will use `railway.toml` config
6. Add environment variables (see DEPLOYMENT.md)
7. Deploy automatically starts

#### Option B: Via CLI
```bash
cd /Users/apple/Desktop/MellChat
railway login
railway link
railway up
```

**Get your Railway URL:**
```
https://mellchat-production.up.railway.app
```

### 3. Update Frontend Config

Update `.env` with your Railway URL:
```bash
cd frontend/pwa
cat > .env << 'EOF'
VITE_API_URL=https://YOUR_RAILWAY_URL
VITE_WS_URL=wss://YOUR_RAILWAY_URL
VITE_APP_NAME=MellChat
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
EOF
```

### 4. Deploy Frontend (Vercel)

#### Option A: Via Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import `MellChat` repository
4. **Root Directory**: `frontend/pwa`
5. **Framework**: Vite
6. Add environment variables from `.env`
7. Click "Deploy"

#### Option B: Via CLI
```bash
cd frontend/pwa
vercel --prod
```

**Get your Vercel URL:**
```
https://mellchat-xxxxx.vercel.app
```

### 5. Update Backend CORS

Update Railway environment variables:
```
FRONTEND_URL=https://your-vercel-url.vercel.app
CORS_ORIGIN=https://your-vercel-url.vercel.app
```

Redeploy Railway to apply changes.

### 6. Final Frontend Update

Update Vercel environment variables with final Railway URL:
```
VITE_API_URL=https://your-railway-url.railway.app
VITE_WS_URL=wss://your-railway-url.railway.app
```

Redeploy Vercel to apply changes.

---

## 🧪 Testing

### Backend Health Check
```bash
curl https://your-railway-url.railway.app/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-24T..."
}
```

### Frontend
1. Open `https://your-vercel-url.vercel.app`
2. Check console for errors
3. Try adding a stream (Twitch/Kick/YouTube)
4. Verify messages are received
5. Test on mobile device

### Mobile (iOS)
1. Open Safari on iPhone
2. Navigate to your Vercel URL
3. Tap Share → "Add to Home Screen"
4. Open app from Home Screen
5. Verify no bounce/overscroll
6. Test stream connection

---

## 📱 Mobile Testing URLs

**Development (Local Network):**
```
Frontend: http://192.168.88.22:5173
Backend:  http://192.168.88.22:3001
```

**Production:**
```
Frontend: https://your-vercel-url.vercel.app
Backend:  https://your-railway-url.railway.app
```

---

## 🔧 Troubleshooting

### Backend Issues
- Check Railway logs: `railway logs`
- Verify all env variables are set
- Check database connection (if using)

### Frontend Issues
- Check Vercel deployment logs
- Verify environment variables
- Test build locally: `npm run build && npm run preview`

### WebSocket Issues
- Ensure using `wss://` for HTTPS
- Check Railway WebSocket support is enabled
- Verify CORS settings

---

## 📊 Monitoring

### Railway
- Logs: `railway logs -f`
- Metrics in dashboard
- Alerts for failures

### Vercel
- Analytics in dashboard
- Real-time deployment logs
- Error tracking

---

## 🎉 Success Criteria

- [ ] Backend health check returns 200
- [ ] Frontend loads without errors
- [ ] Can connect to Twitch stream
- [ ] Can connect to Kick stream
- [ ] Can connect to YouTube stream
- [ ] Messages appear in real-time
- [ ] Archive system works (shows prompt on reconnect)
- [ ] Mobile PWA installs correctly
- [ ] No bounce/overscroll on iOS
- [ ] Dark/Light theme toggle works
- [ ] All buttons and cards have liquid glass effect

---

## 🔐 Security Final Check

- [ ] No API keys in frontend code
- [ ] `.env` files not committed to git
- [ ] JWT_SECRET is secure
- [ ] CORS restricted to your domain
- [ ] Rate limiting enabled
- [ ] HTTPS everywhere

---

## 📝 Post-Deployment

1. Update documentation with production URLs
2. Share with team/users
3. Monitor logs for first few hours
4. Set up uptime monitoring (UptimeRobot, etc.)
5. Configure custom domain (optional)

---

## 🚨 Rollback Plan

If something goes wrong:

**Railway:**
```bash
railway rollback
```

**Vercel:**
1. Go to deployments
2. Select previous working deployment
3. Click "Promote to Production"

---

## 📞 Support

- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- MellChat Issues: GitHub Issues

---

**Ready to deploy? Let's go! 🚀**

