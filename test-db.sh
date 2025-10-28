#!/bin/bash

# Скрипт для тестирования корректности работы с базой данных MellChat

echo "🧪 Тестирование интеграции с базой данных MellChat"
echo "=================================================="

# Проверяем наличие необходимых файлов
if [ ! -f "backend/api-gateway/database/test-data-integrity.sql" ]; then
    echo "❌ Файл test-data-integrity.sql не найден"
    exit 1
fi

if [ ! -f "test-database-integration.js" ]; then
    echo "❌ Файл test-database-integration.js не найден"
    exit 1
fi

# Проверяем подключение к базе данных
echo "🔍 Проверка подключения к базе данных..."
cd backend/api-gateway

# Проверяем переменные окружения
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
    echo "⚠️ Переменные DATABASE_URL или POSTGRES_URL не установлены"
    echo "Используем локальное подключение..."
fi

# Запускаем SQL тесты
echo "📊 Запуск SQL тестов целостности данных..."
if command -v psql &> /dev/null; then
    # Используем psql если доступен
    if [ ! -z "$DATABASE_URL" ]; then
        psql "$DATABASE_URL" -f database/test-data-integrity.sql
    elif [ ! -z "$POSTGRES_URL" ]; then
        psql "$POSTGRES_URL" -f database/test-data-integrity.sql
    else
        psql -h localhost -U mellchat -d mellchat -f database/test-data-integrity.sql
    fi
else
    echo "⚠️ psql не найден, пропускаем SQL тесты"
fi

# Возвращаемся в корневую директорию
cd ../..

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден"
    exit 1
fi

# Проверяем наличие axios
if ! npm list axios &> /dev/null; then
    echo "📦 Устанавливаем axios для тестов..."
    npm install axios
fi

# Запускаем JavaScript тесты
echo "🚀 Запуск JavaScript тестов интеграции..."
node test-database-integration.js

echo ""
echo "✅ Тестирование завершено!"
echo ""
echo "📋 Для ручной проверки используйте:"
echo "1. SQL запросы из database/test-data-integrity.sql"
echo "2. API endpoints:"
echo "   - GET /api/database/messages/{streamId}"
echo "   - GET /api/database/questions/{streamId}"
echo "   - GET /api/database/stats/{streamId}"
echo "   - GET /api/database/search/{streamId}"
echo "   - GET /api/database/health"
echo ""
echo "🔧 Для отладки проверьте логи в backend/api-gateway/logs/"
