# 🔑 Добавить GEMINI_API_KEY в Railway

## Проблема
Gemini API ключ не установлен в Railway, поэтому AI функции не работают.

## Решение

### 1. Получить API ключ Gemini
- Зайти в [Google AI Studio](https://aistudio.google.com/)
- Создать новый API ключ
- Скопировать ключ

### 2. Добавить в Railway
1. Зайти в [Railway Dashboard](https://railway.app/)
2. Выбрать проект MellChat
3. Перейти в Variables
4. Добавить новую переменную:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `ваш_api_ключ_здесь`

### 3. Проверить
После добавления ключа:
- Railway автоматически перезапустит сервис
- AI функции заработают
- Можно проверить модели через: `https://mellchat-production.up.railway.app/api/v1/ai/models`

## Альтернативно через Railway CLI
```bash
railway variables set GEMINI_API_KEY="ваш_api_ключ_здесь"
```
