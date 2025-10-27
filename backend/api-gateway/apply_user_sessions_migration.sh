#!/bin/bash

# Apply user_sessions migration
# This script adds the user_sessions table for adaptive message loading

echo "🔄 Applying user_sessions migration..."

# Check if database connection is available
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL before running this script"
    echo "Example: export DATABASE_URL=postgresql://user:password@localhost:5432/mellchat"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/database/migrations/add_user_sessions.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Apply migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "✅ user_sessions migration applied successfully"
    echo "📊 New table created: user_sessions"
    echo "🎯 Ready for adaptive message loading strategies"
else
    echo "❌ Migration failed"
    exit 1
fi
