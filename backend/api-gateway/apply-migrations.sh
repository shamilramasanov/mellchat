#!/bin/sh

# Apply database migrations on Railway deployment
echo "🚀 Applying database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Get script directory (works in sh)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATION_FILE="${SCRIPT_DIR}/database/migrations/add_moderation_fields.sql"

echo "📝 Script directory: ${SCRIPT_DIR}"
echo "📝 Migration file: ${MIGRATION_FILE}"

# Apply moderation fields migration using Node.js
echo "📝 Applying moderation fields migration..."
node -e "
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const migrationPath = process.env.MIGRATION_FILE || '/app/database/migrations/add_moderation_fields.sql';
    console.log('📄 Reading migration file:', migrationPath);
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSQL);
    
    console.log('✅ Moderation fields migration applied successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

runMigration();
" MIGRATION_FILE="${MIGRATION_FILE}"

if [ $? -eq 0 ]; then
    echo "🎉 All migrations completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi
