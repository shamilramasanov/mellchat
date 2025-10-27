#!/bin/bash

# Скрипт для создания таблиц в Railway PostgreSQL
# Использование: ./setup-railway-db.sh

echo "🚀 Setting up MellChat database on Railway..."

# Проверяем наличие DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your Railway database URL:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Создаем таблицы
echo "📊 Creating database tables..."

# Основная схема
psql "$DATABASE_URL" -f database/schema.sql

# Миграции
echo "🔄 Applying migrations..."
psql "$DATABASE_URL" -f database/migrations/add_user_sessions.sql

# Оптимизация индексов
echo "⚡ Optimizing indexes..."
psql "$DATABASE_URL" -f database/optimize_indexes.sql

echo "✅ Database setup complete!"
echo "🎉 Your MellChat database is ready on Railway!"
