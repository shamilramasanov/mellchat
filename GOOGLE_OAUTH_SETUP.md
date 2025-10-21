# Google OAuth Setup для MellChat

## 1. Создать Google Cloud Project

1. Открой https://console.cloud.google.com/
2. Создай новый проект "MellChat"
3. Перейди в раздел "APIs & Services" → "Credentials"

## 2. Настроить OAuth Consent Screen

1. В разделе "OAuth consent screen" выбери **External**
2. Заполни форму:
   - App name: `MellChat`
   - User support email: `твой email`
   - Developer contact: `твой email`
3. Добавь scopes:
   - `userinfo.email`
   - `userinfo.profile`
4. Сохрани и продолжи

## 3. Создать OAuth Client ID

1. Нажми "Create Credentials" → "OAuth client ID"
2. Выбери "Web application"
3. Добавь **Authorized redirect URIs**:
   ```
   http://localhost:3001/api/v1/auth/google/callback
   https://mellchat-production.up.railway.app/api/v1/auth/google/callback
   ```
4. Скопируй **Client ID** и **Client Secret**

## 4. Обновить переменные окружения

### Railway (Backend)
Зайди в настройки проекта на Railway и добавь переменные:
```bash
GOOGLE_CLIENT_ID=твой_client_id
GOOGLE_CLIENT_SECRET=твой_client_secret
GOOGLE_CALLBACK_URL=https://mellchat-production.up.railway.app/api/v1/auth/google/callback
FRONTEND_URL=https://mellchat-v5y7-git-main-shamils-projects-6a5060d0.vercel.app
JWT_SECRET=случайная_строка_32_символа
```

### Локальная разработка
Создай файл `.env` в `backend/api-gateway/`:
```bash
GOOGLE_CLIENT_ID=твой_client_id
GOOGLE_CLIENT_SECRET=твой_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-secret-key
```

## 5. Проверка

1. Открой фронтенд
2. Нажми "Настройки" → "Войти через Google"
3. Выбери аккаунт Google
4. Авторизуйся
5. Ты вернёшься в приложение с твоим профилем!

## 6. Production режим

Для production перейди в Google Cloud Console → OAuth consent screen и **опубликуй приложение** (Publish App).

