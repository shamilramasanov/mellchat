#!/bin/bash

# Apply database migrations on Railway deployment
echo "🚀 Applying database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Apply moderation fields migration
echo "📝 Applying moderation fields migration..."
psql "$DATABASE_URL" -f database/migrations/add_moderation_fields.sql

if [ $? -eq 0 ]; then
    echo "✅ Moderation fields migration applied successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

echo "🎉 All migrations completed successfully!"
