#!/bin/bash

# Apply moderation fields migration to Railway database
# This script adds the necessary fields for moderation and analytics

echo "🚀 Applying moderation fields migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    echo "Example: export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# Apply the migration
echo "📝 Executing migration SQL..."
psql "$DATABASE_URL" -f backend/api-gateway/database/migrations/add_moderation_fields.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "📊 New fields added to messages table:"
    echo "   - connection_id (VARCHAR)"
    echo "   - is_spam (BOOLEAN)"
    echo "   - is_deleted (BOOLEAN)"
    echo "   - moderation_reason (TEXT)"
    echo "   - sentiment (VARCHAR)"
    echo "   - Indexes created for all new fields"
else
    echo "❌ Migration failed!"
    exit 1
fi
