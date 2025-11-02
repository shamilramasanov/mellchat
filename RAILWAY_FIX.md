# 🔧 Исправление проблемы Railway: "Railpack could not determine how to build"

## Проблема
Railway сканирует корень репозитория и не находит Node.js проект (он находится в `backend/api-gateway`).

## Решение

### Вариант 1: Установить Root Directory (рекомендуется)

1. Зайдите в Railway Dashboard
2. Откройте ваш сервис (API Gateway)
3. Перейдите в **Settings** → **Source**
4. В поле **Root Directory** укажите: `backend/api-gateway`
5. Сохраните и перезапустите деплой

### Вариант 2: Проверить файлы конфигурации

Убедитесь, что в `backend/api-gateway/` есть:
- ✅ `package.json` 
- ✅ `nixpacks.toml`
- ✅ `railway.json`

### Вариант 3: Использовать Dockerfile вместо Nixpacks

Если Root Directory не помогает, Railway автоматически использует `Dockerfile` из `backend/api-gateway/Dockerfile` если он существует.

## Проверка

После установки Root Directory, в логах Railway должно появиться:
```
✅ Detected Node.js project
✅ Using nixpacks.toml configuration
```

Вместо:
```
✖ Railpack could not determine how to build the app
```

