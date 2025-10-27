#!/bin/bash

# Скрипт для проверки подключений к Railway (PostgreSQL + Redis)
# Использование: ./check-railway-connections.sh

echo "🔍 Checking Railway connections..."

# Проверяем DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your Railway PostgreSQL URL:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    echo ""
    echo "💡 Note: Use external URL (postgres.railway.app) not internal (postgres.railway.internal)"
    exit 1
fi

# Проверяем REDIS_URL
if [ -z "$REDIS_URL" ]; then
    echo "❌ Error: REDIS_URL environment variable is not set"
    echo "Please set your Railway Redis URL:"
    echo "export REDIS_URL='redis://username:password@host:port'"
    exit 1
fi

echo "✅ Environment variables are set"

# Проверяем, что используется внешний URL
if [[ "$DATABASE_URL" == *"railway.internal"* ]]; then
    echo "⚠️  Warning: Using internal URL (railway.internal)"
    echo "💡 For external access, use external URL (railway.app)"
    echo "   Get external URL from Railway dashboard → PostgreSQL → Connect → Public Networking"
fi

# Проверяем PostgreSQL
echo "🐘 Testing PostgreSQL connection..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ PostgreSQL connection successful"
else
    echo "❌ PostgreSQL connection failed"
    echo "💡 Make sure you are using external URL (postgres.railway.app)"
    exit 1
fi

# Проверяем Redis
echo "🔴 Testing Redis connection..."
if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
    echo "✅ Redis connection successful"
else
    echo "❌ Redis connection failed"
    exit 1
fi

echo "🎉 All connections successful!"
echo "🚀 Your Railway services are ready!"
