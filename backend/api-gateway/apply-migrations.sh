#!/bin/sh

# Apply database migrations on Railway deployment
echo "🚀 Applying database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Use the improved Node.js migration script
echo "📝 Running migrations using apply-migrations.js..."
node apply-migrations.js

if [ $? -eq 0 ]; then
    echo "🎉 All migrations completed successfully!"
else
    echo "⚠️  Migration script returned non-zero exit code, but continuing to start app..."
    exit 0
fi
